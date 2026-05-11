'use client'

import { useState } from 'react'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/payload-types'

const PAGE_SIZE = 12

type Props = {
  initialProducts: Product[]
  totalDocs:       number
  category?:       string
}

export default function LoadMoreProducts({ initialProducts, totalDocs, category }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(false)

  const hasMore = products.length < totalDocs

  const loadMore = async () => {
    setLoading(true)
    try {
      const nextPage = page + 1
      const url = `/api/products?page=${nextPage}&limit=${PAGE_SIZE}${category ? `&cat=${encodeURIComponent(category)}` : ''}`
      const res  = await fetch(url)
      const data = await res.json() as { docs: Product[] }
      setProducts(prev => [...prev, ...data.docs])
      setPage(nextPage)
    } catch {
      // falha silenciosa — botão fica disponível para tentar novamente
    } finally {
      setLoading(false)
    }
  }

  if (products.length === 0) {
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
        {products.length} de {totalDocs} {totalDocs === 1 ? 'atividade' : 'atividades'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={loadMore}
            disabled={loading}
            className="btn-primary px-8 py-3 min-w-[200px]"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Carregando…
              </span>
            ) : (
              'Ver mais atividades'
            )}
          </button>
        </div>
      )}
    </>
  )
}
