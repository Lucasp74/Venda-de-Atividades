import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Verifica autenticação antes de gerar token de upload
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = (await req.json()) as HandleUploadBody

  try {
    const response = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/*', 'application/pdf'],
        maximumSizeInBytes: 100 * 1024 * 1024, // 100 MB
      }),
      onUploadCompleted: async () => {
        // Registro da mídia feito pelo cliente via /api/register-media
      },
    })
    return NextResponse.json(response)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
