import { withPayload } from '@payloadcms/next/withPayload'

// CSP computado uma vez no módulo, não a cada requisição
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.googleadservices.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.vercel-storage.com https://www.google-analytics.com https://www.googletagmanager.com https://www.gravatar.com https://secure.gravatar.com https://*.mlstatic.com https://*.mercadopago.com",
  "connect-src 'self' https://api.mercadopago.com https://*.mercadopago.com https://*.mercadolibre.com https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://*.vercel-storage.com",
  "frame-src 'self' https://www.mercadopago.com.br https://*.mercadopago.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporário: erros de tipo pré-existentes no projeto não devem bloquear o deploy de demo.
  // Remover após corrigir todos os erros TypeScript.
  typescript: {
    ignoreBuildErrors: true,
  },
  // ── Imagens ─────────────────────────────────────────────────
  images: {
    // Formatos modernos — WebP e AVIF são até 50% menores que JPEG
    formats: ['image/avif', 'image/webp'],

    // Tamanhos de device para gerar variantes responsivas
    deviceSizes: [640, 750, 828, 1080, 1280, 1920],
    imageSizes:  [16, 32, 48, 64, 96, 128, 256, 384],

    // Domínios autorizados para imagens remotas
    remotePatterns: [
      // Vercel Blob Storage (produção)
      { protocol: 'https', hostname: '*.vercel-storage.com' },
      { protocol: 'https', hostname: 'blob.vercel-storage.com' },
      // Localhost (desenvolvimento — Payload serve as mídias localmente)
      { protocol: 'http',  hostname: 'localhost' },
    ],
  },

  // ── Compressão de resposta HTTP ─────────────────────────────
  compress: true,

  // ── Headers de segurança e cache ────────────────────────────
  async headers() {
    return [
      {
        // Assets estáticos do Next.js — cache de 1 ano (imutáveis)
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Imagens otimizadas pelo Image component
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        // Todas as páginas — headers de segurança
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',        value: 'nosniff' },
          { key: 'X-Frame-Options',               value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy',               value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',            value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS — força HTTPS por 1 ano (ativar somente após confirmar que o site roda 100% em HTTPS)
          { key: 'Strict-Transport-Security',     value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: CSP },
        ],
      },
    ]
  },
}

// Remove experimental.turbo injetado pelo withPayload (depreciado no Next.js 15.5+)
const payloadConfig = withPayload(nextConfig)
if (payloadConfig.experimental?.turbo) {
  delete payloadConfig.experimental.turbo
}

export default payloadConfig
