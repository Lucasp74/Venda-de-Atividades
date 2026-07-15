'use client'

import { useRouter } from 'next/navigation'

type Props = {
  productSlug:  string
  productTitle: string
  price:        number
  /** Modo compacto — usado na barra sticky mobile */
  compact?:     boolean
}

export default function BuyButton({ productSlug, productTitle, price, compact = false }: Props) {
  const router = useRouter()
  const isFree = price === 0

  const handleClick = () => {
    router.push(isFree ? `/gratis/${productSlug}` : `/checkout/${productSlug}`)
  }

  const label = isFree ? 'Baixar Grátis' : 'Comprar Agora'

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className="btn-primary text-sm px-5 py-2.5 whitespace-nowrap"
        aria-label={`${label} ${productTitle}`}
      >
        {label}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="btn-primary w-full text-base py-4 text-lg"
      aria-label={`${label} ${productTitle}`}
    >
      {label}
    </button>
  )
}
