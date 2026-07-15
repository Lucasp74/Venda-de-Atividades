'use client'

import { useState, useCallback, type FormEvent } from 'react'

type Props = {
  productSlug: string
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function FreeDownloadForm({ productSlug }: Props) {
  const [name,   setName]   = useState('')
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/free-download', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slug: productSlug, name: name.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao processar solicitação')
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
      setStatus('error')
    }
  }, [status, productSlug, name, email])

  if (status === 'success') {
    return (
      <div className="text-center py-8 px-4">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="font-heading text-h3 text-ink mb-1">Prontinho!</h2>
        <p className="text-ink-muted text-body-sm">
          Enviamos o link de download para <strong>{email}</strong>. Confira também a caixa de spam.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-700 text-body-sm" role="alert">
          {errorMsg}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="free-name" className="block text-body-sm font-700 text-ink mb-1">
          Seu nome completo <span className="text-red-500">*</span>
        </label>
        <input
          id="free-name"
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Como você gostaria de ser chamado(a)"
          autoComplete="name"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-body text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="free-email" className="block text-body-sm font-700 text-ink mb-1">
          Seu e-mail <span className="text-red-500">*</span>
        </label>
        <input
          id="free-email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="seuemail@exemplo.com"
          autoComplete="email"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-body text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
      </div>

      <button type="submit" disabled={status === 'submitting'} className="btn-primary w-full text-base py-4 text-lg">
        {status === 'submitting' ? 'Enviando...' : '📥 Receber por E-mail'}
      </button>
    </form>
  )
}
