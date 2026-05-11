import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@payload-config'

const PAGE_SIZE = 12

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const page     = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const category = searchParams.get('cat') || undefined

    const payload = await getPayload({ config })

    const conditions: Where[] = [{ status: { equals: 'published' } }]
    if (category) conditions.push({ category: { equals: category } })

    const result = await payload.find({
      collection: 'products',
      where: { and: conditions },
      limit: PAGE_SIZE,
      page,
      sort: '-createdAt',
    })

    return NextResponse.json({ docs: result.docs, totalDocs: result.totalDocs })
  } catch (err) {
    console.error('[API/products] Error:', err)
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}
