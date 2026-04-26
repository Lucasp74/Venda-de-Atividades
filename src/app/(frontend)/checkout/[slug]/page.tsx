import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Product } from '@/payload-types'
import CheckoutWrapper from '@/components/CheckoutWrapper'
import { BLUR_DATA_URL } from '@/lib/blur-placeholder'

// cache() deduplica chamadas com o mesmo slug na mesma requisição —
// generateMetadata e CheckoutPage consultam o banco apenas uma vez.
const getProduct = cache(async function (slug: string): Promise<Product | null> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'products',
      where: {
        and: [
          { slug:   { equals: slug        } },
          { status: { equals: 'published' } },
        ],
      },
      limit: 1,
    })
    return (docs[0] as Product) ?? null
  } catch {
    return null
  }
})

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product  = await getProduct(slug)
  if (!product) return { title: 'Checkout' }
  return {
    title: `Checkout — ${product.title}`,
    robots: { index: false, follow: false },
  }
}

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product  = await getProduct(slug)
  if (!product) notFound()

  const cover          = typeof product.coverImage === 'object' ? product.coverImage : null
  const imgSrc         = cover?.url ?? null
  const priceFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)

  return (
    <>
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-gray-100 py-3" aria-label="Breadcrumb">
        <div className="max-w-5xl mx-auto px-4">
          <ol className="flex items-center gap-2 text-body-sm text-ink-muted list-none">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/atividades/${slug}`} className="hover:text-primary transition-colors">{product.title}</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink font-700">Checkout</li>
          </ol>
        </div>
      </nav>

      <section className="py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

            {/* ── Resumo do Produto (sidebar) ── */}
            <div className="lg:col-span-2 lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border-2 border-primary-100 p-5 shadow-card">
                <h2 className="font-heading font-700 text-h4 text-ink mb-4">Resumo do pedido</h2>

                <div className="flex gap-4 items-start mb-4">
                  {imgSrc ? (
                    <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-primary-50 flex-shrink-0">
                      <Image
                        src={imgSrc}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-16 rounded-lg bg-primary-50 flex items-center justify-center text-2xl flex-shrink-0">
                      <span aria-hidden="true">&#128196;</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-heading font-700 text-body text-ink truncate">{product.title}</p>
                    <p className="text-caption text-ink-muted">Atividade digital (PDF)</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-ink-muted text-body-sm">Total</span>
                    <span className="font-heading font-800 text-h3 text-primary">{priceFormatted}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    { icon: '\u{1F4E5}', text: 'Download imediato' },
                    { icon: '\u{1F5A8}', text: 'Pronto para imprimir' },
                    { icon: '\u{1F512}', text: 'Pagamento 100% seguro' },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-caption text-ink-muted">
                      <span aria-hidden="true">{icon}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Formulário de Pagamento (Brick) ── */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border-2 border-primary-100 p-5 md:p-8 shadow-card">
                <h1 className="font-heading font-700 text-h3 text-ink mb-6">Dados de Pagamento</h1>
                <CheckoutWrapper
                  productId={product.id.toString()}
                  productTitle={product.title}
                  price={product.price}
                />
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
