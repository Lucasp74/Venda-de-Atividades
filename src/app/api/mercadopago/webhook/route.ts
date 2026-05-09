import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getPool } from '@/lib/db'
import { sendDownloadEmail, sendCartDownloadEmail } from '@/lib/email'
import { trackServerPurchase } from '@/lib/analytics'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import crypto from 'crypto'

const limiter = rateLimit({ interval: 60_000, limit: 30 })

function generateDownloadToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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

  // ── Detecta formato do webhook ────────────────────────────────────────────
  // Novo formato (Checkout Bricks): ?data.id=xxx&type=payment  → verifica assinatura HMAC
  // Formato legado (IPN dashboard):  ?id=xxx&topic=payment     → sem header x-signature
  const topic    = req.nextUrl.searchParams.get('topic')
  const isLegacy = topic === 'payment' || topic === 'merchant_order'

  if (isLegacy) {
    // Formato legado não envia x-signature — segurança garantida pelo fetch direto na API do MP
    const legacyId = req.nextUrl.searchParams.get('id')
    if (!legacyId) return NextResponse.json({ received: true })
    return processPaymentById(legacyId)
  }

  // Novo formato — valida assinatura HMAC
  if (!verifyWebhookSignature(req, rawBody)) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  let notification: { type?: string; data?: { id?: string } }
  try {
    notification = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (notification.type !== 'payment' || !notification.data?.id) {
    return NextResponse.json({ received: true })
  }

  return processPaymentById(notification.data.id)
}

