import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Pagamento Confirmado!' }

export default function SucessoPage() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center py-20" aria-labelledby="success-heading">
      <div className="container-main text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl mx-auto mb-6" aria-hidden="true">
          🎉
        </div>
        <h1 id="success-heading" className="font-heading text-h1 text-ink mb-3">
          Pagamento confirmado!
        </h1>
        <p className="text-ink-muted text-body-lg mb-6 leading-relaxed">
          Oba! Seu pagamento foi aprovado. Em instantes você receberá o link de download no seu e-mail.
        </p>
        <p className="text-body-sm text-ink-muted bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-8">
          Verifique também a caixa de spam, às vezes o e-mail pode ir para lá.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/atividades" className="btn-primary">Ver mais atividades</Link>
          <Link href="/" className="btn-outline">Voltar para o início</Link>
        </div>
      </div>
    </section>
  )
}
