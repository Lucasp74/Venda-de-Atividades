import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
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
        // Todas as páginas — headers de segurança básicos
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff'        },
          { key: 'X-Frame-Options',            value: 'SAMEORIGIN'     },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
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
