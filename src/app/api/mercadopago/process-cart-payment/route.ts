import { NextRequest, NextResponse } from 'next/server'
import { getMercadoPagoClient } from '@/lib/mercadopago'
import { Payment } from 'mercadopago'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { isAllowedOrigin } from '@/lib/allowed-origin'
import { getPool } from '@/lib/db'
import { sendCartDownloadEmail, sendPendingEmail } from '@/lib/email'
import crypto from 'crypto'

const limiter = rateLimit({ interval: 60_000, limit: 5 })

function generateDownloadToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Processa o pagamento de um carrinho via Checkout Brick.
 *
 * Pagamentos APROVADOS (cartão): cria o pedido e envia o e-mail diretamente aqui,
 * sem depender do webhook — mesmo padrão do process-payment para produto único.
 *
 * Pagamentos PENDENTES (PIX/boleto): retorna o status; o webhook (notification_url)
 * fica responsável por criar o pedido quando o pagamento for confirmado.
 */
export async function POST(req: NextRequest) {
  const rl = await limiter(getClientIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Origem não autorizada' }, { status: 403 })
  }

  try {
    const body = await req.json()

    const paymentData  = body.formData ?? body
    const preferenceId = body.preferenceId as string | undefined
    const amount       = body.amount       as number | undefined
    const productIds   = body.productIds   as string[] | undefined
    const buyerName    = (body.buyerName   as string | undefined)?.trim() ?? ''

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
    const baseUrl     = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    const client     = getMercadoPagoClient()
    const paymentApi = new Payment(client)

    const payment = await paymentApi.create({
      body: {
        token,
        issuer_id:            Number(issuer_id) || undefined,
        payment_method_id,
        transaction_amount:   finalAmount,
        installments:         installments ?? 1,
        payer,
        description:          `Carrinho (${productIds.length} ${productIds.length === 1 ? 'item' : 'itens'})`,
        statement_descriptor: 'PRO DANI',
        // Webhook para pagamentos pendentes (PIX/boleto)
        notification_url:     `${baseUrl}/api/mercadopago/webhook`,
        metadata: {
          product_ids: productIds,
          // Salvo no metadata para recuperar no webhook (PIX não retorna nome pelo payer)
          buyer_name: buyerName,
        },
        ...(preferenceId ? { external_reference: preferenceId } : {}),
      },
      requestOptions: { idempotencyKey: crypto.randomUUID() },
    })

    const paymentStatus = payment.status    ?? 'unknown'
    const mpPaymentId   = String(payment.id ?? '')

    // ── Pagamento aprovado — cria pedido e envia e-mail diretamente ──────────
    if (paymentStatus === 'approved' && mpPaymentId) {
      const buyerEmail = payer?.email ?? ''
      const nameFromMP = `${payment.payer?.first_name ?? ''} ${payment.payer?.last_name ?? ''}`.trim()
      const finalName  = nameFromMP || buyerName

      // Idempotência — evita duplicatas caso o webhook também dispare
      const { rows: existing } = await getPool().query<{ id: number }>(
        `SELECT id FROM orders WHERE mercado_pago_id = $1 LIMIT 1`,
        [mpPaymentId],
      )

      if (existing.length === 0) {
        // Busca dados de todos os produtos pelo ID
        const productNums = productIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n))
        const { rows: products } = await getPool().query<{
          id: number; title: string; price: number
        }>(
          `SELECT id, title, price::float8 AS price
           FROM products
           WHERE id = ANY($1) AND status = 'published'`,
          [productNums],
        )

        if (products.length > 0) {
          // 1. Cria order principal
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
              finalName || null,
              productNums[0],
              `Carrinho (${products.length} ${products.length === 1 ? 'item' : 'itens'})`,
              finalAmount,
              mpPaymentId,
              generateDownloadToken(),
              payment.payment_type_id ?? payment_method_id ?? '',
            ],
          )

          // 2. Cria order_item + coleta links de download para cada produto
          const downloads: Array<{ productTitle: string; downloadUrl: string }> = []

          for (const product of products) {
            const downloadToken = generateDownloadToken()
            const downloadUrl   = `${baseUrl}/api/download/${downloadToken}`

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

          // 3. Envia um único e-mail com todos os links de download
          if (buyerEmail && downloads.length > 0) {
            try {
              await sendCartDownloadEmail({ to: buyerEmail, buyerName: finalName, items: downloads })
              await getPool().query(
                `UPDATE orders SET email_sent = true, updated_at = NOW() WHERE id = $1`,
                [newOrder.id],
              )
            } catch (emailErr) {
              console.warn('[ProcessCartPayment] Falha ao enviar e-mail:', emailErr)
            }
          }
        }
      }
    }

    // Pagamento pendente (PIX/boleto) — envia e-mail de confirmação e retorna dados do QR code
    if (paymentStatus === 'pending' || paymentStatus === 'in_process') {
      const buyerEmail = payer?.email ?? ''
      const isPix      = payment_method_id === 'pix'

      if (buyerEmail) {
        sendPendingEmail({
          to:        buyerEmail,
          buyerName,
          amount:    finalAmount,
          isPix,
        }).catch(err => console.warn('[ProcessCartPayment] Falha ao enviar e-mail pendente:', err))
      }

      const txData = (payment as any).point_of_interaction?.transaction_data
      return NextResponse.json({
        status:         paymentStatus,
        status_detail:  payment.status_detail ?? '',
        payment_id:     mpPaymentId,
        qr_code:        txData?.qr_code        ?? null,
        qr_code_base64: txData?.qr_code_base64 ?? null,
      })
    }

    return NextResponse.json({
      status:        paymentStatus,
      status_detail: payment.status_detail ?? '',
      payment_id:    mpPaymentId,
    })
  } catch (err) {
    console.error('[ProcessCartPayment] Error:', err)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento. Tente novamente.' },
      { status: 500 },
    )
  }
}
