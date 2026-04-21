import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import crypto from 'crypto'

export function getMercadoPagoClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado')
  return new MercadoPagoConfig({ accessToken })
}

// ── Preferência (ainda usada para back_urls do Wallet) ────────────
export type CreatePreferenceParams = {
  productId:    string
  productTitle: string
  price:        number
  buyerEmail?:  string
  buyerName?:   string
}

export async function createPreference(params: CreatePreferenceParams) {
  const client     = getMercadoPagoClient()
  const preference = new Preference(client)

  const baseUrl     = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const isLocalhost = baseUrl.includes('localhost')

  const body: Record<string, unknown> = {
    items: [
      {
        id:          params.productId,
        title:       params.productTitle,
        unit_price:  params.price,
        quantity:    1,
        currency_id: 'BRL',
      },
    ],
    payer: params.buyerEmail
      ? { email: params.buyerEmail, name: params.buyerName }
      : undefined,
    back_urls: {
      success: `${baseUrl}/checkout/sucesso`,
      failure: `${baseUrl}/checkout/falhou`,
      pending: `${baseUrl}/checkout/pendente`,
    },
    ...(!isLocalhost && { auto_return: 'approved' }),
    ...(!isLocalhost && { notification_url: `${baseUrl}/api/mercadopago/webhook` }),
    statement_descriptor: 'PRO DANI ATIVIDADES',
    metadata: {
      product_id: params.productId,
    },
  }

  return preference.create({ body })
}

// ── Processar pagamento (Checkout Bricks) ─────────────────────────
export type ProcessPaymentParams = {
  token:              string
  issuer_id:          string
  payment_method_id:  string
  transaction_amount: number
  installments:       number
  payer: {
    email:           string
    identification?: {
      type:   string
      number: string
    }
  }
  productId:    string
  productTitle: string
  sessionId?:   string
}

export async function processPayment(params: ProcessPaymentParams) {
  const client     = getMercadoPagoClient()
  const paymentApi = new Payment(client)

  // Usa sessionId do frontend quando disponível — garante que retries não criem cobranças duplicadas
  const idempotencyKey = params.sessionId ?? crypto.randomUUID()

  const result = await paymentApi.create({
    body: {
      token:              params.token,
      issuer_id:          Number(params.issuer_id) || undefined,
      payment_method_id:  params.payment_method_id,
      transaction_amount: Number(params.transaction_amount),
      installments:       params.installments,
      payer:              params.payer,
      description:        params.productTitle,
      statement_descriptor: 'PRO DANI',
      metadata: {
        product_id: params.productId,
      },
    },
    requestOptions: {
      idempotencyKey,
    },
  })

  return result
}
