import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Pagamento não aprovado' }

export default function FalouPage() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center py-20" aria-labelledby="fail-heading">
      <div className="container-main text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl mx-auto mb-6" aria-hidden="true">
          😕
        </div>
        <h1 id="fail-heading" className="font-heading text-h1 text-ink mb-3">
          Pagamento não aprovado
        </h1>
        <p className="text-ink-muted text-body-lg mb-8 leading-relaxed">
          Não conseguimos processar seu pagamento. Verifique os dados do cartão ou tente outro método de pagamento.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/atividades" className="btn-primary">Tentar novamente</Link>
          <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" className="btn-outline">
            Preciso de ajuda
          </a>
        </div>
      </div>
    </section>
  )
}
