'use client'

import { useState }          from 'react'
import { useRouter }          from 'next/navigation'
import Link                   from 'next/link'
import Image                  from 'next/image'
import dynamic                from 'next/dynamic'
import { useCart }            from '@/context/CartContext'
import { BLUR_DATA_URL }      from '@/lib/blur-placeholder'

const CartCheckoutBrick = dynamic(() => import('@/components/CartCheckoutBrick'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary rounded-full animate-spin" />
    </div>
  ),
})

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function CartPage() {
  const { items, removeItem, clearCart, totalItems, totalPrice } = useCart()
  const router      = useRouter()
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [buyerName,  setBuyerName]  = useState('')
  const [nameError,  setNameError]  = useState(false)
  // Estado do checkout inline (múltiplos itens)
  const [checkoutData, setCheckoutData] = useState<{
    preferenceId: string
    amount:       number
    productIds:   string[]
  } | null>(null)

  const handleCheckout = async () => {
    if (items.length === 0) return
    if (!buyerName.trim()) {
      setNameError(true)
      document.getElementById('cart-buyer-name')?.focus()
      return
    }
    setNameError(false)
    setLoading(true)
    setError(null)

    try {
      // Sempre usa o checkout inline — evita pedir o nome duas vezes
      const res = await fetch('/api/mercadopago/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.productId,
            title:     i.title,
            price:     i.price,
          })),
          buyerName: buyerName.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as any).error ?? 'Erro ao criar preferência')
      }

      const { preference_id } = await res.json()
      if (!preference_id) throw new Error('Preferência de pagamento não criada')

      // Exibe o Checkout Brick inline (sem redirecionar para o MP externo)
      setCheckoutData({
        preferenceId: preference_id,
        amount:       totalPrice,
        productIds:   items.map(i => i.productId),
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Tente novamente em instantes.')
      setLoading(false)
    }
  }

  // ── Carrinho vazio ───────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <section className="py-20 flex flex-col items-center gap-6 text-center container-main">
        <span className="text-7xl" aria-hidden="true">🛒</span>
        <h1 className="font-heading text-h2 text-ink">Seu carrinho está vazio</h1>
        <p className="text-ink-muted text-body max-w-sm">
          Adicione atividades ao carrinho para comprá-las juntas em um único pagamento.
        </p>
        <Link href="/atividades" className="btn-primary">
          Ver Atividades
        </Link>
      </section>
    )
  }

  // ── Carrinho com itens ───────────────────────────────────────────────────

  return (
    <section className="py-10 md:py-14" aria-labelledby="cart-title">
      <div className="container-main">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <h1 id="cart-title" className="font-heading text-h2 text-ink">
            Meu Carrinho
            <span className="ml-2 text-ink-muted font-body font-400 text-body">
              ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
            </span>
          </h1>
          <button
            onClick={clearCart}
            className="text-caption text-ink-muted hover:text-red-500 transition-colors underline underline-offset-2"
          >
            Limpar carrinho
          </button>
        </div>

        {/* ── Checkout inline (múltiplos itens) ── */}
        {checkoutData && (
          <div className="bg-white rounded-2xl border-2 border-primary-100 p-6 md:p-8 shadow-card mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-700 text-h3 text-ink">Dados de Pagamento</h2>
              <button
                onClick={() => setCheckoutData(null)}
                className="text-caption text-ink-muted hover:text-ink transition-colors"
              >
                ← Voltar ao carrinho
              </button>
            </div>
            <CartCheckoutBrick
              preferenceId={checkoutData.preferenceId}
              amount={checkoutData.amount}
              buyerName={buyerName}
              productIds={checkoutData.productIds}
            />
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 items-start ${checkoutData ? 'hidden' : ''}`}>

          {/* ── Lista de itens ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map(item => (
              <article
                key={item.productId}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-primary-50">
                  {item.coverImage ? (
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-3xl" aria-hidden="true">📄</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/atividades/${item.slug}`}
                    className="font-heading font-700 text-body-sm text-ink hover:text-primary transition-colors line-clamp-2 leading-snug"
                  >
                    {item.title}
                  </Link>
                  <p className="font-heading font-800 text-primary tabular-nums mt-1">
                    {fmt(item.price)}
                  </p>
                </div>

                {/* Remover */}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-ink-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label={`Remover ${item.title} do carrinho`}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </article>
            ))}

            <Link
              href="/atividades"
              className="text-caption text-primary hover:underline mt-2 self-start"
            >
              ← Continuar comprando
            </Link>
          </div>

          {/* ── Resumo do pedido ── */}
          <aside
            className="bg-white rounded-2xl border-2 border-primary-100 p-6 flex flex-col gap-4 sticky top-24"
            aria-label="Resumo do pedido"
          >
            <h2 className="font-heading font-700 text-body-sm text-ink uppercase tracking-wide">
              Resumo do pedido
            </h2>

            {/* Subtotal por item */}
            <ul className="flex flex-col gap-2 text-body-sm">
              {items.map(item => (
                <li key={item.productId} className="flex justify-between gap-2 text-ink-muted">
                  <span className="truncate flex-1">{item.title}</span>
                  <span className="tabular-nums flex-shrink-0">{fmt(item.price)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline">
              <span className="font-heading font-700 text-ink">Total</span>
              <span className="font-heading font-800 text-primary text-h3 tabular-nums">{fmt(totalPrice)}</span>
            </div>

            {/* Campo de nome */}
            <div>
              <label
                htmlFor="cart-buyer-name"
                className="block text-caption font-700 text-ink mb-1"
              >
                Seu nome completo
              </label>
              <input
                id="cart-buyer-name"
                type="text"
                value={buyerName}
                onChange={e => { setBuyerName(e.target.value); if (nameError) setNameError(false) }}
                placeholder="Como você quer ser chamado(a)"
                autoComplete="name"
                className={`w-full rounded-xl border px-3 py-2 text-body-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:border-transparent transition ${
                  nameError
                    ? 'border-red-400 ring-2 ring-red-300 bg-red-50'
                    : 'border-gray-200 focus:ring-primary'
                }`}
              />
              {nameError && (
                <p className="text-caption text-red-500 mt-1">
                  Por favor, informe seu nome para continuar.
                </p>
              )}
            </div>

            {error && (
              <p className="text-caption text-red-500 bg-red-50 rounded-xl px-3 py-2 text-center">
                {error}
              </p>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn-primary w-full text-base"
            >
              {loading ? 'Aguarde…' : 'Finalizar compra'}
            </button>

            <p className="text-caption text-ink-light text-center flex items-center justify-center gap-1">
              <span aria-hidden="true">🔒</span>
              Pagamento seguro via Mercado Pago
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
