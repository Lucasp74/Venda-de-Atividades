import type { NextRequest } from 'next/server'

/**
 * Verifica se a requisição vem de uma origem permitida (proteção CSRF).
 *
 * Usa comparação exata de protocolo + host para evitar o bypass que
 * `source.startsWith(url)` permite (ex: https://profdani.com.br.evil.com
 * passaria num startsWith ingênuo contra "https://profdani.com.br").
 */
export function isAllowedOrigin(req: NextRequest): boolean {
  const origin  = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const base    = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  // Constrói o conjunto de origens permitidas (produção + dev local)
  const allowedHosts = new Set<string>()
  for (const raw of [base, 'http://localhost:3000']) {
    try {
      const u = new URL(raw)
      allowedHosts.add(`${u.protocol}//${u.host}`)
    } catch {
      // URL inválida na env — ignora
    }
  }

  // Prefers Origin (mais confiável); cai para Referer como fallback
  const source = origin ?? referer ?? ''
  if (!source) return false

  try {
    const src = new URL(source)
    return allowedHosts.has(`${src.protocol}//${src.host}`)
  } catch {
    return false
  }
}
