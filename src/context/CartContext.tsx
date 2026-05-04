'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type CartItem = {
  productId:  string
  slug:       string
  title:      string
  price:      number
  coverImage: string | null
}

type CartContextValue = {
  items:       CartItem[]
  addItem:     (item: CartItem) => void
  removeItem:  (productId: string) => void
  clearCart:   () => void
  hasItem:     (productId: string) => boolean
  totalItems:  number
  totalPrice:  number
}

// ─── Context ─────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'prodani:cart'

// ─── Provider ────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [items,     setItems]     = useState<CartItem[]>([])
  const [hydrated,  setHydrated]  = useState(false)

  // Lê o carrinho do localStorage uma única vez no mount (client-side)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch { /* localStorage indisponível — ignora */ }
    setHydrated(true)
  }, [])

  // Persiste sempre que os itens mudam (depois do hydrate)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch { /* ignora */ }
  }, [items, hydrated])

  const addItem = useCallback((item: CartItem) => {
    setItems(prev =>
      prev.some(i => i.productId === item.productId) ? prev : [...prev, item],
    )
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const hasItem = useCallback(
    (productId: string) => items.some(i => i.productId === productId),
    [items],
  )

  const totalItems = items.length
  const totalPrice = items.reduce((sum, i) => sum + i.price, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, hasItem, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de <CartProvider>')
  return ctx
}
