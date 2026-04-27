import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendDownloadEmail } from '@/lib/email'
import { trackServerPurchase } from '@/lib/analytics'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import crypto from 'crypto'

const limiter = rateLimit({ interval: 60_000, limit: 30 })

function generateDownloadToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function verifyWebhookSignature(req: NextRequest, body: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    console.error('[Webhook] MERCADOPAGO_WEBHOOK_SECRET não configurado — requisição rejeitada')
    return false
  }

  const signature  = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''

  if (!xRequestId) {
    console.warn('[Webhook] Header x-request-id ausente')
    return false
  }

  const ts = signature.split(',').find(p => p.startsWith('ts='))?.split('=')[1]
  const v1 = signature.split(',').find(p => p.startsWith('v1='))?.split('=')[1]
  if (!ts || !v1) return false

  // Formato oficial do Mercado Pago:
  //   id = query param "data.id" da URL do webhook (o ID do pagamento)
  //   request-id = header x-request-id
  //   ts = timestamp extraído do x-signature
  // Ref: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
  const dataId     = req.nextUrl.searchParams.get('data.id') ?? ''
  const dataToSign = `id=${dataId};request-id=${xRequestId};ts=${ts};`

  const hmac = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex')

  // timingSafeEqual exige buffers do mesmo tamanho
  if (hmac.length !== v1.length) return false
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1))
}

export async function POST(req: NextRequest) {
  const rl = await limiter(getClientIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  const rawBody = await req.text()

  if (!verifyWebhookSignature(req, rawBody)) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  let notification: { type?: string; data?: { id?: string } }
  try {
    notification = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Only process payment events
  if (notification.type !== 'payment' || !notification.data?.id) {
    return NextResponse.json({ received: true })
  }

  const paymentId = notification.data.id

  try {
    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })
    const paymentApi = new Payment(mpClient)
    const payment    = await paymentApi.get({ id: Number(paymentId) })

    if (payment.status !== 'approved') {
      return NextResponse.json({ received: true, status: payment.status })
    }

    const productId   = payment.metadata?.product_id as string | undefined
    const buyerEmail  = payment.payer?.email  ?? ''
    const buyerName   = `${payment.payer?.first_name ?? ''} ${payment.payer?.last_name ?? ''}`.trim()
    const amount      = payment.transaction_amount ?? 0
    const mpPaymentId = String(payment.id)
    const paymentMethod = payment.payment_type_id ?? ''

    if (!productId) {
      console.error('[Webhook] product_id não encontrado no metadata')
      return NextResponse.json({ received: true })
    }

    const payload = await getPayload({ config })

    // Check if order already exists (idempotency)
    const existing = await payload.find({
      collection: 'orders',
      where: { mercadoPagoId: { equals: mpPaymentId } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Get product
    const product = await payload.findByID({ collection: 'products', id: productId })
    const pdfFile = typeof product.pdfFile === 'object' ? product.pdfFile : null

    // Generate download token & URL
    const downloadToken = generateDownloadToken()
    const baseUrl       = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const downloadUrl   = `${baseUrl}/api/download/${downloadToken}`

    // Create order
    const createdOrder = await payload.create({
      collection: 'orders',
      data: {
        email:          buyerEmail,
        buyerName,
        product:        productId,
        productTitle:   product.title,
        amount,
        status:         'approved',
        mercadoPagoId:  mpPaymentId,
        downloadToken,
        paymentMethod,
        downloadSentAt: new Date().toISOString(),
        emailSent:      false,
      },
    })

    // Send email with download link e registra resultado
    if (buyerEmail) {
      try {
        await sendDownloadEmail({
          to:           buyerEmail,
          buyerName,
          productTitle: product.title,
          downloadUrl,
        })
        await payload.update({
          collection: 'orders',
          id: createdOrder.id,
          data: { emailSent: true },
        })
      } catch (emailErr) {
        console.warn('[Webhook] Falha ao enviar e-mail — orderId:', createdOrder.id, emailErr)
      }
    }

    // ── Google Analytics 4 — Evento de compra (server-side) ──────
    // Registra a conversão no GA4 via Measurement Protocol.
    // Ativa configurando GA_MEASUREMENT_ID e GA_API_SECRET no .env.
    await trackServerPurchase({
      transactionId: mpPaymentId,
      productId,
      productName:   product.title,
      price:         amount,
      category:      product.category ?? '',
    })

    return NextResponse.json({ received: true, success: true })
  } catch (err) {
    console.error('[Webhook] Error processing payment:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
