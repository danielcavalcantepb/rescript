/**
 * Boundary for the future payment provider. CAP creates a BillingSession first;
 * no provider is allowed to provision a tenant or activate a subscription.
 */
export type CheckoutRequest = {
  billingSessionPublicId: string
  subscriptionIntentPublicId: string
  priceId: string
  amount: number
  currency: string
}

export type CheckoutResult = {
  providerReference: string
  checkoutUrl: string | null
  expiresAt: string | null
}

export type CheckoutStatus = 'pending' | 'started' | 'abandoned' | 'expired' | 'payment_processing' | 'payment_confirmed' | 'payment_failed' | 'cancelled'

/** Provider-neutral facts emitted after a gateway has verified a webhook. */
export type BillingEvent = {
  externalEventId: string
  type: 'PaymentConfirmed' | 'PaymentFailed' | 'CheckoutExpired' | 'SubscriptionCancelled'
  billingSessionPublicId: string
  payload: Record<string, unknown>
}

export interface BillingGatewayAdapter {
  createCheckout(request: CheckoutRequest): Promise<CheckoutResult>
  cancelCheckout(providerReference: string): Promise<void>
  getCheckoutStatus(providerReference: string): Promise<CheckoutStatus>
  validateWebhook(payload: string, signature: string | null): Promise<boolean>
}
