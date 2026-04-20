'use client'

/**
 * ─────────────────────────────────────────────────────────────
 *  Componente Analytics — GA4 + Google Ads
 * ─────────────────────────────────────────────────────────────
 *  Carrega os scripts do Google Analytics 4 e Google Ads
 *  com estratégia "afterInteractive" (não bloqueia o render).
 *
 *  Adicione ao layout raiz do frontend:
 *    import Analytics from '@/components/Analytics'
 *    <Analytics />
 *
 *  Os scripts SÓ são inseridos se as variáveis de ambiente
 *  correspondentes estiverem preenchidas no .env.local.
 *  Em desenvolvimento sem as chaves, nenhum script é carregado.
 * ─────────────────────────────────────────────────────────────
 */

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { GA_MEASUREMENT_ID, trackPageView } from '@/lib/analytics'
import { GADS_ID } from '@/lib/ads'

// ID único do script para evitar duplicatas
const PRIMARY_ID = GA_MEASUREMENT_ID || GADS_ID

export default function Analytics() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  // Rastreia mudanças de rota (navegação SPA)
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    trackPageView(url)
  }, [pathname, searchParams])

  // Não renderiza nada se nenhuma integração estiver configurada
  if (!PRIMARY_ID) return null

  return (
    <>
      {/* Script principal do Google (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${PRIMARY_ID}`}
        strategy="afterInteractive"
      />

      {/* Configuração inline do gtag */}
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            ${GA_MEASUREMENT_ID ? `gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: true,
              anonymize_ip: true,
            });` : ''}

            ${GADS_ID ? `gtag('config', '${GADS_ID}');` : ''}
          `,
        }}
      />
    </>
  )
}
