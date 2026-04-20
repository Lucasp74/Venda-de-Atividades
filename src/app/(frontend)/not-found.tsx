import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h2 className="text-h1 font-heading text-ink mb-4">404</h2>
      <p className="text-body-lg text-ink-muted mb-6">Página não encontrada.</p>
      <Link href="/" className="btn-primary">
        Voltar para o início
      </Link>
    </div>
  )
}
