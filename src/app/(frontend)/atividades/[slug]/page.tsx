import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Product } from '@/payload-types'
import BuyButton from '@/components/BuyButton'
import { BLUR_DATA_URL } from '@/lib/blur-placeholder'

// ── ISR: revalida cada página de produto a cada 1 hora
export const revalidate = 3600

const CATEGORY_LABELS: Record<string, string> = {
  alfabetizacao: 'Alfabetização e Leitura',
  matematica:    'Matemática Divertida',
  artes:         'Artes e Criatividade',
  ciencias:      'Ciências e Natureza',
  jogos:         'Jogos e Brincadeiras',
  sequencias:    'Sequências Didáticas',
}

/** Pré-gera todas as páginas de produto no build — zero cold start */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'products',
      where: { status: { equals: 'published' } },
      limit: 1000,
      select: { slug: true },
    })
    return docs
      .filter((p): p is typeof p & { slug: string } => typeof p.slug === 'string')
      .map(p => ({ slug: p.slug }))
  } catch {
    return []
  }
}

async function getProduct(slug: string): Promise<Product | null> {
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
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product  = await getProduct(slug)
  if (!product) return { title: 'Atividade não encontrada' }
  return {
    title:       product.title,
    description: product.description,
    openGraph: {
      title:       product.title,
      description: product.description,
      type:        'website',
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product  = await getProduct(slug)
  if (!product) notFound()

  const cover      = typeof product.coverImage === 'object' ? product.coverImage : null
  const imgSrc     = cover?.url ?? null
  const catLabel   = CATEGORY_LABELS[product.category] ?? product.category
  const priceFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)

  return (
    <>
      {/* ── Barra de compra sticky no mobile ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-primary-100 px-4 py-3 flex items-center justify-between gap-3 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-bottom"
        aria-label="Comprar atividade"
      >
        <div className="min-w-0">
          <p className="text-caption text-ink-light truncate">{product.title}</p>
          <span className="font-heading font-800 text-h3 text-primary tabular-nums leading-tight">{priceFormatted}</span>
        </div>
        <div className="flex-shrink-0">
          <BuyButton productSlug={product.slug} productTitle={product.title} compact />
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="bg-white border-b border-gray-100 py-3" aria-label="Breadcrumb">
        <div className="container-main">
          <ol className="flex items-center gap-2 text-body-sm text-ink-muted list-none" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/" className="hover:text-primary transition-colors" itemProp="item">
                <span itemProp="name">Home</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <li aria-hidden="true">/</li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/atividades" className="hover:text-primary transition-colors" itemProp="item">
                <span itemProp="name">Atividades</span>
              </Link>
              <meta itemProp="position" content="2" />
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink font-700 truncate max-w-[200px]" aria-current="page">{product.title}</li>
          </ol>
        </div>
      </nav>

      {/* Product detail — pb-28 no mobile reserva espaço para a barra sticky */}
      <section className="py-10 md:py-12 pb-28 md:pb-12" aria-labelledby="product-title">
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-primary-50 shadow-card-lg">
              {imgSrc ? (
                <Image
                  src={imgSrc}
                  alt={cover?.alt ?? product.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-8xl" aria-hidden="true">📄</div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-5">
              <div>
                <span className="badge bg-primary-50 text-primary-700 border border-primary-200 text-caption">
                  {catLabel}
                </span>
                <h1 id="product-title" className="font-heading text-h2 md:text-h1 text-ink mt-3 mb-3">{product.title}</h1>
                <p className="text-ink-muted text-body leading-relaxed">{product.description}</p>
              </div>

              {/* Details */}
              {product.details && product.details.length > 0 && (
                <ul className="space-y-2" aria-label="O que está incluído">
                  {product.details.map(({ item }, i) => (
                    item && (
                      <li key={i} className="flex items-center gap-2 text-body-sm text-ink">
                        <span className="w-5 h-5 rounded-full bg-accent-green flex items-center justify-center text-white text-[0.6rem]" aria-hidden="true">✓</span>
                        {item}
                      </li>
                    )
                  ))}
                </ul>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: '📥', text: 'Download imediato'   },
                  { icon: '🖨️', text: 'Pronto para imprimir'},
                  { icon: '🔒', text: 'Compra 100% segura'  },
                ].map(({ icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5 bg-surface-muted rounded-pill px-3 py-1.5 text-caption font-700 text-ink-muted">
                    <span aria-hidden="true">{icon}</span> {text}
                  </span>
                ))}
              </div>

              {/* Price + Buy */}
              <div className="bg-white rounded-2xl border-2 border-primary-100 p-6 mt-2">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="font-heading font-800 text-display text-primary tabular-nums">{priceFormatted}</span>
                  <span className="text-ink-muted text-body-sm">pagamento único</span>
                </div>

                <BuyButton productSlug={product.slug} productTitle={product.title} />

                <p className="text-caption text-ink-light text-center mt-4 flex items-center justify-center gap-1">
                  <span aria-hidden="true">🔒</span>
                  Pagamento seguro via Mercado Pago · PIX, Cartão ou Boleto
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
