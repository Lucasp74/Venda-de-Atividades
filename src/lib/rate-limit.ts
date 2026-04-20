/**
 * Rate Limiter in-memory para API routes do Next.js.
 *
 * Usa sliding window por IP. Entradas expiradas são removidas
 * automaticamente para evitar vazamento de memória.
 */

type RateLimitEntry = {
  timestamps: number[]
}

type RateLimitConfig = {
  /** Janela de tempo em milissegundos (padrão: 60 000 = 1 min) */
  interval?: number
  /** Máximo de requisições permitidas dentro da janela */
  limit: number
}

type RateLimitResult = {
  success: boolean
  /** Requisições restantes na janela atual */
  remaining: number
  /** Timestamp (ms) de quando a janela reseta para a entrada mais antiga */
  reset: number
}

const CLEANUP_INTERVAL = 5 * 60_000 // limpa entradas expiradas a cada 5 min

export function rateLimit({ interval = 60_000, limit }: RateLimitConfig) {
  const store = new Map<string, RateLimitEntry>()
  let lastCleanup = Date.now()

  function cleanup(now: number) {
    if (now - lastCleanup < CLEANUP_INTERVAL) return
    lastCleanup = now
    const cutoff = now - interval

    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
      if (entry.timestamps.length === 0) store.delete(key)
    }
  }

  return function check(key: string): RateLimitResult {
    const now = Date.now()
    cleanup(now)

    const cutoff = now - interval
    const entry = store.get(key) ?? { timestamps: [] }

    // Remove timestamps fora da janela
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

    if (entry.timestamps.length >= limit) {
      const oldestInWindow = entry.timestamps[0]
      return {
        success: false,
        remaining: 0,
        reset: oldestInWindow + interval,
      }
    }

    entry.timestamps.push(now)
    store.set(key, entry)

    return {
      success: true,
      remaining: limit - entry.timestamps.length,
      reset: entry.timestamps[0] + interval,
    }
  }
}

/**
 * Extrai o IP real da requisição (considera proxies como Vercel/Cloudflare).
 */
export function getClientIp(req: Request): string {
  const headers = req.headers

  // Vercel / Cloudflare / proxies comuns
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return '127.0.0.1'
}

/**
 * Resposta padrão 429 com headers de rate limit.
 */
export function rateLimitResponse(result: RateLimitResult) {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

  return new Response(
    JSON.stringify({ error: 'Muitas requisições. Tente novamente em instantes.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.max(retryAfter, 1)),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    },
  )
}
