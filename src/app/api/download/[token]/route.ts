import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const EXPIRY_DAYS = 7
const limiter = rateLimit({ interval: 60_000, limit: 10 })

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const rl = limiter(getClientIp(_req))
  if (!rl.success) return rateLimitResponse(rl)

  const { token } = await params

  if (!token || token.length < 16) {
    return new NextResponse('Token inválido', { status: 400 })
  }

  try {
    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { downloadToken: { equals: token  } },
          { status:        { equals: 'approved' } },
        ],
      },
      limit: 1,
    })

    const order = docs[0]
    if (!order) {
      return new NextResponse('Link inválido ou expirado', { status: 404 })
    }

    // Check expiry
    const sentAt = order.downloadSentAt ? new Date(order.downloadSentAt) : null
    if (sentAt) {
      const expiryDate = new Date(sentAt)
      expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS)
      if (new Date() > expiryDate) {
        return new NextResponse('Link expirado. Entre em contato para reenvio.', { status: 410 })
      }
    }

    // Get product & PDF
    const product = typeof order.product === 'object' ? order.product : null
    if (!product) {
      return new NextResponse('Produto não encontrado', { status: 404 })
    }

    const pdfFile = typeof product.pdfFile === 'object' ? product.pdfFile : null
    if (!pdfFile?.url) {
      return new NextResponse('Arquivo não encontrado', { status: 404 })
    }

    // Redirect to the PDF file (or proxy it)
    const pdfUrl = pdfFile.url.startsWith('http')
      ? pdfFile.url
      : `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}${pdfFile.url}`

    return NextResponse.redirect(pdfUrl, { status: 302 })
  } catch (err) {
    console.error('[Download] Error:', err)
    return new NextResponse('Erro interno', { status: 500 })
  }
}
