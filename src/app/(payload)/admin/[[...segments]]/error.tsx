'use client'

/**
 * Error boundary para o painel admin.
 * Captura erros de renderização React e os exibe de forma legível em vez de tela branca.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      fontFamily:  'Nunito, monospace',
      padding:     '2rem',
      maxWidth:    '800px',
      margin:      '2rem auto',
      background:  '#fff0f0',
      border:      '2px solid #ff4444',
      borderRadius: '12px',
    }}>
      <h2 style={{ color: '#cc0000', marginTop: 0 }}>⚠️ Erro no painel admin</h2>
      <p style={{ color: '#555', marginBottom: '1rem' }}>
        Houve um erro ao renderizar esta página. Detalhes abaixo:
      </p>
      <pre style={{
        background:   '#1e1e1e',
        color:        '#ff9999',
        padding:      '1rem',
        borderRadius: '8px',
        overflowX:    'auto',
        fontSize:     '13px',
        whiteSpace:   'pre-wrap',
        wordBreak:    'break-word',
      }}>
        {error?.message ?? 'Erro desconhecido'}
        {error?.stack ? `\n\n${error.stack}` : ''}
        {error?.digest ? `\n\nDigest: ${error.digest}` : ''}
      </pre>
      <button
        onClick={reset}
        style={{
          marginTop:    '1.5rem',
          background:   '#FF6B9D',
          color:        '#fff',
          border:       'none',
          borderRadius: '9999px',
          padding:      '10px 28px',
          fontSize:     '14px',
          fontWeight:   700,
          cursor:       'pointer',
        }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
