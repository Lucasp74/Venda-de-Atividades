import type { NextRequest } from 'next/server'

/**
 * Verifica se a requisição vem de uma origem permitida (proteção CSRF).
 *
 * Estratégia em três camadas — da mais confiável para a menos:
 * 1. Header Host  — sempre presente, definido pela infraestrutura (Vercel/proxy)
 * 2. Header Origin — enviado pelo browser em POSTs (pode ser nulo em proxies)
 * 3. Header Referer — fallback quando Origin não está disponível
 */
export function isAllowedOrigin(req: NextRequest): boolean {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  // Monta conjunto de hosts permitidos (www e non-www de cada origem)
  const allowedHosts = new Set<string>()
  for (const raw of [base, 'http://localhost:3000']) {
    try {
      const h = new URL(raw).host
      allowedHosts.add(h)
      // Aceita também a variante www ↔ non-www
      if (h.startsWith('www.')) {
        allowedHosts.add(h.slice(4))
      } else {
        allowedHosts.add(`www.${h}`)
      }
    } catch {
      // URL inválida na env — ignora
    }
  }

  // 1. Host header — mais confiável em ambientes com proxy (Vercel)
  const host = req.headers.get('host') ?? ''
  if (host && allowedHosts.has(host)) return true

  // 2. Origin header
  const origin = req.headers.get('origin')
  if (origin) {
    try {
      if (allowedHosts.has(new URL(origin).host)) return true
    } catch { /* ignora */ }
  }

  // 3. Referer como último recurso
  const referer = req.headers.get('referer')
  if (referer) {
    try {
      if (allowedHosts.has(new URL(referer).host)) return true
    } catch { /* ignora */ }
  }

  return false
}
