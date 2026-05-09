import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendDownloadEmail, sendCartDownloadEmail } from '@/lib/email'
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

  const dataId     = req.nextUrl.searchParams.get('data.id') ?? ''
  const dataToSign = `id=${dataId};request-id=${xRequestId};ts=${ts};`

  const hmac = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex')

  if (hmac.length !== v1.length) return false
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1))
}

export async function POST(req: NextRequest) {
  const rl = await limiter(getClientIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  const rawBody = await req.text()

  if (!verifyWebhookSignature(req, rawBody)) {
    console.error('[Webhook] Assinatura inválida — x-signature:', req.headers.get('x-signature'), '| x-request-id:', req.headers.get('x-request-id'), '| secret configurado:', !!process.env.MERCADOPAGO_WEBHOOK_SECRET)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }
  console.log('[Webhook] Assinatura válida — processando notificação')

  let notification: { type?: string; data?: { id?: string } }
  try {
    notification = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

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

    const buyerEmail     = payment.payer?.email  ?? ''
    const nameFromPayer  = `${payment.payer?.first_name ?? ''} ${payment.payer?.last_name ?? ''}`.trim()
    // PIX frequentemente não retorna nome pelo payer — usa o nome salvo no metadata como fallback
    const buyerName      = nameFromPayer || ((payment.metadata as any)?.buyer_name as string | undefined) || ''
    const amount        = payment.transaction_amount ?? 0
    const mpPaymentId   = String(payment.id)
    const paymentMethod = payment.payment_type_id ?? ''
    const baseUrl       = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    const payload = await getPayload({ config })

    // ── Idempotência — evita processar o mesmo pagamento duas vezes ──
    const existing = await payload.find({
      collection: 'orders',
      where: { mercadoPagoId: { equals: mpPaymentId } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    // ── Detecta fluxo: carrinho (product_ids) ou produto único (product_id) ──
    const productIds = payment.metadata?.product_ids as string[] | undefined
    const productId  = payment.metadata?.product_id  as string   | undefined

    if (productIds && productIds.length > 0) {
      // ── FLUXO CARRINHO ────────────────────────────────────────────
      return await handleCartPayment({
        payload, productIds, buyerEmail, buyerName,
        amount, mpPaymentId, paymentMethod, baseUrl,
      })
    }

    if (productId) {
      // ── FLUXO PRODUTO ÚNICO (original — backward compatible) ──────
      return await handleSinglePayment({
        payload, productId, buyerEmail, buyerName,
        amount, mpPaymentId, paymentMethod, baseUrl,
      })
    }

    console.error('[Webhook] Nenhum product_id ou product_ids no metadata')
    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('[Webhook] Error processing payment:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ── Produto único ─────────────────────────────────────────────────────────────

async function handleSinglePayment(p: {
  payload:       Awaited<ReturnType<typeof getPayload>>
  productId:     string
  buyerEmail:    string
  buyerName:     string
  amount:        number
  mpPaymentId:   string
  paymentMethod: string
  baseUrl:       string
}) {
  const product = await p.payload.findByID({ collection: 'products', id: p.productId })

  const downloadToken = generateDownloadToken()
  const downloadUrl   = `${p.baseUrl}/api/download/${downloadToken}`

  const createdOrder = await p.payload.create({
    collection: 'orders',
    data: {
      email:          p.buyerEmail,
      buyerName:      p.buyerName,
      product:        p.productId,
      productTitle:   product.title,
      amount:         p.amount,
      status:         'approved',
      mercadoPagoId:  p.mpPaymentId,
      downloadToken,
      paymentMethod:  p.paymentMethod,
      downloadSentAt: new Date().toISOString(),
      emailSent:      false,
    },
  })

  if (p.buyerEmail) {
    try {
      await sendDownloadEmail({
        to:           p.buyerEmail,
        buyerName:    p.buyerName,
        productTitle: product.title,
        downloadUrl,
      })
      await p.payload.update({
        collection: 'orders',
        id: createdOrder.id,
        data: { emailSent: true },
      })
    } catch (emailErr) {
      console.warn('[Webhook] Falha ao enviar e-mail — orderId:', createdOrder.id, emailErr)
    }
  }

  await trackServerPurchase({
    transactionId: p.mpPaymentId,
    productId:     p.productId,
    productName:   product.title,
    price:         p.amount,
    category:      product.category ?? '',
  })

  return NextResponse.json({ received: true, success: true })
}

// ── Carrinho (múltiplos produtos) ─────────────────────────────────────────────
// Estrutura correta: 1 order por pagamento + N orderItems (1 por produto)
// Isso respeita o unique constraint em orders.mercadoPagoId e mantém o banco limpo.

async function handleCartPayment(p: {
  payload:       Awaited<ReturnType<typeof getPayload>>
  productIds:    string[]
  buyerEmail:    string
  buyerName:     string
  amount:        number
  mpPaymentId:   string
  paymentMethod: string
  baseUrl:       string
}) {
  // 1. Cria a order principal (1 por pagamento)
  const order = await p.payload.create({
    collection: 'orders',
    data: {
      email:          p.buyerEmail,
      buyerName:      p.buyerName,
      // product e productTitle ficam vazios — os itens estão em order-items
      product:        p.productIds[0],           // required pelo schema — usa o primeiro como referência
      productTitle:   `Carrinho (${p.productIds.length} itens)`,
      amount:         p.amount,                  // valor total do pagamento
      status:         'approved',
      mercadoPagoId:  p.mpPaymentId,             // unique — apenas 1 order por pagamento ✓
      paymentMethod:  p.paymentMethod,
      downloadSentAt: new Date().toISOString(),
      emailSent:      false,
    },
  })

  // 2. Para cada produto: busca dados, gera token, cria orderItem
  const downloads: Array<{ productTitle: string; downloadUrl: string }> = []

  for (const productId of p.productIds) {
    let product: Awaited<ReturnType<typeof p.payload.findByID>>
    try {
      product = await p.payload.findByID({ collection: 'products', id: productId })
    } catch {
      console.warn(`[Webhook] Produto ${productId} não encontrado — pulado`)
      continue
    }

    const downloadToken = generateDownloadToken()
    const downloadUrl   = `${p.baseUrl}/api/download/${downloadToken}`

    await p.payload.create({
      collection: 'order-items',
      data: {
        orderId:       order.id,
        productId:     Number(productId),
        productTitle:  product.title,
        price:         product.price,
        downloadToken,
        downloadUrl,
        downloadCount: 0,
      },
    })

    downloads.push({ productTitle: product.title, downloadUrl })
  }

  if (downloads.length === 0) {
    console.error('[Webhook] Nenhum produto processado no carrinho')
    return NextResponse.json({ received: true })
  }

  // 3. Um único e-mail com todos os links de download
  if (p.buyerEmail) {
    try {
      await sendCartDownloadEmail({
        to:        p.buyerEmail,
        buyerName: p.buyerName,
        items:     downloads,
      })
      await p.payload.update({
        collection: 'orders',
        id: order.id,
        data: { emailSent: true },
      })
    } catch (emailErr) {
      console.warn('[Webhook] Falha ao enviar e-mail do carrinho:', emailErr)
    }
  }

  // 4. Registra evento de compra no GA4 para cada produto
  await Promise.all(
    p.productIds.map((productId, i) =>
      trackServerPurchase({
        transactionId: `${p.mpPaymentId}-${i}`,
        productId,
        productName:   downloads[i]?.productTitle ?? '',
        price:         p.amount / p.productIds.length,
        category:      '',
      }).catch(() => { /* GA4 não é crítico */ }),
    ),
  )

  return NextResponse.json({ received: true, success: true, itemsProcessed: downloads.length })
}
