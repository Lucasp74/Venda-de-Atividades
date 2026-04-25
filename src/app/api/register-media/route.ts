import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { url, filename, mimeType, filesize } = (await req.json()) as {
    url: string
    filename: string
    mimeType: string
    filesize: number
  }

  try {
    const media = await payload.create({
      collection: 'media',
      data: { filename, mimeType, filesize, url, alt: '' },
      overrideAccess: true,
    })
    return NextResponse.json({ id: media.id, url: (media as Record<string, unknown>).url ?? url })
  } catch (err) {
    console.error('[register-media]', err)
    return NextResponse.json({ error: 'Erro ao registrar mídia' }, { status: 500 })
  }
}
