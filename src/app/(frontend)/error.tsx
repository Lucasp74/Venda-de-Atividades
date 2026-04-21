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
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-h3 font-heading text-ink mb-2">Ops! Algo deu errado</h2>
      <p className="text-ink-muted mb-2">Ocorreu um erro ao carregar esta página.</p>

      {error?.digest && (
        <p className="text-caption text-ink-light mb-6">
          Código do erro: <span className="font-mono">{error.digest}</span>
        </p>
      )}

      <button
        onClick={() => reset()}
        className="btn-primary mt-2"
      >
        Tentar novamente
      </button>

      {error?.digest && (
        <p className="text-caption text-ink-light mt-6 max-w-sm">
          Se o problema persistir, anote o código do erro acima e entre em contato.
        </p>
      )}
    </div>
  )
}
