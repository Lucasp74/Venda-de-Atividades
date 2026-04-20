'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'Nunito, sans-serif', background: '#FFF8F9', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#2D2D2D', marginBottom: '1rem' }}>Algo deu errado</h2>
          <p style={{ color: '#777', marginBottom: '1.5rem' }}>Ocorreu um erro inesperado.</p>
          <button
            onClick={() => reset()}
            style={{
              background: '#FF6B9D',
              color: '#fff',
              border: 'none',
              borderRadius: '9999px',
              padding: '12px 32px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
