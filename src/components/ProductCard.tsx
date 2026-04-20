import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/payload-types'

const CATEGORY_STYLES: Record<string, { bg: string; label: string; badge: string }> = {
  alfabetizacao:      { bg: 'bg-card-alfa',  label: 'Alfabetização',      badge: 'bg-pink-100   text-pink-700'   },
  matematica:         { bg: 'bg-card-mat',   label: 'Matemática',          badge: 'bg-blue-100   text-blue-700'   },
  portugues:          { bg: 'bg-card-alfa',  label: 'Língua Portuguesa',   badge: 'bg-rose-100   text-rose-700'   },
  ciencias:           { bg: 'bg-card-sci',   label: 'Ciências',            badge: 'bg-green-100  text-green-700'  },
  'historia-geografia':{ bg: 'bg-card-arts', label: 'História/Geografia',  badge: 'bg-amber-100  text-amber-700'  },
  artes:              { bg: 'bg-card-arts',  label: 'Artes',               badge: 'bg-yellow-100 text-yellow-700' },
  'educacao-fisica':  { bg: 'bg-card-sci',   label: 'Ed. Física',          badge: 'bg-teal-100   text-teal-700'   },
  jogos:              { bg: 'bg-card-games', label: 'Jogos',               badge: 'bg-purple-100 text-purple-700' },
  sequencias:         { bg: 'bg-card-seq',   label: 'Sequências',          badge: 'bg-red-100    text-red-700'    },
  'datas-comemorativas':{ bg:'bg-card-arts', label: 'Datas Comemorativas', badge: 'bg-orange-100 text-orange-700' },
  'coordenacao-motora':{ bg:'bg-card-mat',   label: 'Coord. Motora',       badge: 'bg-sky-100    text-sky-700'    },
  valores:            { bg: 'bg-card-seq',   label: 'Valores',             badge: 'bg-fuchsia-100 text-fuchsia-700'},
}

const LEVEL_LABELS: Record<string, string> = {
  infantil:       'Ed. Infantil',
  'fund1-1ano':   '1º ano',
  'fund1-2ano':   '2º ano',
  'fund1-3ano':   '3º ano',
  'fund1-4ano':   '4º ano',
  'fund1-5ano':   '5º ano',
  'infantil-fund1':'Infantil + F1',
}

type Props = {
  product:  Product
  featured?: boolean
}

export default function ProductCard({ product, featured = false }: Props) {
  const style  = CATEGORY_STYLES[product.category] ?? CATEGORY_STYLES.alfabetizacao
  const cover  = typeof product.coverImage === 'object' ? product.coverImage : null
  const imgSrc = cover?.url ?? null
  const level  = LEVEL_LABELS[product.schoolLevel] ?? ''

  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
  }).format(product.price)

  return (
    <Link
      href={`/atividades/${product.slug}`}
      className="block"
      aria-label={`Ver detalhes: ${product.title}`}
    >
      <article className="card group cursor-pointer" aria-label={`Produto: ${product.title}`}>
        {/* Thumbnail */}
        <div className={`relative h-44 ${style.bg} flex items-center justify-center overflow-hidden`}>
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={cover?.alt ?? product.title}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-5xl select-none opacity-70" aria-hidden="true">📄</span>
          )}
          {featured && (
            <span className="absolute top-3 right-3 badge bg-accent-green text-white text-[0.65rem]" aria-label="Produto em destaque">
              Destaque
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`badge ${style.badge} text-[0.65rem] w-fit`}>{style.label}</span>
            {level && (
              <span className="badge bg-gray-100 text-gray-600 text-[0.65rem]">{level}</span>
            )}
          </div>
          <h3 className="font-heading font-700 text-body-sm leading-snug line-clamp-2">{product.title}</h3>

          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="font-heading font-800 text-primary text-h4 tabular-nums">{priceFormatted}</span>
            <span
              className="btn-primary text-sm px-4 py-2 min-h-[40px]"
              aria-hidden="true"
            >
              Comprar
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
