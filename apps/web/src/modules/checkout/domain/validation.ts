import {
  BILLING_CYCLES,
  PLAN_CODES,
  type BillingCycle,
  type CheckoutDetailsInput,
  type PlanCode,
} from './types'

export function isPlanCode(value: string): value is PlanCode {
  return (PLAN_CODES as readonly string[]).includes(value)
}

export function isBillingCycle(value: string): value is BillingCycle {
  return (BILLING_CYCLES as readonly string[]).includes(value)
}

export function normalizePlan(value: unknown): PlanCode {
  const plan = typeof value === 'string' ? value.toLowerCase() : 'starter'
  return isPlanCode(plan) ? plan : 'starter'
}

export function normalizeBillingCycle(value: unknown): BillingCycle {
  const cycle = typeof value === 'string' ? value.toLowerCase() : 'monthly'
  return isBillingCycle(cycle) ? cycle : 'monthly'
}

export function validateCheckoutDetails(input: CheckoutDetailsInput) {
  if (!input.publicToken) throw new Error('checkout_token_required')
  if (!isPlanCode(input.selectedPlan)) throw new Error('invalid_plan')
  if (!isBillingCycle(input.billingCycle)) throw new Error('invalid_billing_cycle')
  if (input.organizationName.trim().length < 2) {
    throw new Error('invalid_organization_name')
  }
  if (input.ownerName.trim().length < 2) {
    throw new Error('invalid_owner_name')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.ownerEmail.trim())) {
    throw new Error('invalid_owner_email')
  }
  if (input.ownerPassword.length < 8) {
    throw new Error('weak_password')
  }
  if (!input.termsAccepted) throw new Error('terms_not_accepted')
  if (input.currency !== 'BRL') throw new Error('invalid_currency')
  if (!['BR', 'BRL'].includes(input.country) && input.country.trim().length < 2) {
    throw new Error('invalid_country')
  }
}
