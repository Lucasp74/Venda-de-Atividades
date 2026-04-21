import { NextRequest, NextResponse } from 'next/server'
import { processPayment } from '@/lib/mercadopago'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendDownloadEmail } from '@/lib/email'
import { trackServerPurchase } from '@/lib/analytics'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import crypto from 'crypto'

const limiter = rateLimit({ interval: 60_000, limit: 5 })

function isAllowedOrigin(req: NextRequest): boolean {
  const origin  = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const base    = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const allowed = [base, 'http://localhost:3000']
  const source  = origin ?? referer ?? ''
  return allowed.some(url => source.startsWith(url))
}

function generateDownloadToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(req: NextRequest) {
  const rl = limiter(getClientIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Origem não autorizada' }, { status: 403 })
  }

  try {
    const body = await req.json()

    // O Payment Brick envia { formData: { token, ... }, productId, productTitle }
    const paymentData = body.formData ?? body
    const productId    = body.productId    ?? paymentData.productId
    const productTitle = body.productTitle ?? paymentData.productTitle

    const {
      token,
      issuer_id,
      payment_method_id,
      transaction_amount,
      installments,
      payer,
    } = paymentData

    const sessionId = (body.sessionId as string | undefined) ?? undefined

    if (!productId || !transaction_amount) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Valida produto no banco
    const payload = await getPayload({ config })
    const product = await payload.findByID({ collection: 'products', id: productId })
    if (!product || product.status !== 'published') {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Processa pagamento no Mercado Pago
    const payment = await processPayment({
      sessionId,
      token,
      issuer_id:          issuer_id ?? '',
      payment_method_id,
      transaction_amount: product.price, // usa preço do banco (segurança)
      installments:       installments ?? 1,
      payer: {
        email:          payer?.email ?? '',
        identification: payer?.identification,
      },
      productId,
      productTitle:       product.title,
    })

    const paymentStatus = payment.status ?? 'unknown'
    const mpPaymentId   = String(payment.id ?? '')

    // Se aprovado, cria pedido e envia e-mail
    if (paymentStatus === 'approved') {
      const buyerEmail = payer?.email ?? ''
      const buyerName  = `${payment.payer?.first_name ?? ''} ${payment.payer?.last_name ?? ''}`.trim()

      // Checa duplicidade
      const existing = await payload.find({
        collection: 'orders',
        where: { mercadoPagoId: { equals: mpPaymentId } },
        limit: 1,
      })

      if (existing.docs.length === 0) {
        const downloadToken = generateDownloadToken()
        const baseUrl       = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
        const downloadUrl   = `${baseUrl}/api/download/${downloadToken}`

        const createdOrder = await payload.create({
          collection: 'orders',
          data: {
            email:          buyerEmail,
            buyerName,
            product:        Number(productId),
            productTitle:   product.title,
            amount:         product.price,
            status:         'approved',
            mercadoPagoId:  mpPaymentId,
            downloadToken,
            paymentMethod:  payment.payment_type_id ?? payment_method_id ?? '',
            downloadSentAt: new Date().toISOString(),
            emailSent:      false,
          },
        })

        // Envia e-mail com link de download e registra resultado
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
            console.warn('[ProcessPayment] Falha ao enviar e-mail — orderId:', createdOrder.id, emailErr)
          }
        }

        // Google Analytics (server-side, não bloqueia)
        try {
          await trackServerPurchase({
            transactionId: mpPaymentId,
            productId,
            productName:   product.title,
            price:         product.price,
            category:      product.category ?? '',
          })
        } catch (analyticsErr) {
          console.warn('[ProcessPayment] Falha no analytics:', analyticsErr)
        }
      }
    }

    return NextResponse.json({
      status:        paymentStatus,
      status_detail: payment.status_detail ?? '',
      payment_id:    mpPaymentId,
    })
  } catch (err: unknown) {
    console.error('[ProcessPayment] Error:', err)
    const message = err instanceof Error ? err.message : 'Erro ao processar pagamento'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
