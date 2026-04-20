import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Pagamento em análise' }

export default function PendentePage() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center py-20" aria-labelledby="pending-heading">
      <div className="container-main text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center text-4xl mx-auto mb-6" aria-hidden="true">
          ⏳
        </div>
        <h1 id="pending-heading" className="font-heading text-h1 text-ink mb-3">
          Pagamento em análise
        </h1>
        <p className="text-ink-muted text-body-lg mb-4 leading-relaxed">
          Seu pagamento está sendo processado. Assim que for confirmado, você receberá o link de download no seu e-mail.
        </p>
        <p className="text-body-sm text-ink-muted bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 mb-8">
          Pagamentos via boleto podem levar até 3 dias úteis para serem compensados.
        </p>
        <Link href="/" className="btn-primary">Voltar para o início</Link>
      </div>
    </section>
  )
}
