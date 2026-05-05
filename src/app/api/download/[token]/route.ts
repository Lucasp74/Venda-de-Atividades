import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const EXPIRY_DAYS    = 3
const DOWNLOAD_LIMIT = 5
const limiter = rateLimit({ interval: 60_000, limit: 10 })

// ── Tipos ─────────────────────────────────────────────────────────────────────

type OrderRow = {
  id:               number
  product_id:       number
  product_title:    string
  download_sent_at: string | null
  created_at:       string
  download_count:   number
  source:           'order' | 'order_item'
}

// ── Handler ───────────────────────────────────────────────────────────────────

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
    const row = await findByToken(token)

    if (!row) {
      return new NextResponse('Link inválido ou expirado', { status: 404 })
    }

    // Verifica expiração
    const referenceDate = row.download_sent_at
      ? new Date(row.download_sent_at)
      : new Date(row.created_at)

    const expiryDate = new Date(referenceDate)
    expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS)
    if (new Date() > expiryDate) {
      return new NextResponse('Link expirado. Entre em contato para reenvio.', { status: 410 })
    }

    // Verifica limite de downloads
    if (row.download_count >= DOWNLOAD_LIMIT) {
      return new NextResponse('Limite de downloads atingido. Entre em contato para suporte.', { status: 403 })
    }

    // Busca o PDF do produto
    const { rows: productRows } = await getPool().query<{ pdf_file_id: number | null }>(
      `SELECT pdf_file_id FROM products WHERE id = $1 LIMIT 1`,
      [row.product_id],
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

    const pdfUrl = pdfRawUrl.startsWith('http')
      ? pdfRawUrl
      : `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}${pdfRawUrl}`

    // Incrementa contador e busca PDF em paralelo
    const [, pdfResponse] = await Promise.all([
      incrementDownloadCount(row),
      fetch(pdfUrl),
    ])

    if (!pdfResponse.ok) {
      return new NextResponse('Arquivo não encontrado', { status: 404 })
    }

    const filename = `${(row.product_title ?? 'atividade').replace(/[^a-zA-Z0-9À-ú\s-]/g, '').trim()}.pdf`

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Procura o token em orders (fluxo produto único) e, se não encontrar,
 * em order_items (fluxo carrinho). Retorna uma linha normalizada.
 */
async function findByToken(token: string): Promise<OrderRow | null> {
  // 1. Produto único — token está na tabela orders
  const { rows: orderRows } = await getPool().query<Omit<OrderRow, 'source'>>(
    `SELECT
       o.id,
       o.product_id,
       o.product_title,
       o.download_sent_at,
       o.created_at,
       o.download_count
     FROM orders o
     WHERE o.download_token = $1
       AND o.status = 'approved'
     LIMIT 1`,
    [token],
  )

  if (orderRows[0]) {
    return { ...orderRows[0], source: 'order' }
  }

  // 2. Carrinho — token está em order_items
  const { rows: itemRows } = await getPool().query<{
    id: number
    product_id: number | null
    product_title: string
    download_count: number
    created_at: string
    order_sent_at: string | null
  }>(
    `SELECT
       oi.id,
       oi.product_id,
       oi.product_title,
       oi.download_count,
       oi.created_at,
       o.download_sent_at  AS order_sent_at
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.download_token = $1
       AND o.status = 'approved'
     LIMIT 1`,
    [token],
  )

  if (!itemRows[0]) return null

  const item = itemRows[0]
  return {
    id:               item.id,
    product_id:       item.product_id ?? 0,
    product_title:    item.product_title,
    download_sent_at: item.order_sent_at,
    created_at:       item.created_at,
    download_count:   item.download_count,
    source:           'order_item',
  }
}

/** Incrementa o contador na tabela correta (orders ou order_items) */
async function incrementDownloadCount(row: OrderRow): Promise<void> {
  if (row.source === 'order') {
    await getPool().query(
      `UPDATE orders SET download_count = download_count + 1, updated_at = NOW() WHERE id = $1`,
      [row.id],
    )
  } else {
    await getPool().query(
      `UPDATE order_items SET download_count = download_count + 1, updated_at = NOW() WHERE id = $1`,
      [row.id],
    )
  }
}
