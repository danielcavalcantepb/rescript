import { createServerFn } from '@tanstack/react-start'
import { createServerSupabaseClient } from '#/lib/supabase/server.server'

export type OnboardingResume = {
  publicId: string
  email: string
  fullName: string
  phone: string
  state: string
  step: 'conta' | 'perfil' | 'empresa' | 'plano' | 'pagamento'
  profile: BusinessProfile | null
}

export type BusinessProfile = {
  segment: string
  segmentOther?: string
  revenueRange: string
  currentSystemStatus: string
  currentSystemName?: string
  migrationInterest?: boolean
  needs: string[]
  needsOther?: string
}

export type BusinessIdentity = {
  personType: 'individual' | 'company'
  legalName: string
  tradeName?: string
  taxId: string
  stateRegistration?: string
  phone: string
  email: string
  zipCode: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  mainBranchName: string
}

export type BillingCycle = 'monthly' | 'yearly'
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type SubscriptionPrice = {
  id: string
  billingCycle: BillingCycle
  currency: string
  amount: number
}

export type SubscriptionPlan = {
  id: string
  code: string
  name: string
  label: string
  trialDays: number
  trialMode: 'none' | 'optional' | 'required'
  prices: SubscriptionPrice[]
  features: Record<string, JsonValue>
}

export type CalculatedPricing = {
  planId: string
  priceId: string
  billingCycle: BillingCycle
  currency: string
  subtotal: number
  discount: number
  total: number
  trialDays: number
  trialMode: 'none' | 'optional' | 'required'
  coupon: { valid: boolean; reason?: string; discount: number }
  features: Record<string, JsonValue>
}

export type SubscriptionIntentResult = {
  publicId: string
  status: string
  subtotal: number
  discount: number
  total: number
  currency: string
  trialDays: number
}

export type BillingSessionResult = {
  publicId: string
  status: string
  checkoutUrl: string | null
  expiresAt: string | null
}

type CaktoCheckoutContext = {
  billingSessionPublicId: string
  subscriptionIntentPublicId: string
  priceId: string
  amount: number
  currency: string
}

type RpcClient = { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }
const rpc = () => createServerSupabaseClient() as unknown as RpcClient

async function run<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc().rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const startAcquisition = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string; fullName: string; phone: string; idempotencyKey: string; utm: Record<string, string | undefined> }) => data)
  .handler(({ data }) => run<{ publicId: string; state: string; step: string }>('cap_start', { p_email: data.email, p_name: data.fullName, p_phone: data.phone, p_idempotency_key: data.idempotencyKey, p_utm: data.utm }))

export const linkPendingAccount = createServerFn({ method: 'POST' })
  .inputValidator((data: { publicId: string; userId: string; userAgent?: string }) => data)
  .handler(({ data }) => run<{ publicId: string; state: string; step: string }>('cap_link_account', { p_public_id: data.publicId, p_user_id: data.userId, p_terms_version: '2026-07', p_privacy_version: '2026-07', p_user_agent: data.userAgent ?? null }))

export const saveBusinessProfile = createServerFn({ method: 'POST' })
  .inputValidator((data: { publicId: string; profile: BusinessProfile; idempotencyKey: string }) => data)
  .handler(({ data }) => run<{ publicId: string; state: string; step: string }>('cap_save_business_profile', { p_public_id: data.publicId, p_profile: data.profile, p_idempotency_key: data.idempotencyKey }))

export const saveBusinessIdentity = createServerFn({ method: 'POST' })
  .inputValidator((data: { publicId: string; identity: BusinessIdentity; idempotencyKey: string }) => data)
  .handler(({ data }) => run<{ publicId: string; state: string; step: string }>('cap_save_business_identity', {
    p_public_id: data.publicId,
    p_identity: data.identity,
    p_idempotency_key: data.idempotencyKey,
  }))

export const resumeAcquisition = createServerFn({ method: 'POST' })
  .inputValidator((data: { publicId: string }) => data)
  .handler(({ data }) => run<OnboardingResume>('cap_resume', { p_public_id: data.publicId }))

/** Read-only commercial catalog. Monetary amounts are resolved only by PostgreSQL. */
export const getSubscriptionPlans = createServerFn({ method: 'GET' })
  .handler(() => run<SubscriptionPlan[]>('cap_get_plans', { p_currency: 'BRL' }))

/** Prices are read from the commercial catalog; the client never supplies an amount. */
export const getSubscriptionPrices = createServerFn({ method: 'POST' })
  .inputValidator((data: { planId: string }) => data)
  .handler(({ data }) => run<SubscriptionPrice[]>('cap_get_prices', { p_plan_id: data.planId, p_currency: 'BRL' }))

export const calculateSubscriptionPricing = createServerFn({ method: 'POST' })
  .inputValidator((data: { planId: string; billingCycle: BillingCycle; couponCode?: string }) => data)
  .handler(({ data }) => run<CalculatedPricing>('cap_calculate_pricing', {
    p_plan_id: data.planId,
    p_billing_cycle: data.billingCycle,
    p_coupon_code: data.couponCode ?? null,
    p_currency: 'BRL',
  }))

export const createSubscriptionIntent = createServerFn({ method: 'POST' })
  .inputValidator((data: { onboardingPublicId: string; planId: string; billingCycle: BillingCycle; idempotencyKey: string; couponCode?: string }) => data)
  .handler(({ data }) => run<SubscriptionIntentResult>('cap_create_subscription_intent', {
    p_onboarding_public_id: data.onboardingPublicId,
    p_plan_id: data.planId,
    p_billing_cycle: data.billingCycle,
    p_idempotency_key: data.idempotencyKey,
    p_coupon_code: data.couponCode ?? null,
    p_currency: 'BRL',
  }))

export const createBillingSession = createServerFn({ method: 'POST' })
  .inputValidator((data: { intentPublicId: string; idempotencyKey: string }) => data)
  .handler(({ data }) => run<BillingSessionResult>('cap_create_cakto_billing_session', {
    p_intent_public_id: data.intentPublicId,
    p_idempotency_key: data.idempotencyKey,
  }))

/** Starts checkout through the provider-neutral BillingSession boundary. */
/** Starts checkout through the configured BillingGatewayAdapter. */
export const beginCheckout = createServerFn({ method: 'POST' })
  .inputValidator((data: { intentPublicId: string; idempotencyKey: string }) => data)
  .handler(async ({ data }) => {
    const session = await createBillingSession({ data })
    const context = await run<CaktoCheckoutContext>('cap_get_billing_checkout_context', {
      p_billing_session_public_id: session.publicId,
    })
    const { createCaktoBillingGatewayAdapter } = await import('../infrastructure/cakto-billing-gateway-adapter')
    const checkout = await createCaktoBillingGatewayAdapter().createCheckout({
      billingSessionPublicId: context.billingSessionPublicId,
      subscriptionIntentPublicId: context.subscriptionIntentPublicId,
      priceId: context.priceId,
      amount: context.amount,
      currency: context.currency,
    })
    return run<BillingSessionResult>('cap_bind_cakto_checkout', {
      p_billing_session_public_id: context.billingSessionPublicId,
      p_gateway_reference: checkout.providerReference,
      p_checkout_url: checkout.checkoutUrl,
      p_expires_at: checkout.expiresAt,
    })
  })
