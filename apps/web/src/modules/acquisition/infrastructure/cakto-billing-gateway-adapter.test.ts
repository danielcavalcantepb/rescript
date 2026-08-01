import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import { CaktoBillingGatewayAdapter } from './cakto-billing-gateway-adapter'

const originalEnvironment = { ...process.env }

function configureGateway() {
  process.env.CAKTO_WEBHOOK_SIGNING_SECRET = 'cakto-test-secret'
  process.env.CAKTO_OFFER_BY_PRICE_ID = JSON.stringify({ 'price-1': 'offer-123' })
  process.env.CAKTO_CHECKOUT_BASE_URL = 'https://pay.cakto.test'
}

afterEach(() => {
  process.env = { ...originalEnvironment }
})

describe('CaktoBillingGatewayAdapter', () => {
  it('builds a checkout URL from a configured offer without leaking provider data into the domain', async () => {
    configureGateway()
    const checkout = await new CaktoBillingGatewayAdapter().createCheckout({
      billingSessionPublicId: '5db2bfa3-7b65-44ca-ae48-2107995e3733',
      subscriptionIntentPublicId: 'f1b98d07-297b-4a9a-90fc-51062d3234e3',
      priceId: 'price-1', amount: 99.9, currency: 'BRL',
    })
    expect(checkout.checkoutUrl).toBe('https://pay.cakto.test/offer-123?sck=5db2bfa3-7b65-44ca-ae48-2107995e3733')
    expect(checkout.providerReference).toBe('cakto:5db2bfa3-7b65-44ca-ae48-2107995e3733')
  })

  it('validates the raw payload and normalizes Cakto events into Rescript facts', async () => {
    configureGateway()
    const adapter = new CaktoBillingGatewayAdapter()
    const raw = JSON.stringify({ id: 'evt_1', event: 'purchase_approved', data: { id: 'order_1', sck: '5db2bfa3-7b65-44ca-ae48-2107995e3733' } })
    const signature = createHmac('sha256', 'cakto-test-secret').update(raw).digest('hex')
    expect(await adapter.validateWebhook(raw, signature)).toBe(true)
    expect(adapter.normalizeWebhook(JSON.parse(raw))).toMatchObject({
      externalEventId: 'evt_1', billingSessionPublicId: '5db2bfa3-7b65-44ca-ae48-2107995e3733', type: 'PaymentConfirmed',
    })
  })

  it('normalizes the documented subscription renewal event as a confirmed payment', () => {
    configureGateway()
    const adapter = new CaktoBillingGatewayAdapter()
    expect(adapter.normalizeWebhook({
      id: 'evt_renewal',
      event: 'subscription_renewed',
      data: { sck: '5db2bfa3-7b65-44ca-ae48-2107995e3733' },
    })).toMatchObject({ type: 'PaymentConfirmed' })
  })

  it('rejects unrecognized Cakto event names and incorrect signatures', async () => {
    configureGateway()
    const adapter = new CaktoBillingGatewayAdapter()
    expect(await adapter.validateWebhook('{}', 'bad')).toBe(false)
    expect(() => adapter.normalizeWebhook({ id: 'evt', event: 'other', data: { sck: 'session' } })).toThrow('unsupported_cakto_event')
  })
})
