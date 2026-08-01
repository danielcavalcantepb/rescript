export const CHECKOUT_STATUSES = [
  'CREATED',
  'STARTED',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
  'FAILED',
] as const

export type CheckoutStatus = (typeof CHECKOUT_STATUSES)[number]

export const PROVISIONING_STATUSES = [
  'PENDING',
  'RUNNING',
  'SUCCESS',
  'FAILED',
  'ROLLBACK',
] as const

export type ProvisioningStatus = (typeof PROVISIONING_STATUSES)[number]

export const PLAN_CODES = ['rescript'] as const

export type PlanCode = (typeof PLAN_CODES)[number]

export const BILLING_CYCLES = ['monthly', 'yearly'] as const

export type BillingCycle = (typeof BILLING_CYCLES)[number]

export type CheckoutSession = {
  id: string
  publicToken: string
  status: CheckoutStatus
  selectedPlan: PlanCode
  billingCycle: BillingCycle
  organizationName: string | null
  ownerName: string | null
  ownerEmail: string | null
  phone: string | null
  country: string
  language: string
  currency: string
  createdAt: string
  expiresAt: string
}

export type CheckoutDetailsInput = {
  publicToken: string
  selectedPlan: PlanCode
  billingCycle: BillingCycle
  organizationName: string
  ownerName: string
  ownerEmail: string
  phone: string
  country: string
  language: string
  currency: string
  ownerPassword: string
  termsAccepted: boolean
}

export type ProvisioningResult = {
  checkoutId: string
  tenantId: string
  organizationId: string
  ownerId: string
  subscriptionId: string
  status: 'SUCCESS'
}

export type CheckoutHistoryEvent =
  | 'CheckoutCreated'
  | 'CheckoutStarted'
  | 'CheckoutCompleted'
  | 'CheckoutExpired'
  | 'CheckoutCancelled'
  | 'CheckoutFailed'

export type ProvisioningHistoryEvent =
  | 'ProvisioningStarted'
  | 'TenantCreated'
  | 'OrganizationCreated'
  | 'OwnerCreated'
  | 'SubscriptionCreated'
  | 'InitialWorkspaceCreated'
  | 'ProvisioningCompleted'
  | 'ProvisioningFailed'
  | 'ProvisioningRollback'
