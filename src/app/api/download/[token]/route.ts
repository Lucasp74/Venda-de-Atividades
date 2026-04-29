import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const EXPIRY_DAYS    = 3
const DOWNLOAD_LIMIT = 5
const limiter = rateLimit({ interval: 60_000, limit: 10 })

type OrderRow = {
  id:               number
  product_id:       number
  product_title:    string
  download_sent_at: string | null
  created_at:       string
  download_count:   number
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
      `SELECT id, product_id, product_title, download_sent_at, created_at, download_count
       FROM orders
       WHERE download_token = $1 AND status = 'approved'
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

    // Busca URL do PDF via produto → media (queries simples sem JOIN)
    const { rows: productRows } = await getPool().query<{ pdf_file_id: number | null }>(
      `SELECT pdf_file_id FROM products WHERE id = $1 LIMIT 1`,
      [order.product_id],
    )
    const pdfFileId = productRows[0]?.pdf_file_id
    if (!pdfFileId) {
      return new NextResponse('Arquivo não encontrado', { status: 404 })
    }

    const { rows: mediaRows } = await getPool().query<{ url: string }>(
      `SELECT url FROM media WHERE id = $1 LIMIT 1`,
      [pdfFileId],
    )
    const pdfRawUrl = mediaRows[0]?.url
    if (!pdfRawUrl) {
      return new NextResponse('Arquivo não encontrado', { status: 404 })
    }

    // Incrementa contador e busca PDF em paralelo
    const pdfUrl = pdfRawUrl.startsWith('http')
      ? pdfRawUrl
      : `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}${pdfRawUrl}`

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
