import type { Metadata } from 'next'
import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@payload-config'
import ProductCard from '@/components/ProductCard'
import CategoryFilter from '@/components/CategoryFilter'
import type { Product } from '@/payload-types'

// Sem ISR fixo — a página usa searchParams (dinâmica por natureza).
// unstable_cache com tag 'products' garante atualização imediata ao salvar.
export const revalidate = 60

export const metadata: Metadata = {
  title:       'Atividades para Professores',
  description: 'Explore atividades de alfabetização, consciência fonológica, matemática e muito mais. Materiais pedagógicos em PDF prontos para imprimir para Educação Infantil e Fundamental 1.',
  openGraph: {
    title:       'Atividades para Professores | Prô Dani',
    description: 'Materiais pedagógicos em PDF prontos para imprimir. Alfabetização, matemática, consciência fonológica e mais.',
    type:        'website',
  },
}

const getProducts = unstable_cache(
  async (category?: string): Promise<{ docs: Product[]; totalDocs: number }> => {
    try {
      const payload = await getPayload({ config })
      const conditions: Where[] = [{ status: { equals: 'published' } }]
      if (category) conditions.push({ category: { equals: category } })

      const result = await payload.find({
        collection: 'products',
        where: { and: conditions },
        limit: 100,
        sort: '-createdAt',
      })
      return { docs: result.docs as Product[], totalDocs: result.totalDocs }
    } catch {
      return { docs: [], totalDocs: 0 }
    }
  },
  ['atividades-list'],
  { tags: ['products'] },
)

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-card">
          <div className="skeleton aspect-[5/3] w-full" />
          <div className="p-4 space-y-2">
            <div className="skeleton h-3 w-20 rounded-full" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="flex justify-between mt-3">
              <div className="skeleton h-6 w-16 rounded" />
              <div className="skeleton h-9 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

async function ProductGrid({ category }: { category?: string }) {
  const { docs, totalDocs } = await getProducts(category)

  if (docs.length === 0) {
    return (
      <div className="text-center py-20" role="status">
        <div className="text-6xl mb-4" aria-hidden="true">🔍</div>
        <h3 className="font-heading font-700 text-h3 mb-2">Nenhuma atividade encontrada</h3>
        <p className="text-ink-muted text-body">Tente outra categoria ou volte em breve para novidades!</p>
      </div>
    )
  }

  return (
    <>
      <p className="text-ink-muted text-body-sm mb-6" role="status" aria-live="polite">
        {totalDocs} {totalDocs === 1 ? 'atividade encontrada' : 'atividades encontradas'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {docs.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )
}

type PageProps = {
  searchParams: Promise<{ cat?: string }>
}

export default async function AtividadesPage({ searchParams }: PageProps) {
  const { cat } = await searchParams

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-50 to-yellow-50 py-14 text-center" aria-labelledby="atividades-heading">
        <div className="container-main">
          <h1 id="atividades-heading" className="font-heading text-h1 mb-3">
            Todas as Atividades
          </h1>
          <p className="text-ink-muted text-body-lg max-w-lg mx-auto">
            Materiais pedagógicos de qualidade para tornar cada aula inesquecível
          </p>
        </div>
      </section>

      {/* Filters — sticky abaixo da navbar, scroll horizontal no mobile */}
      <section className="py-4 md:py-8 bg-white border-b border-gray-100 sticky top-[70px] z-30" aria-label="Filtros de categoria">
        <div className="container-main overflow-hidden">
          <Suspense>
            <CategoryFilter />
          </Suspense>
        </div>
      </section>

      {/* Products */}
      <section className="py-8 md:py-12 pb-20 md:pb-12" aria-label="Lista de atividades">
        <div className="container-main">
          <Suspense fallback={<ProductsSkeleton />}>
            <ProductGrid category={cat} />
          </Suspense>
        </div>
      </section>
    </>
  )
}
