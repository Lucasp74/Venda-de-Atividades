import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { sendDownloadEmail } from '@/lib/email'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { isAllowedOrigin } from '@/lib/allowed-origin'
import crypto from 'crypto'

const limiter = rateLimit({ interval: 60_000, limit: 5 })

function generateDownloadToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const rl = await limiter(getClientIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Origem não autorizada' }, { status: 403 })
  }

  try {
    const { slug, name, email } = await req.json()

    const buyerName  = String(name ?? '').trim()
    const buyerEmail = String(email ?? '').trim().toLowerCase()

    if (!slug || !buyerName || !EMAIL_RE.test(buyerEmail)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { rows } = await getPool().query<{ id: number; title: string; price: number }>(
      `SELECT id, title, price::float8 AS price FROM products WHERE slug = $1 AND status = 'published' LIMIT 1`,
      [slug],
    )

    const product = rows[0]
    if (!product) {
      return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 })
    }
    if (product.price !== 0) {
      return NextResponse.json({ error: 'Esta atividade não é gratuita' }, { status: 400 })
    }

    const downloadToken = generateDownloadToken()
    const baseUrl        = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const downloadUrl    = `${baseUrl}/api/download/${downloadToken}`

    const { rows: [newOrder] } = await getPool().query<{ id: number }>(
      `INSERT INTO orders (
        email, buyer_name, product_id, product_title,
        amount, status,
        download_token, payment_method,
        download_sent_at, email_sent, download_count,
        updated_at, created_at
      ) VALUES (
        $1, $2, $3, $4,
        0, 'approved',
        $5, 'gratuito',
        NOW(), false, 0,
        NOW(), NOW()
      ) RETURNING id`,
      [buyerEmail, buyerName, product.id, product.title, downloadToken],
    )

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

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[FreeDownload] Error:', err)
    return NextResponse.json({ error: 'Erro ao processar solicitação. Tente novamente.' }, { status: 500 })
  }
}
