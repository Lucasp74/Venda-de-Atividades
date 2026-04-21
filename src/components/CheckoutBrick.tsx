'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import { useRouter } from 'next/navigation'

initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, {
  locale: 'pt-BR',
})

type Props = {
  productId:    string
  productTitle: string
  price:        number
}

type PaymentStatus = 'loading' | 'idle' | 'processing' | 'approved' | 'rejected' | 'pending' | 'error'

export default function CheckoutBrick({ productId, productTitle, price }: Props) {
  const router = useRouter()
  const [status, setStatus]             = useState<PaymentStatus>('loading')
  const [errorMsg, setErrorMsg]         = useState('')
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
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
        }),
        signal: controller.signal,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Erro ao processar pagamento')
      }

      switch (data.status) {
        case 'approved':
          setStatus('approved')
          setTimeout(() => router.push('/checkout/sucesso'), 2000)
          break
        case 'in_process':
        case 'pending':
          setStatus('pending')
          setTimeout(() => router.push('/checkout/pendente'), 2000)
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
  }, [status, productId, productTitle, router])

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
              creditCard: 'all',
              debitCard: 'all',
              ticket: 'all',
              bankTransfer: 'all',
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
