'use client'

import { useRouter } from 'next/navigation'

type Props = {
  productSlug:  string
  productTitle: string
  /** Modo compacto — usado na barra sticky mobile */
  compact?:     boolean
}

export default function BuyButton({ productSlug, productTitle, compact = false }: Props) {
  const router = useRouter()

  const handleBuy = () => {
    router.push(`/checkout/${productSlug}`)
  }

  if (compact) {
    return (
      <button
        onClick={handleBuy}
        className="btn-primary text-sm px-5 py-2.5 whitespace-nowrap"
        aria-label={`Comprar ${productTitle}`}
      >
        Comprar Agora
      </button>
    )
  }

  return (
    <button
      onClick={handleBuy}
      className="btn-primary w-full text-base py-4 text-lg"
      aria-label={`Comprar ${productTitle}`}
    >
      Comprar Agora
    </button>
  )
}
