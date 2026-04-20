'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h2 className="text-h3 font-heading text-ink mb-4">Ops! Algo deu errado</h2>
      <p className="text-ink-muted mb-6">Ocorreu um erro ao carregar esta página.</p>
      <button
        onClick={() => reset()}
        className="btn-primary"
      >
        Tentar novamente
      </button>
    </div>
  )
}