async function processPaymentById(paymentId: string): Promise<NextResponse> {
  try {
    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })
    const paymentApi = new Payment(mpClient)
    const payment    = await paymentApi.get({ id: Number(paymentId) })

    if (payment.status !== 'approved') {
      return NextResponse.json({ received: true, status: payment.status })
    }

    const meta = payment.metadata as Record<string, unknown> | undefined

    // PIX frequentemente não retorna email/nome pelo payer — usa metadata como fallback
    const payerEmail    = typeof payment.payer?.email === 'string' ? payment.payer.email : ''
    const metaEmail     = typeof meta?.buyer_email === 'string'    ? meta.buyer_email    : ''
    const buyerEmail    = isValidEmail(payerEmail) ? payerEmail : isValidEmail(metaEmail) ? metaEmail : ''
    const nameFromPayer = `${payment.payer?.first_name ?? ''} ${payment.payer?.last_name ?? ''}`.trim()
    const buyerName     = nameFromPayer || (meta?.buyer_name as string | undefined) || ''

    const amount        = payment.transaction_amount ?? 0
    const mpPaymentId   = String(payment.id)
    const paymentMethod = payment.payment_type_id ?? ''
    const baseUrl       = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    // ── Idempotência via SQL direto ───────────────────────────────────────────
    const { rows: existing } = await getPool().query<{ id: number }>(
      `SELECT id FROM orders WHERE mercado_pago_id = $1 LIMIT 1`,
      [mpPaymentId],
    )
    if (existing.length > 0) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    // ── Detecta fluxo: carrinho (product_ids) ou produto único (product_id) ──
    const productIds = meta?.product_ids as string[] | undefined
    const productId  = meta?.product_id  as string   | undefined

    if (productIds && productIds.length > 0) {
      return handleCartPayment({ productIds, buyerEmail, buyerName, amount, mpPaymentId, paymentMethod, baseUrl })
    }

    if (productId) {
      return handleSinglePayment({ productId, buyerEmail, buyerName, amount, mpPaymentId, paymentMethod, baseUrl })
    }

    console.error('[Webhook] Nenhum product_id ou product_ids no metadata — paymentId:', mpPaymentId)
    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('[Webhook] Error processing payment:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ── Produto único ─────────────────────────────────────────────────────────────

async function handleSinglePayment(p: {
  productId:     string
  buyerEmail:    string
  buyerName:     string
  amount:        number
  mpPaymentId:   string
  paymentMethod: string
  baseUrl:       string
}): Promise<NextResponse> {
  const numericId = parseInt(p.productId, 10)
  if (isNaN(numericId)) {
    console.error('[Webhook] productId inválido:', p.productId)
    return NextResponse.json({ received: true })
  }

  const { rows } = await getPool().query<{ id: number; title: string; price: number; category: string }>(
    `SELECT id, title, price::float8 AS price, category FROM products WHERE id = $1 AND status = 'published' LIMIT 1`,
    [numericId],
  )
  if (!rows[0]) {
    console.error('[Webhook] Produto não encontrado:', p.productId)
    return NextResponse.json({ received: true })
  }
  const product = rows[0]

  const downloadToken = generateDownloadToken()
  const downloadUrl   = `${p.baseUrl}/api/download/${downloadToken}`

  const { rows: [newOrder] } = await getPool().query<{ id: number }>(
    `INSERT INTO orders (
      email, buyer_name, product_id, product_title,
      amount, status, mercado_pago_id,
      download_token, payment_method,
      download_sent_at, email_sent, download_count,
      updated_at, created_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, 'approved', $6,
      $7, $8,
      NOW(), false, 0,
      NOW(), NOW()
    ) RETURNING id`,
    [
      p.buyerEmail  || null,
      p.buyerName   || null,
      numericId,
      product.title,
      p.amount,
      p.mpPaymentId,
      downloadToken,
      p.paymentMethod,
    ],
  )

  await Promise.all([
    (async () => {
      if (!p.buyerEmail) return
      try {
        await sendDownloadEmail({
          to:           p.buyerEmail,
          buyerName:    p.buyerName,
          productTitle: product.title,
          downloadUrl,
        })
        await getPool().query(
          `UPDATE orders SET email_sent = true, updated_at = NOW() WHERE id = $1`,
          [newOrder.id],
        )
      } catch (emailErr) {
        console.warn('[Webhook] Falha ao enviar e-mail — orderId:', newOrder.id, emailErr)
      }
    })(),

    trackServerPurchase({
      transactionId: p.mpPaymentId,
      productId:     p.productId,
      productName:   product.title,
      price:         p.amount,
      category:      product.category ?? '',
    }).catch(() => { /* GA4 não é crítico */ }),
  ])

  return NextResponse.json({ received: true, success: true })
}

// ── Carrinho (múltiplos produtos) ─────────────────────────────────────────────

async function handleCartPayment(p: {
  productIds:    string[]
  buyerEmail:    string
  buyerName:     string
  amount:        number
  mpPaymentId:   string
  paymentMethod: string
  baseUrl:       string
}): Promise<NextResponse> {
  const productNums = p.productIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n))

  const { rows: products } = await getPool().query<{ id: number; title: string; price: number }>(
    `SELECT id, title, price::float8 AS price FROM products WHERE id = ANY($1) AND status = 'published'`,
    [productNums],
  )

  if (products.length === 0) {
    console.error('[Webhook] Nenhum produto encontrado para IDs:', p.productIds)
    return NextResponse.json({ received: true })
  }

  // 1. Order principal
  const { rows: [newOrder] } = await getPool().query<{ id: number }>(
    `INSERT INTO orders (
      email, buyer_name, product_id, product_title,
      amount, status, mercado_pago_id,
      download_token, payment_method,
      download_sent_at, email_sent, download_count,
      updated_at, created_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, 'approved', $6,
      $7, $8,
      NOW(), false, 0,
      NOW(), NOW()
    ) RETURNING id`,
    [
      p.buyerEmail  || null,
      p.buyerName   || null,
      productNums[0],
      `Carrinho (${products.length} ${products.length === 1 ? 'item' : 'itens'})`,
      p.amount,
      p.mpPaymentId,
      generateDownloadToken(),
      p.paymentMethod,
    ],
  )

  // 2. Order items + links de download
  const downloads: Array<{ productTitle: string; downloadUrl: string }> = []

  for (const product of products) {
    const downloadToken = generateDownloadToken()
    const downloadUrl   = `${p.baseUrl}/api/download/${downloadToken}`

    await getPool().query(
      `INSERT INTO order_items (
        order_id, product_id, product_title, price,
        download_token, download_url, download_count,
        updated_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, NOW(), NOW())`,
      [newOrder.id, product.id, product.title, product.price, downloadToken, downloadUrl],
    )

    downloads.push({ productTitle: product.title, downloadUrl })
  }

  // 3. E-mail com todos os links
  if (p.buyerEmail && downloads.length > 0) {
    try {
      await sendCartDownloadEmail({ to: p.buyerEmail, buyerName: p.buyerName, items: downloads })
      await getPool().query(
        `UPDATE orders SET email_sent = true, updated_at = NOW() WHERE id = $1`,
        [newOrder.id],
      )
    } catch (emailErr) {
      console.warn('[Webhook] Falha ao enviar e-mail do carrinho:', emailErr)
    }
  }

  // 4. GA4
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
