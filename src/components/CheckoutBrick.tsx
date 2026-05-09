'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'

initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, {
  locale: 'pt-BR',
})

type Props = {
  productId:    string
  productTitle: string
  price:        number
}

type PaymentStatus = 'loading' | 'idle' | 'processing' | 'approved' | 'rejected' | 'pending' | 'pix' | 'error'

type PixData = { qrCode: string; qrCodeBase64: string }

export default function CheckoutBrick({ productId, productTitle, price }: Props) {
  const router = useRouter()
  const { clearCart } = useCart()
  const [status, setStatus]             = useState<PaymentStatus>('loading')
  const [errorMsg, setErrorMsg]         = useState('')
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [buyerName, setBuyerName]       = useState('')
  const [nameError, setNameError]       = useState(false)
  const [pixData, setPixData]           = useState<PixData | null>(null)
  const [pixCopied, setPixCopied]       = useState(false)
  // sessionId gerado uma única vez por montagem — garante idempotência em retries
  const sessionId = useRef<string>(globalThis.crypto.randomUUID())

  // Cria preferência no backend ao montar o componente
  useEffect(() => {
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 15_000)

    async function createPref() {
      try {
        const res = await fetch('/api/mercadopago/checkout', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ productId, productTitle, price }),
          signal:  controller.signal,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Erro ao criar preferência')
        setPreferenceId(data.preference_id)
        setStatus('idle')
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          setErrorMsg('Tempo esgotado ao conectar com o servidor de pagamento. Recarregue a página.')
        } else {
          setErrorMsg(err instanceof Error ? err.message : 'Erro ao iniciar checkout')
        }
        setStatus('error')
      } finally {
        clearTimeout(timeoutId)
      }
    }
    createPref()
    return () => { controller.abort(); clearTimeout(timeoutId) }
  }, [productId, productTitle, price])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = useCallback(async (param: any) => {
    // Proteção contra duplo clique — ignora se já está processando
    if (status === 'processing') return

    // Valida nome antes de processar o pagamento
    if (!buyerName.trim()) {
      setNameError(true)
      document.getElementById('buyer-name')?.focus()
      return
    }
    setNameError(false)
    setStatus('processing')
    setErrorMsg('')

    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 30_000)

    try {
      const paymentData = (param.formData as Record<string, unknown>) ?? param

      const res = await fetch('/api/mercadopago/process-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...paymentData,
          productId,
          productTitle,
          sessionId: sessionId.current,
          buyerName: buyerName.trim(),
        }),
        signal: controller.signal,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Erro ao processar pagamento')
      }

      switch (data.status) {
        case 'approved':
          clearCart()
          setStatus('approved')
          setTimeout(() => router.push('/checkout/sucesso'), 2000)
          break
        case 'in_process':
        case 'pending':
          clearCart()
          if (data.qr_code && data.qr_code_base64) {
            setPixData({ qrCode: data.qr_code, qrCodeBase64: data.qr_code_base64 })
            setStatus('pix')
          } else {
            setStatus('pending')
            setTimeout(() => router.push('/checkout/pendente'), 2000)
          }
          break
        case 'rejected':
          setStatus('rejected')
          setErrorMsg(getRejectMessage(data.status_detail))
          break
        default:
          // Qualquer status desconhecido trata como pendente — nunca trava o usuário
          setStatus('pending')
          setTimeout(() => router.push('/checkout/pendente'), 2000)
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setErrorMsg('Tempo esgotado. Verifique seu e-mail — se o pagamento foi aprovado, o link será enviado automaticamente.')
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Erro inesperado')
      }
      setStatus('error')
    } finally {
      clearTimeout(timeoutId)
    }
  }, [status, buyerName, productId, productTitle, router, clearCart])

  const handleError = useCallback((error: unknown) => {
    console.error('[PaymentBrick] Error:', error)
  }, [])

  if (status === 'approved') {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-6xl mb-4">&#10003;</div>
        <h2 className="font-heading text-h3 text-accent-green mb-2">Pagamento Aprovado!</h2>
        <p className="text-ink-muted">Você receberá o link de download por e-mail em instantes.</p>
        <p className="text-caption text-ink-light mt-2">Redirecionando...</p>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-6xl mb-4">&#9203;</div>
        <h2 className="font-heading text-h3 text-secondary-600 mb-2">Pagamento Pendente</h2>
        <p className="text-ink-muted">Assim que o pagamento for confirmado, enviaremos o link de download.</p>
        <p className="text-caption text-ink-light mt-2">Redirecionando...</p>
      </div>
    )
  }

  if (status === 'pix' && pixData) {
    return (
      <div className="text-center py-8 px-4">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="font-heading text-h3 text-ink mb-1">PIX gerado!</h2>
        <p className="text-ink-muted text-body-sm mb-6">
          Escaneie o QR code ou copie o código para pagar no app do seu banco.
        </p>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${pixData.qrCodeBase64}`}
            alt="QR Code PIX"
            width={200}
            height={200}
            className="rounded-xl border border-gray-100 shadow-sm"
          />
        </div>

        {/* Copia e Cola */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left">
          <p className="text-caption text-ink-muted mb-2 font-700">PIX Copia e Cola</p>
          <p className="text-[11px] text-ink break-all font-mono leading-relaxed">{pixData.qrCode}</p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(pixData.qrCode)
            setPixCopied(true)
            setTimeout(() => setPixCopied(false), 3000)
          }}
          className="btn-primary w-full mb-4"
        >
          {pixCopied ? '✅ Código copiado!' : '📋 Copiar código PIX'}
        </button>

        <p className="text-caption text-ink-light">
          Após pagar, o link de download chegará no seu e-mail automaticamente.
        </p>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full">
      {status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-700 text-body-sm" role="alert">
          <strong>Pagamento recusado.</strong> {errorMsg}
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-700 text-body-sm" role="alert">
          {errorMsg || 'Ocorreu um erro. Tente novamente.'}
        </div>
      )}

      {/* Campo de nome — sempre visível antes do formulário de pagamento */}
      <div className="mb-6">
        <label
          htmlFor="buyer-name"
          className="block text-body-sm font-700 text-ink mb-1"
        >
          Seu nome completo <span className="text-red-500">*</span>
        </label>
        <input
          id="buyer-name"
          type="text"
          value={buyerName}
          onChange={e => { setBuyerName(e.target.value); if (nameError) setNameError(false) }}
          placeholder="Como você gostaria de ser chamado(a)"
          autoComplete="name"
          className={`w-full rounded-xl border px-4 py-3 text-body text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:border-transparent transition ${
            nameError
              ? 'border-red-400 ring-2 ring-red-300 bg-red-50'
              : 'border-gray-200 focus:ring-primary'
          }`}
        />
        {nameError && (
          <p className="text-caption text-red-500 mt-1">
            Por favor, informe seu nome para continuar.
          </p>
        )}
      </div>

      {preferenceId && (
        <Payment
          initialization={{
            amount: price,
            preferenceId,
            payer: {
              email: '',
            },
          }}
          customization={{
            paymentMethods: {
              creditCard:      'all',
              bankTransfer:    'all',
              maxInstallments: 12,
            },
            visual: {
              style: {
                customVariables: {
                  formBackgroundColor: '#FFFFFF',
                  baseColor: '#FF6B9D',
                  inputBackgroundColor: '#FFFFFF',
                  borderRadiusLarge: '12px',
                  borderRadiusMedium: '8px',
                  borderRadiusSmall: '4px',
                  borderRadiusFull: '9999px',
                },
              },
            },
          }}
          onSubmit={handleSubmit}
          onError={handleError}
        />
      )}
    </div>
  )
}

function getRejectMessage(statusDetail: string): string {
  const messages: Record<string, string> = {
    cc_rejected_bad_filled_card_number:  'Número do cartão incorreto.',
    cc_rejected_bad_filled_date:         'Data de validade incorreta.',
    cc_rejected_bad_filled_other:        'Dados do cartão incorretos.',
    cc_rejected_bad_filled_security_code:'Código de segurança incorreto.',
    cc_rejected_blacklist:               'Cartão não aceito. Use outro cartão.',
    cc_rejected_call_for_authorize:      'Entre em contato com seu banco para autorizar.',
    cc_rejected_card_disabled:           'Cartão desabilitado. Ative-o com seu banco.',
    cc_rejected_card_error:              'Erro no cartão. Tente outro.',
    cc_rejected_duplicated_payment:      'Pagamento duplicado. Já existe uma transação.',
    cc_rejected_high_risk:               'Pagamento recusado por segurança. Use outro cartão.',
    cc_rejected_insufficient_amount:     'Saldo insuficiente.',
    cc_rejected_max_attempts:            'Limite de tentativas. Use outro cartão.',
    cc_rejected_other_reason:            'Cartão recusado. Use outro cartão.',
  }
  return messages[statusDetail] ?? 'Tente usar outro método de pagamento.'
}
