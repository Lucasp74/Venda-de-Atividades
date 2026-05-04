'use client'

import { useState } from 'react'
import { useCart, type CartItem } from '@/context/CartContext'

type Props = Omit<CartItem, never> & {
  compact?: boolean
}

export default function AddToCartButton({ compact = false, ...item }: Props) {
  const { addItem, hasItem, removeItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const inCart = hasItem(item.productId)

  const handleClick = () => {
    if (inCart) {
      removeItem(item.productId)
      return
    }
    addItem(item)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={`text-sm px-4 py-2.5 min-h-[44px] rounded-pill font-heading font-700 transition-all duration-200
          ${inCart
            ? 'bg-accent-green/10 text-accent-green border-2 border-accent-green'
            : 'bg-primary-50 text-primary border-2 border-primary hover:bg-primary-100'
          }`}
        aria-label={inCart ? `Remover ${item.title} do carrinho` : `Adicionar ${item.title} ao carrinho`}
      >
        {inCart ? '✓ No carrinho' : '+ Carrinho'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`btn-outline w-full text-base py-4 text-lg transition-all duration-200
        ${inCart ? 'border-accent-green text-accent-green hover:bg-accent-green hover:text-white' : ''}`}
      aria-label={inCart ? `Remover ${item.title} do carrinho` : `Adicionar ${item.title} ao carrinho`}
    >
      {justAdded ? '✓ Adicionado ao carrinho!' : inCart ? '✓ No carrinho — remover' : '🛒 Adicionar ao carrinho'}
    </button>
  )
}
