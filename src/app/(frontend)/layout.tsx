import type { Metadata } from 'next'
import { Nunito, Poppins } from 'next/font/google'
import { Suspense } from 'react'
import '../globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Analytics from '@/components/Analytics'

const poppins = Poppins({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display:  'swap',
})

const nunito = Nunito({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700', '800'],
  variable: '--font-nunito',
  display:  'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://prodani.com.br'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:  'Atividades de Alfabetização - Prô Dani',
    template: '%s | Prô Dani',
  },
  description:
    'Atividades de alfabetização e consciência fonológica para professores da Educação Infantil ao Fundamental 1. PDFs prontos para imprimir. Download imediato.',
  keywords: [
    'atividades de alfabetização',
    'atividades para professores',
    'educação infantil',
    'fundamental 1',
    'consciência fonológica',
    'atividades pedagógicas',
    'material didático',
    'atividades para imprimir',
    'professora Dani',
  ],
  authors: [{ name: 'Prô Dani' }],
  creator: 'Prô Dani',
  openGraph: {
    type:      'website',
    locale:    'pt_BR',
    siteName:  'Prô Dani',
    url:       BASE_URL,
    title:     'Atividades de Alfabetização - Prô Dani',
    description:
      'Atividades de alfabetização e consciência fonológica para professores da Educação Infantil ao Fundamental 1. PDFs prontos para imprimir.',
    images: [{
      url:    '/og-image.png',
      width:  1200,
      height: 630,
      alt:    'Prô Dani — Atividades de Alfabetização',
    }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Atividades de Alfabetização - Prô Dani',
    description: 'Atividades de alfabetização para professores da Educação Infantil ao Fundamental 1.',
    images:      ['/og-image.png'],
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${nunito.variable}`}>
      <body className="font-body bg-surface-soft text-ink antialiased">
        <Navbar />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        {/*
         * ── Analytics (GA4 + Google Ads) ──────────────────────────
         * Carrega com estratégia "afterInteractive" — não bloqueia.
         * Suspense é necessário pois o componente usa useSearchParams().
         * Preencha NEXT_PUBLIC_GA_MEASUREMENT_ID e NEXT_PUBLIC_GADS_ID
         * no .env.local para ativar. Sem as variáveis, nada é carregado.
         */}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
