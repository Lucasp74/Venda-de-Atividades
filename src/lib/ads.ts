/**
 * ─────────────────────────────────────────────────────────────
 *  Google Ads — Rastreamento de Conversões
 * ─────────────────────────────────────────────────────────────
 *
 *  COMO ATIVAR:
 *  1. Acesse https://ads.google.com → Ferramentas → Conversões
 *  2. Crie uma ação de conversão do tipo "Compra no site"
 *  3. Copie o ID da conta (AW-XXXXXXXXX) e o rótulo da conversão
 *  4. Adicione no .env.local:
 *       NEXT_PUBLIC_GADS_ID=AW-XXXXXXXXX
 *       NEXT_PUBLIC_GADS_PURCHASE_LABEL=seu_rotulo_aqui
 *  5. O componente <Analytics /> já inclui o script do Google Ads
 *     automaticamente junto com o GA4 quando o ID for preenchido.
 *
 *  REMARKETING:
 *  Para campanhas de remarketing (mostrar anúncios para quem
 *  visitou o site), ative o Google Ads Remarketing no painel e
 *  use a função trackPageView() — ela já envia o sinal correto.
 * ─────────────────────────────────────────────────────────────
 */

export const GADS_ID             = process.env.NEXT_PUBLIC_GADS_ID ?? ''
export const GADS_PURCHASE_LABEL = process.env.NEXT_PUBLIC_GADS_PURCHASE_LABEL ?? ''

// ── Tipagem do gtag (compartilhada com analytics.ts) ─────────
declare global {
  interface Window {
    gtag: (command: string, targetId: string, params?: Record<string, unknown>) => void
  }
}

function isAdsEnabled(): boolean {
  return typeof window !== 'undefined' && !!GADS_ID && typeof window.gtag === 'function'
}

// ── Eventos de conversão ─────────────────────────────────────

/**
 * Dispara conversão de compra no Google Ads.
 * Chame logo após confirmar o pagamento na página de sucesso
 * ou no cliente após retorno do Mercado Pago.
 */
export function trackAdsPurchase(order: {
  transactionId: string
  value:         number
  currency?:     string
}) {
  if (!isAdsEnabled() || !GADS_PURCHASE_LABEL) return

  window.gtag('event', 'conversion', {
    send_to:        `${GADS_ID}/${GADS_PURCHASE_LABEL}`,
    transaction_id: order.transactionId,
    value:          order.value,
    currency:       order.currency ?? 'BRL',
  })
}

/**
 * Evento de remarketing — visita a uma página de produto.
 * O Google Ads usa isso para montar audiências de remarketing.
 */
export function trackAdsViewProduct(product: { id: string; name: string; price: number }) {
  if (!isAdsEnabled()) return

  window.gtag('event', 'view_item', {
    send_to: GADS_ID,
    value:   product.price,
    items: [{
      id:       product.id,
      google_business_vertical: 'retail',
    }],
  })
}

/**
 * Clique em "Comprar" / início do checkout.
 * Útil para campanhas de abandono de carrinho.
 */
export function trackAdsBeginCheckout(product: { id: string; price: number }) {
  if (!isAdsEnabled()) return

  window.gtag('event', 'begin_checkout', {
    send_to: GADS_ID,
    value:   product.price,
    items: [{
      id:       product.id,
      google_business_vertical: 'retail',
    }],
  })
}
