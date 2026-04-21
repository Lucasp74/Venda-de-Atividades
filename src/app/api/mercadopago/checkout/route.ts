import { NextRequest, NextResponse } from 'next/server'
import { createPreference } from '@/lib/mercadopago'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const limiter = rateLimit({ interval: 60_000, limit: 10 })

function isAllowedOrigin(req: NextRequest): boolean {
  const origin  = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const base    = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const allowed = [base, 'http://localhost:3000']
  const source  = origin ?? referer ?? ''
  return allowed.some(url => source.startsWith(url))
}

export async function POST(req: NextRequest) {
  const rl = limiter(getClientIp(req))
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

    // Validate product exists
    const payload = await getPayload({ config })
    const product = await payload.findByID({ collection: 'products', id: productId })
    if (!product || product.status !== 'published') {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const preference = await createPreference({
      productId,
      productTitle,
      price:       product.price,
      buyerEmail,
      buyerName,
    })

    return NextResponse.json({
      init_point:      preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      preference_id:   preference.id,
    })
  } catch (err) {
    console.error('[Checkout] Error:', err)
    return NextResponse.json(
      { error: 'Erro ao criar preferência de pagamento' },
      { status: 500 },
    )
  }
}
