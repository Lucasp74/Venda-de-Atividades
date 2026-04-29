import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const EXPIRY_DAYS    = 3
const DOWNLOAD_LIMIT = 5
const limiter = rateLimit({ interval: 60_000, limit: 10 })

type OrderRow = {
  id:              number
  product_title:   string
  download_sent_at: string | null
  created_at:      string
  download_count:  number
  pdf_url:         string | null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const rl = await limiter(getClientIp(_req))
  if (!rl.success) return rateLimitResponse(rl)

  const { token } = await params

  if (!token || token.length < 16) {
    return new NextResponse('Token inválido', { status: 400 })
  }

  try {
    // Consulta direta ao banco — sem inicializar o Payload CMS (~2500ms economizados)
    const { rows } = await getPool().query<OrderRow>(
      `SELECT
         o.id,
         o.product_title,
         o.download_sent_at,
         o.created_at,
         o.download_count,
         m.url AS pdf_url
       FROM orders o
       LEFT JOIN products p  ON p.id = o.product_id
       LEFT JOIN media   m  ON m.id  = p.pdf_file_id
       WHERE o.download_token = $1
         AND o.status = 'approved'
       LIMIT 1`,
      [token],
    )

    const order = rows[0]
    if (!order) {
      return new NextResponse('Link inválido ou expirado', { status: 404 })
    }

    // Verifica expiração
    const referenceDate = order.download_sent_at
      ? new Date(order.download_sent_at)
      : new Date(order.created_at)

    const expiryDate = new Date(referenceDate)
    expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS)
    if (new Date() > expiryDate) {
      return new NextResponse('Link expirado. Entre em contato para reenvio.', { status: 410 })
    }

    // Verifica limite de downloads
    if (order.download_count >= DOWNLOAD_LIMIT) {
      return new NextResponse('Limite de downloads atingido. Entre em contato para suporte.', { status: 403 })
    }

    if (!order.pdf_url) {
      return new NextResponse('Arquivo não encontrado', { status: 404 })
    }

    // Incrementa contador e busca PDF em paralelo
    const pdfUrl = order.pdf_url.startsWith('http')
      ? order.pdf_url
      : `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}${order.pdf_url}`

    const [, pdfResponse] = await Promise.all([
      getPool().query(
        `UPDATE orders SET download_count = download_count + 1, updated_at = NOW() WHERE id = $1`,
        [order.id],
      ),
      fetch(pdfUrl),
    ])

    if (!pdfResponse.ok) {
      return new NextResponse('Arquivo não encontrado', { status: 404 })
    }

    const filename = `${(order.product_title ?? 'atividade').replace(/[^a-zA-Z0-9À-ú\s-]/g, '').trim()}.pdf`

    return new NextResponse(pdfResponse.body, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
      },
    })
  } catch (err) {
    console.error('[Download] Error:', err)
    return new NextResponse('Erro interno', { status: 500 })
  }
}
