/**
 * ─────────────────────────────────────────────────────────────
 *  Rate Limiter — Vercel KV (Upstash Redis) com fallback in-memory
 * ─────────────────────────────────────────────────────────────
 *
 *  Em produção (Vercel) usa o KV compartilhado entre todas as
 *  instâncias — garante que o bloqueio por IP funcione de verdade.
 *
 *  Em desenvolvimento local (sem KV_REST_API_URL), cai no
 *  contador in-memory automaticamente — sem configuração extra.
 *
 *  Algoritmo: fixed window por IP.
 *  Chave Redis: rl:{ip}:{janela}  (ex: rl:177.x.x.x:28567)
 * ─────────────────────────────────────────────────────────────
 */

import { kv } from '@vercel/kv'

type RateLimitConfig = {
  /** Janela de tempo em milissegundos (padrão: 60 000 = 1 min) */
  interval?: number
  /** Máximo de requisições permitidas dentro da janela */
  limit: number
}

export type RateLimitResult = {
  success:   boolean
  remaining: number
  reset:     number  // timestamp ms quando a janela expira
}

// ── Fallback in-memory (desenvolvimento local) ────────────────
type MemEntry = { timestamps: number[] }
const memStore = new Map<string, MemEntry>()

function memCheck(ip: string, interval: number, limit: number): RateLimitResult {
  const now    = Date.now()
  const cutoff = now - interval
  const entry  = memStore.get(ip) ?? { timestamps: [] }

  entry.timestamps = entry.timestamps.filter(t => t > cutoff)

  if (entry.timestamps.length >= limit) {
    return { success: false, remaining: 0, reset: entry.timestamps[0] + interval }
  }

  entry.timestamps.push(now)
  memStore.set(ip, entry)

  return {
    success:   true,
    remaining: limit - entry.timestamps.length,
    reset:     entry.timestamps[0] + interval,
  }
}

// ── Rate limiter principal ────────────────────────────────────
export function rateLimit({ interval = 60_000, limit }: RateLimitConfig) {
  return async function check(ip: string): Promise<RateLimitResult> {
    // Sem KV configurado → fallback in-memory (dev local)
    if (!process.env.KV_REST_API_URL) {
      return memCheck(ip, interval, limit)
    }

    try {
      // Chave por janela fixa: muda a cada `interval` ms
      const window = Math.floor(Date.now() / interval)
      const key    = `rl:${ip}:${window}`
      const ttlSec = Math.ceil(interval / 1000) + 1

      // INCR atômico — seguro contra race conditions
      const count = await kv.incr(key)
      if (count === 1) {
        // Primeira requisição da janela — define expiração
        await kv.expire(key, ttlSec)
      }

      const windowStart = window * interval
      return {
        success:   count <= limit,
        remaining: Math.max(0, limit - count),
        reset:     windowStart + interval,
      }
    } catch {
      // Falha no KV → permite a requisição (fail open) para não bloquear clientes
      console.warn('[RateLimit] KV indisponível — permitindo requisição')
      return { success: true, remaining: 1, reset: Date.now() + interval }
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────

/** Extrai o IP real da requisição (considera proxies Vercel/Cloudflare) */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return '127.0.0.1'
}

/** Resposta padrão 429 com headers de rate limit */
export function rateLimitResponse(result: RateLimitResult) {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
  return new Response(
    JSON.stringify({ error: 'Muitas requisições. Tente novamente em instantes.' }),
    {
      status: 429,
      headers: {
        'Content-Type':          'application/json',
        'Retry-After':           String(Math.max(retryAfter, 1)),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    },
  )
}
