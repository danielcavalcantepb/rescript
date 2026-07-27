import type { CheckoutStatus, ProvisioningStatus } from './types'

const checkoutTransitions: Record<CheckoutStatus, readonly CheckoutStatus[]> = {
  CREATED: ['STARTED', 'CANCELLED', 'EXPIRED'],
  STARTED: ['COMPLETED', 'CANCELLED', 'EXPIRED', 'FAILED'],
  COMPLETED: [],
  EXPIRED: [],
  CANCELLED: [],
  FAILED: [],
}

const provisioningTransitions: Record<
  ProvisioningStatus,
  readonly ProvisioningStatus[]
> = {
  PENDING: ['RUNNING', 'FAILED'],
  RUNNING: ['SUCCESS', 'FAILED', 'ROLLBACK'],
  SUCCESS: [],
  FAILED: ['ROLLBACK', 'RUNNING'],
  ROLLBACK: [],
}

export function canTransitionCheckout(
  from: CheckoutStatus,
  to: CheckoutStatus,
) {
  return checkoutTransitions[from].includes(to)
}

export function canTransitionProvisioning(
  from: ProvisioningStatus,
  to: ProvisioningStatus,
) {
  return provisioningTransitions[from].includes(to)
}

export function assertCheckoutTransition(
  from: CheckoutStatus,
  to: CheckoutStatus,
) {
  if (!canTransitionCheckout(from, to)) throw new Error('invalid_checkout_transition')
}

export function assertProvisioningTransition(
  from: ProvisioningStatus,
  to: ProvisioningStatus,
) {
  if (!canTransitionProvisioning(from, to)) {
    throw new Error('invalid_provisioning_transition')
  }
}
