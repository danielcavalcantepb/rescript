import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type {
  BillingEvent,
  BillingGatewayAdapter,
  CheckoutRequest,
  CheckoutResult,
  CheckoutStatus,
} from '../application/billing-gateway'

type CaktoOrder = { id?: string; status?: string }

type CaktoGatewayConfig = {
  apiBaseUrl: string
  checkoutBaseUrl: string
  clientId?: string
  clientSecret?: string
  webhookSigningSecret: string
  offersByPriceId: Record<string, string>
}

type CaktoWebhookData = {
  id?: string
  sck?: string
}

let accessToken: { value: string; expiresAt: number } | null = null

function env(name: string) {
  return process.env[name]?.trim()
}

function parseOfferMap(value: string | undefined) {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid_cakto_offer_map')
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0),
    )
  } catch {
    throw new Error('invalid_cakto_offer_map')
  }
}

function getConfig(): CaktoGatewayConfig {
  const webhookSigningSecret = env('CAKTO_WEBHOOK_SIGNING_SECRET')
  if (!webhookSigningSecret) throw new Error('cakto_webhook_signing_secret_not_configured')
  return {
    apiBaseUrl: env('CAKTO_API_BASE_URL') ?? 'https://api.cakto.com.br/public_api',
    checkoutBaseUrl: env('CAKTO_CHECKOUT_BASE_URL') ?? 'https://pay.cakto.com.br',
    clientId: env('CAKTO_API_CLIENT_ID'),
    clientSecret: env('CAKTO_API_CLIENT_SECRET'),
    webhookSigningSecret,
    offersByPriceId: parseOfferMap(env('CAKTO_OFFER_BY_PRICE_ID')),
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function normalizeOrderStatus(status: string | undefined): CheckoutStatus {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'approved':
    case 'purchase_approved': return 'payment_confirmed'
    case 'refused':
    case 'failed':
    case 'purchase_refused': return 'payment_failed'
    case 'expired': return 'expired'
    case 'cancelled':
    case 'canceled': return 'cancelled'
    case 'processing': return 'payment_processing'
    case 'abandoned': return 'abandoned'
    case 'started': return 'started'
    default: return 'pending'
  }
}

function normalizeEventName(eventName: string): BillingEvent['type'] {
  switch (eventName) {
    case 'purchase_approved':
    case 'subscription_renewed':
    case 'subscription_renewal_approved': return 'PaymentConfirmed'
    case 'purchase_refused':
    case 'subscription_renewal_refused':
    case 'purchase_refunded':
    case 'chargeback': return 'PaymentFailed'
    case 'checkout_abandonment': return 'CheckoutExpired'
    case 'subscription_canceled': return 'SubscriptionCancelled'
    default: throw new Error('unsupported_cakto_event')
  }
}

async function getAccessToken(config: CaktoGatewayConfig) {
  if (accessToken && accessToken.expiresAt > Date.now() + 30_000) return accessToken.value
  if (!config.clientId || !config.clientSecret) throw new Error('cakto_api_credentials_not_configured')
  const response = await fetch(`${config.apiBaseUrl}/token/`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret }),
  })
  if (!response.ok) throw new Error('cakto_token_request_failed')
  const body = await response.json() as { access_token?: string; expires_in?: number }
  if (!body.access_token) throw new Error('cakto_token_response_invalid')
  accessToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 300) * 1000 }
  return accessToken.value
}

/**
 * The only Cakto-aware boundary. It maps a Rescript price to a preconfigured
 * Cakto offer; it never creates an organization, membership or subscription.
 */
export class CaktoBillingGatewayAdapter implements BillingGatewayAdapter {
  private readonly config = getConfig()

  async createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
    const offerId = this.config.offersByPriceId[request.priceId]
    if (!offerId) throw new Error('cakto_offer_not_configured_for_price')
    const checkoutUrl = new URL(`${this.config.checkoutBaseUrl.replace(/\/$/, '')}/${encodeURIComponent(offerId)}`)
    // Cakto returns this tracking key in webhook data. It is opaque to Cakto
    // and lets the adapter correlate the event without exposing domain joins.
    checkoutUrl.searchParams.set('sck', request.billingSessionPublicId)
    return {
      providerReference: `cakto:${request.billingSessionPublicId}`,
      checkoutUrl: checkoutUrl.toString(),
      expiresAt: null,
    }
  }

  async cancelCheckout(_providerReference: string): Promise<void> {
    throw new Error('cakto_checkout_cancellation_not_supported')
  }

  async getCheckoutStatus(providerReference: string): Promise<CheckoutStatus> {
    if (providerReference.startsWith('cakto:')) {
      throw new Error('cakto_order_reference_not_available')
    }
    const token = await getAccessToken(this.config)
    const response = await fetch(`${this.config.apiBaseUrl}/orders/${encodeURIComponent(providerReference)}/`, {
      headers: { authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('cakto_order_lookup_failed')
    return normalizeOrderStatus((await response.json() as CaktoOrder).status)
  }

  async validateWebhook(payload: string, signature: string | null) {
    if (!signature) return false
    const expected = createHmac('sha256', this.config.webhookSigningSecret).update(payload).digest('hex')
    return safeEqual(signature.replace(/^sha256=/i, ''), expected)
  }

  normalizeWebhook(payload: unknown): BillingEvent {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('invalid_cakto_webhook_payload')
    const event = payload as Record<string, unknown>
    const data = event.data as CaktoWebhookData | undefined
    const externalEventId = typeof event.id === 'string' ? event.id.trim() : typeof data?.id === 'string' ? data.id.trim() : ''
    const billingSessionPublicId = typeof data?.sck === 'string' ? data.sck.trim() : ''
    const eventName = typeof event.event === 'string' ? event.event : typeof event.type === 'string' ? event.type : ''
    if (!externalEventId || !billingSessionPublicId || !eventName) throw new Error('invalid_cakto_webhook_payload')
    return { externalEventId, billingSessionPublicId, type: normalizeEventName(eventName), payload: event }
  }
}

export function createCaktoBillingGatewayAdapter() {
  return new CaktoBillingGatewayAdapter()
}

export function hashCaktoWebhookPayload(rawBody: string) {
  return createHash('sha256').update(rawBody).digest('hex')
}
