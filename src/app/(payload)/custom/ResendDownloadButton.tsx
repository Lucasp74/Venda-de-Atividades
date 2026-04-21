'use client'

import { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export default function ResendDownloadButton() {
  const { id } = useDocumentInfo()
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleResend() {
    if (!id || state === 'loading') return
    setState('loading')
    setMessage('')

    try {
      const res = await fetch('/api/admin/resend-download', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId: id }),
        credentials: 'include',
      })
      const data = await res.json()

      if (!res.ok) {
        setState('error')
        setMessage(data.error ?? 'Erro ao reenviar.')
      } else {
        setState('success')
        setMessage('E-mail reenviado com sucesso!')
        setTimeout(() => setState('idle'), 4000)
      }
    } catch {
      setState('error')
      setMessage('Erro de conexão. Tente novamente.')
    }
  }

  const btnStyle: React.CSSProperties = {
    display:     'inline-flex',
    alignItems:  'center',
    gap:         8,
    padding:     '10px 20px',
    borderRadius: 10,
    border:      'none',
    fontSize:    13,
    fontWeight:  700,
    cursor:      state === 'loading' ? 'not-allowed' : 'pointer',
    fontFamily:  'Nunito, sans-serif',
    transition:  'all 0.2s ease',
    background:  state === 'success'
      ? 'linear-gradient(135deg,#34C977,#27A55A)'
      : state === 'error'
        ? 'linear-gradient(135deg,#FF6B6B,#D63031)'
        : 'linear-gradient(135deg,#FF6B9D,#845EC2)',
    color: '#fff',
    opacity: state === 'loading' ? 0.7 : 1,
  }

  return (
    <div style={{ padding: '12px 0', fontFamily: 'Nunito, sans-serif' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
        Ações do pedido
      </p>
      <button style={btnStyle} onClick={handleResend} disabled={state === 'loading'}>
        {state === 'loading' && '⏳ Enviando...'}
        {state === 'success' && '✅ Enviado!'}
        {state === 'error'   && '❌ Erro'}
        {state === 'idle'    && '📧 Reenviar Link de Download'}
      </button>
      {message && (
        <p style={{
          marginTop: 8,
          fontSize:  12,
          color:     state === 'success' ? '#27A55A' : '#D63031',
          fontWeight: 600,
        }}>
          {message}
        </p>
      )}
    </div>
  )
}
