import { NextRequest, NextResponse } from 'next/server'
import { processPayment } from '@/lib/mercadopago'
import { getPool } from '@/lib/db'
import { sendDownloadEmail } from '@/lib/email'
import { trackServerPurchase } from '@/lib/analytics'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { isAllowedOrigin } from '@/lib/allowed-origin'
import crypto from 'crypto'

const limiter = rateLimit({ interval: 60_000, limit: 5 })

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

    const numericId = parseInt(productId, 10)
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Produto inválido' }, { status: 400 })
    }

    // Consulta direta ao banco — sem inicializar o Payload CMS (~2.500ms economizados)
    const { rows } = await getPool().query<{ id: number; title: string; price: number; category: string }>(
      `SELECT id, title, price::float8 AS price, category FROM products WHERE id = $1 AND status = 'published' LIMIT 1`,
      [numericId],
    )

    if (!rows[0]) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const product = rows[0]

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
      productTitle: product.title,
    })

    const paymentStatus = payment.status ?? 'unknown'
    const mpPaymentId   = String(payment.id ?? '')

    // Se aprovado, cria pedido e envia e-mail
    // getPayload só é inicializado aqui — pagamentos PIX/boleto vão para
    // "pending" e passam pelo webhook, nunca chegando neste bloco.
    if (paymentStatus === 'approved') {
      const buyerEmail = payer?.email ?? ''
      const buyerName  = `${payment.payer?.first_name ?? ''} ${payment.payer?.last_name ?? ''}`.trim()

      // Checa duplicidade via SQL direto
      const { rows: existing } = await getPool().query<{ id: number }>(
        `SELECT id FROM orders WHERE mercado_pago_id = $1 LIMIT 1`,
        [mpPaymentId],
      )

      if (existing.length === 0) {
        const downloadToken = generateDownloadToken()
        const baseUrl       = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
        const downloadUrl   = `${baseUrl}/api/download/${downloadToken}`

        // Insere o pedido via SQL direto (sem Payload) e retorna o id gerado
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
            buyerEmail,
            buyerName || null,
            numericId,
            product.title,
            product.price,
            mpPaymentId,
            downloadToken,
            payment.payment_type_id ?? payment_method_id ?? '',
          ],
        )

        // E-mail de download e GA disparam em paralelo — economiza ~300-500ms
        await Promise.all([
          // 1. Envia e-mail e marca emailSent = true no pedido
          (async () => {
            if (!buyerEmail) return
            try {
              await sendDownloadEmail({
                to:           buyerEmail,
                buyerName,
                productTitle: product.title,
                downloadUrl,
              })
              await getPool().query(
                `UPDATE orders SET email_sent = true, updated_at = NOW() WHERE id = $1`,
                [newOrder.id],
              )
            } catch (emailErr) {
              console.warn('[ProcessPayment] Falha ao enviar e-mail — orderId:', newOrder.id, emailErr)
            }
          })(),

          // 2. Registra conversão no GA4 via Measurement Protocol
          trackServerPurchase({
            transactionId: mpPaymentId,
            productId,
            productName:   product.title,
            price:         product.price,
            category:      product.category ?? '',
          }).catch((analyticsErr) => {
            console.warn('[ProcessPayment] Falha no analytics:', analyticsErr)
          }),
        ])
      }
    }

    return NextResponse.json({
      status:        paymentStatus,
      status_detail: payment.status_detail ?? '',
      payment_id:    mpPaymentId,
    })
  } catch (err: unknown) {
    // Log completo server-side, mas nunca expõe detalhes internos ao cliente
    console.error('[ProcessPayment] Error:', err)
    return NextResponse.json({ error: 'Erro ao processar pagamento. Tente novamente.' }, { status: 500 })
  }
}
