import { NextRequest, NextResponse } from 'next/server'
import { createPreference, createCartPreference } from '@/lib/mercadopago'
import { getPool } from '@/lib/db'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { isAllowedOrigin } from '@/lib/allowed-origin'

const limiter = rateLimit({ interval: 60_000, limit: 10 })

// ── Produto único (fluxo original) ───────────────────────────────────────────

async function handleSingleProduct(body: Record<string, unknown>) {
  const { productId, productTitle, price, buyerEmail, buyerName } = body as Record<string, string>

  if (!productId || !productTitle || typeof price !== 'number') {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const numericId = parseInt(productId, 10)
  if (isNaN(numericId)) {
    return NextResponse.json({ error: 'Produto inválido' }, { status: 400 })
  }

  const { rows } = await getPool().query<{ id: number; title: string; price: number }>(
    `SELECT id, title, price::float8 AS price FROM products WHERE id = $1 AND status = 'published' LIMIT 1`,
    [numericId],
  )

  if (!rows[0]) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  const preference = await createPreference({
    productId,
    productTitle: rows[0].title,
    price:        rows[0].price,   // preço vem do banco — não do cliente
    buyerEmail,
    buyerName,
  })

  return NextResponse.json({
    init_point:         preference.init_point,
    sandbox_init_point: preference.sandbox_init_point,
    preference_id:      preference.id,
  })
}

// ── Carrinho (múltiplos produtos) ─────────────────────────────────────────────

async function handleCart(body: Record<string, unknown>) {
  const { items, buyerEmail, buyerName } = body as {
    items:       Array<{ productId: string; title: string; price: number }>
    buyerEmail?: string
    buyerName?:  string
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 })
  }

  // Valida e busca os preços do banco para todos os itens (segurança)
  const ids = items.map(i => parseInt(i.productId, 10)).filter(n => !isNaN(n))

  if (ids.length !== items.length) {
    return NextResponse.json({ error: 'IDs de produto inválidos' }, { status: 400 })
  }

  const { rows } = await getPool().query<{ id: number; title: string; price: number }>(
    `SELECT id, title, price::float8 AS price FROM products
     WHERE id = ANY($1::int[]) AND status = 'published'`,
    [ids],
  )

  if (rows.length !== ids.length) {
    return NextResponse.json({ error: 'Um ou mais produtos não encontrados' }, { status: 404 })
  }

  // Ordena igual ao array de entrada para manter correspondência
  const rowMap = new Map(rows.map(r => [r.id, r]))

  const cartItems = ids.map(id => {
    const row = rowMap.get(id)!
    return { productId: String(id), productTitle: row.title, price: row.price }
  })

  const preference = await createCartPreference({ items: cartItems, buyerEmail, buyerName })

  return NextResponse.json({
    init_point:         preference.init_point,
    sandbox_init_point: preference.sandbox_init_point,
    preference_id:      preference.id,
  })
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rl = await limiter(getClientIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Origem não autorizada' }, { status: 403 })
  }

  try {
    const body = await req.json()

    // Carrinho quando body.items é array; produto único caso contrário
    if (Array.isArray(body.items)) {
      return await handleCart(body)
    }
    return await handleSingleProduct(body)
  } catch (err) {
    console.error('[Checkout] Error:', err)
    return NextResponse.json(
      { error: 'Erro ao criar preferência de pagamento' },
      { status: 500 },
    )
  }
}
