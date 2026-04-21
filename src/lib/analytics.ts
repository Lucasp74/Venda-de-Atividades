/**
 * ─────────────────────────────────────────────────────────────
 *  Google Analytics 4 — Integração
 * ─────────────────────────────────────────────────────────────
 *
 *  COMO ATIVAR:
 *  1. Crie uma propriedade GA4 em https://analytics.google.com
 *  2. Copie o Measurement ID (formato: G-XXXXXXXXXX)
 *  3. Adicione no .env.local:
 *       NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 *  4. O componente <Analytics /> no layout já carrega o script
 *     automaticamente assim que a variável for preenchida.
 *
 *  EVENTOS PERSONALIZADOS:
 *  Use as funções abaixo em qualquer componente client-side
 *  ou nos Route Handlers do servidor (via Measurement Protocol).
 * ─────────────────────────────────────────────────────────────
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''

// ── Tipagem do gtag global ──────────────────────────────────
type GtagCommand = 'config' | 'event' | 'js' | 'set'

declare global {
  interface Window {
    gtag: (command: GtagCommand, targetId: string, params?: Record<string, unknown>) => void
    dataLayer: unknown[]
  }
}

/** Verifica se o GA está carregado e configurado */
function isGAEnabled(): boolean {
  return typeof window !== 'undefined' && !!GA_MEASUREMENT_ID && typeof window.gtag === 'function'
}

// ── Eventos padrão ────────────────────────────────────────────

/** Registra visualização de página (chamado automaticamente pelo <Analytics />) */
export function trackPageView(url: string) {
  if (!isGAEnabled()) return
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: url })
}

/** Usuário visualizou um produto */
export function trackViewProduct(product: { id: string; name: string; price: number; category: string }) {
  if (!isGAEnabled()) return
  window.gtag('event', 'view_item', {
    currency: 'BRL',
    value: product.price,
    items: [{
      item_id:       product.id,
      item_name:     product.name,
      item_category: product.category,
      price:         product.price,
      quantity:      1,
    }],
  })
}

/** Usuário clicou em "Comprar" — início do checkout */
export function trackBeginCheckout(product: { id: string; name: string; price: number; category: string }) {
  if (!isGAEnabled()) return
  window.gtag('event', 'begin_checkout', {
    currency: 'BRL',
    value: product.price,
    items: [{
      item_id:       product.id,
      item_name:     product.name,
      item_category: product.category,
      price:         product.price,
      quantity:      1,
    }],
  })
}

/** Compra concluída — disparar no webhook após pagamento aprovado via Measurement Protocol */
export function trackPurchase(order: {
  transactionId: string
  productId:     string
  productName:   string
  price:         number
  category:      string
}) {
  if (!isGAEnabled()) return
  window.gtag('event', 'purchase', {
    transaction_id: order.transactionId,
    currency:       'BRL',
    value:          order.price,
    items: [{
      item_id:       order.productId,
      item_name:     order.productName,
      item_category: order.category,
      price:         order.price,
      quantity:      1,
    }],
  })
}

/** Evento customizado genérico */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (!isGAEnabled()) return
  window.gtag('event', eventName, params)
}

// ── Measurement Protocol (server-side) ───────────────────────
/**
 * Envia um evento para o GA4 diretamente do servidor.
 * Usado no webhook do Mercado Pago para registrar compras
 * mesmo sem o navegador do cliente aberto.
 *
 * COMO ATIVAR:
 *  - Adicione no .env.local:
 *      GA_API_SECRET=seu_api_secret_do_ga4
 *    (Encontre em: GA4 → Admin → Data Streams → Measurement Protocol API secrets)
 */
export async function trackServerPurchase(order: {
  transactionId: string
  productId:     string
  productName:   string
  price:         number
  category:      string
  clientId?:     string   // opcional — identificador anônimo do cliente
}): Promise<void> {
  const measurementId = GA_MEASUREMENT_ID
  const apiSecret     = process.env.GA_API_SECRET

  // Retorna silenciosamente se não configurado
  if (!measurementId || !apiSecret) return

  const clientId = order.clientId ?? `server.${Date.now()}`

  // Nota: o GA4 Measurement Protocol exige api_secret como query param (limitação da API Google).
  // Para minimizar exposição, nunca logamos a URL completa em caso de erro.
  const gaUrl = new URL('https://www.google-analytics.com/mp/collect')
  gaUrl.searchParams.set('measurement_id', measurementId)
  gaUrl.searchParams.set('api_secret', apiSecret)

  try {
    await fetch(gaUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        events: [{
          name: 'purchase',
          params: {
            transaction_id:  order.transactionId,
            currency:        'BRL',
            value:           order.price,
            items: [{
              item_id:       order.productId,
              item_name:     order.productName,
              item_category: order.category,
              price:         order.price,
              quantity:      1,
            }],
          },
        }],
      }),
    })
  } catch (err) {
    // Nunca logamos a URL (contém api_secret). Apenas indicamos a falha.
    console.warn('[Analytics] Falha ao enviar evento de compra via Measurement Protocol — transactionId:', order.transactionId)
  }
}
