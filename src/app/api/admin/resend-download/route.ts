import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendDownloadEmail } from '@/lib/email'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

// Limite conservador: no máximo 20 reenvios por minuto para qualquer IP
const limiter = rateLimit({ interval: 60_000, limit: 20 })

export async function POST(req: NextRequest) {
  const rl = limiter(getClientIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  try {
    const payload = await getPayload({ config })

    // Verifica autenticação via Payload (sessão do painel admin)
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      console.warn('[ResendDownload] Tentativa não autenticada de reenvio, IP:', getClientIp(req))
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId obrigatório' }, { status: 400 })
    }

    const order = await payload.findByID({ collection: 'orders', id: orderId })
    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (order.status !== 'approved') {
      return NextResponse.json({ error: 'Pedido não aprovado — não é possível reenviar.' }, { status: 400 })
    }

    if (!order.email) {
      return NextResponse.json({ error: 'Pedido sem e-mail cadastrado.' }, { status: 400 })
    }

    const baseUrl     = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const downloadUrl = `${baseUrl}/api/download/${order.downloadToken}`

    const productTitle = order.productTitle
      ?? (typeof order.product === 'object' ? (order.product as { title?: string }).title : null)
      ?? 'Atividade'

    await sendDownloadEmail({
      to:           order.email,
      buyerName:    order.buyerName ?? '',
      productTitle,
      downloadUrl,
    })

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        emailSent:      true,
        downloadSentAt: new Date().toISOString(),
      },
    })

    // Audit log — quem reenviou e para qual pedido
    console.info('[ResendDownload] Reenvio realizado — orderId:', orderId, '| userId:', user.id, '| para:', order.email)

    return NextResponse.json({ success: true })
  } catch (err) {
    // Nunca expõe detalhes internos ao cliente
    console.error('[ResendDownload]', err)
    return NextResponse.json({ error: 'Erro ao reenviar e-mail' }, { status: 500 })
  }
}
