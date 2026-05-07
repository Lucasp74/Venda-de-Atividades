import { NextRequest, NextResponse } from 'next/server'
import { getMercadoPagoClient } from '@/lib/mercadopago'
import { Payment } from 'mercadopago'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { isAllowedOrigin } from '@/lib/allowed-origin'
import crypto from 'crypto'

const limiter = rateLimit({ interval: 60_000, limit: 5 })

/**
 * Processa o pagamento de um carrinho via Checkout Brick.
 * A criação do pedido e envio do e-mail são feitos pelo webhook do Mercado Pago
 * (handleCartPayment em webhook/route.ts) — não duplicamos a lógica aqui.
 */
export async function POST(req: NextRequest) {
  const rl = await limiter(getClientIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Origem não autorizada' }, { status: 403 })
  }

  try {
    const body = await req.json()

    const paymentData   = body.formData ?? body
    const preferenceId  = body.preferenceId  as string | undefined
    const amount        = body.amount        as number | undefined
    const productIds    = body.productIds    as string[] | undefined

    const {
      token,
      issuer_id,
      payment_method_id,
      transaction_amount,
      installments,
      payer,
    } = paymentData

    if (!token || !payment_method_id || (!transaction_amount && !amount)) {
      return NextResponse.json({ error: 'Dados de pagamento incompletos' }, { status: 400 })
    }

    if (!productIds || productIds.length === 0) {
      return NextResponse.json({ error: 'Nenhum produto no carrinho' }, { status: 400 })
    }

    const finalAmount = Number(amount ?? transaction_amount)

    const client     = getMercadoPagoClient()
    const paymentApi = new Payment(client)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    const payment = await paymentApi.create({
      body: {
        token,
        issuer_id:          Number(issuer_id) || undefined,
        payment_method_id,
        transaction_amount: finalAmount,
        installments:       installments ?? 1,
        payer,
        description:        `Carrinho (${productIds.length} ${productIds.length === 1 ? 'item' : 'itens'})`,
        statement_descriptor: 'PRO DANI',
        // Garante que o webhook seja chamado mesmo em pagamentos diretos via Payment API
        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        // product_ids no metadata → webhook identifica como fluxo carrinho
        metadata: {
          product_ids: productIds,
        },
        ...(preferenceId ? { external_reference: preferenceId } : {}),
      },
      requestOptions: {
        idempotencyKey: crypto.randomUUID(),
      },
    })

    return NextResponse.json({
      status:        payment.status ?? 'unknown',
      status_detail: payment.status_detail ?? '',
      payment_id:    String(payment.id ?? ''),
    })
  } catch (err) {
    console.error('[ProcessCartPayment] Error:', err)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento. Tente novamente.' },
      { status: 500 },
    )
  }
}
