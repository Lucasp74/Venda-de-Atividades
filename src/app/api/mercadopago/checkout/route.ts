import { NextRequest, NextResponse } from 'next/server'
import { createPreference } from '@/lib/mercadopago'
import { getPool } from '@/lib/db'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { isAllowedOrigin } from '@/lib/allowed-origin'

const limiter = rateLimit({ interval: 60_000, limit: 10 })

export async function POST(req: NextRequest) {
  const rl = await limiter(getClientIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Origem não autorizada' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { productId, productTitle, price, buyerEmail, buyerName } = body

    if (!productId || !productTitle || typeof price !== 'number') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const numericId = parseInt(productId, 10)
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Produto inválido' }, { status: 400 })
    }

    // Consulta direta ao banco — sem inicializar o Payload CMS (~2.500ms economizados)
    const { rows } = await getPool().query<{ id: number; title: string; price: number }>(
      `SELECT id, title, price::float8 AS price FROM products WHERE id = $1 AND status = 'published' LIMIT 1`,
      [numericId],
    )

    if (!rows[0]) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const product = rows[0]

    const preference = await createPreference({
      productId,
      productTitle: product.title,
      price:        product.price,   // preço vem do banco — não do cliente (segurança)
      buyerEmail,
      buyerName,
    })

    return NextResponse.json({
      init_point:         preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      preference_id:      preference.id,
    })
  } catch (err) {
    console.error('[Checkout] Error:', err)
    return NextResponse.json(
      { error: 'Erro ao criar preferência de pagamento' },
      { status: 500 },
    )
  }
}
