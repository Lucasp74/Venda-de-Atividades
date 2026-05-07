'use client'

import { useState, useCallback } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'

initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, {
  locale: 'pt-BR',
})

type Props = {
  preferenceId: string
  amount:       number
  buyerName:    string
  productIds:   string[]
}

type Status = 'idle' | 'processing' | 'approved' | 'pending' | 'rejected' | 'error'

export default function CartCheckoutBrick({ preferenceId, amount, buyerName, productIds }: Props) {
  const router = useRouter()
  const { clearCart } = useCart()
  const [status,   setStatus]   = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = useCallback(async (param: any) => {
    if (status === 'processing') return
    setStatus('processing')
    setErrorMsg('')

    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 30_000)

    try {
      const paymentData = (param.formData as Record<string, unknown>) ?? param

      const res = await fetch('/api/mercadopago/process-cart-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...paymentData,
          preferenceId,
          amount,
          buyerName: buyerName.trim(),
          productIds,
        }),
        signal: controller.signal,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao processar pagamento')

      switch (data.status) {
        case 'approved':
          clearCart()
          setStatus('approved')
          setTimeout(() => router.push('/checkout/sucesso'), 2000)
          break
        case 'in_process':
        case 'pending':
          clearCart()
          setStatus('pending')
          setTimeout(() => router.push('/checkout/pendente'), 2000)
          break
        case 'rejected':
          setStatus('rejected')
          setErrorMsg(getRejectMessage(data.status_detail))
          break
        default:
          setStatus('pending')
          setTimeout(() => router.push('/checkout/pendente'), 2000)
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setErrorMsg('Tempo esgotado. Se o pagamento foi aprovado, o link chegará por e-mail.')
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
      }
      setStatus('error')
    } finally {
      clearTimeout(timeoutId)
    }
  }, [status, preferenceId, amount, buyerName, productIds, router, clearCart])

  const handleError = useCallback((error: unknown) => {
    console.error('[CartCheckoutBrick]', error)
  }, [])

  if (status === 'approved') {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="font-heading text-h3 text-accent-green mb-2">Pagamento Aprovado!</h2>
        <p className="text-ink-muted">Você receberá os links de download por e-mail em instantes.</p>
        <p className="text-caption text-ink-light mt-2">Redirecionando...</p>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="font-heading text-h3 text-secondary-600 mb-2">Pagamento Pendente</h2>
        <p className="text-ink-muted">Assim que confirmado, enviaremos os links de download.</p>
        <p className="text-caption text-ink-light mt-2">Redirecionando...</p>
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

      <Payment
        initialization={{
          amount,
          preferenceId,
          payer: { email: '' },
        }}
        customization={{
          paymentMethods: {
            creditCard:      'all',
            debitCard:       'all',
            ticket:          'all',
            bankTransfer:    'all',
            maxInstallments: 12,
          },
          visual: {
            style: {
              customVariables: {
                formBackgroundColor: '#FFFFFF',
                baseColor:           '#FF6B9D',
                inputBackgroundColor:'#FFFFFF',
                borderRadiusLarge:   '12px',
                borderRadiusMedium:  '8px',
                borderRadiusSmall:   '4px',
                borderRadiusFull:    '9999px',
              },
            },
          },
        }}
        onSubmit={handleSubmit}
        onError={handleError}
      />
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
