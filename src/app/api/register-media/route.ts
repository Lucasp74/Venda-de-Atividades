import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getPool } from '@/lib/db'

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
    // INSERT direto — evita que o vercelBlobStorage plugin sobrescreva a URL com null
    const { rows: [media] } = await getPool().query<{ id: number }>(
      `INSERT INTO media (url, filename, mime_type, filesize, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [url, filename, mimeType, filesize],
    )
    return NextResponse.json({ id: media.id, url })
  } catch (err) {
    console.error('[register-media]', err)
    return NextResponse.json({ error: 'Erro ao registrar mídia' }, { status: 500 })
  }
}
