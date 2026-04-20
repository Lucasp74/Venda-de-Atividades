import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Verifica autenticação
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const fromParam    = searchParams.get('from')
    const toParam      = searchParams.get('to')
    const productParam = searchParams.get('product') // filtro por produto (nome parcial)

    // Padrão: últimos 30 dias
    const to   = toParam   ? new Date(toParam)   : new Date()
    const from = fromParam ? new Date(fromParam)  : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Garante que o "to" vai até o final do dia
    to.setHours(23, 59, 59, 999)
    from.setHours(0, 0, 0, 0)

    // Condições base
    const conditions: Record<string, unknown>[] = [
      { status:    { equals:              'approved'             } },
      { createdAt: { greater_than_equal:  from.toISOString()     } },
      { createdAt: { less_than_equal:     to.toISOString()       } },
    ]

    // Filtro por produto (busca parcial no título)
    if (productParam) {
      conditions.push({ productTitle: { contains: productParam } })
    }

    const result = await payload.find({
      collection: 'orders',
      where: { and: conditions },
      limit: 10000,
      sort: 'createdAt',
    })

    const orders = result.docs

    // ── Lista de produtos distintos para popular o filtro ──────
    const allProducts = await payload.find({
      collection: 'products',
      where: { status: { equals: 'published' } },
      limit: 500,
      sort: 'title',
      select: { title: true },
    })
    const productNames = allProducts.docs.map((p) => p.title).filter(Boolean) as string[]

    // ── Agrupa por dia ────────────────────────────────────────
    const dailyMap = new Map<string, { count: number; revenue: number }>()

    // Preenche todos os dias do período com zero (para o gráfico não ter lacunas)
    const cursor = new Date(from)
    while (cursor <= to) {
      const key = cursor.toISOString().slice(0, 10)
      dailyMap.set(key, { count: 0, revenue: 0 })
      cursor.setDate(cursor.getDate() + 1)
    }

    // Soma os pedidos nos dias correspondentes
    for (const order of orders) {
      const key = new Date(order.createdAt as string).toISOString().slice(0, 10)
      const existing = dailyMap.get(key) ?? { count: 0, revenue: 0 }
      dailyMap.set(key, {
        count:   existing.count + 1,
        revenue: existing.revenue + (order.amount ?? 0),
      })
    }

    const dailySales = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      count:   data.count,
      revenue: Math.round(data.revenue * 100) / 100,
    }))

    // ── Agrupa por produto ────────────────────────────────────
    const productMap = new Map<string, { count: number; revenue: number }>()

    for (const order of orders) {
      const name = order.productTitle ?? 'Produto removido'
      const existing = productMap.get(name) ?? { count: 0, revenue: 0 }
      productMap.set(name, {
        count:   existing.count + 1,
        revenue: existing.revenue + (order.amount ?? 0),
      })
    }

    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        count:   data.count,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)

    // ── Totais do período ─────────────────────────────────────
    const totalOrders  = orders.length
    const totalRevenue = Math.round(orders.reduce((s, o) => s + (o.amount ?? 0), 0) * 100) / 100

    return NextResponse.json({
      dailySales,
      topProducts,
      totalOrders,
      totalRevenue,
      productNames,
      from: from.toISOString().slice(0, 10),
      to:   to.toISOString().slice(0, 10),
    })
  } catch (err) {
    console.error('[Analytics API]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
