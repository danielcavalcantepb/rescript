import { describe, expect, it } from 'vitest'
import {
  assertCheckoutTransition,
  assertProvisioningTransition,
  canTransitionCheckout,
} from './lifecycle'
import { validateCheckoutDetails } from './validation'

const valid = {
  publicToken: crypto.randomUUID(),
  selectedPlan: 'rescript',
  billingCycle: 'monthly',
  organizationName: 'Rescript Store',
  ownerName: 'Ana Clara',
  ownerEmail: 'ana@example.com',
  phone: '+55 11 99999-9999',
  country: 'BR',
  language: 'pt-BR',
  currency: 'BRL',
  ownerPassword: 'senha-forte-123',
  termsAccepted: true,
} as const

describe('checkout foundation domain', () => {
  it('validates checkout owner and company data', () => {
    expect(() => validateCheckoutDetails(valid)).not.toThrow()
  })

  it('rejects invalid owner email, weak password and missing terms', () => {
    expect(() =>
      validateCheckoutDetails({ ...valid, ownerEmail: 'invalid' }),
    ).toThrow('invalid_owner_email')
    expect(() =>
      validateCheckoutDetails({ ...valid, ownerPassword: '123' }),
    ).toThrow('weak_password')
    expect(() =>
      validateCheckoutDetails({ ...valid, termsAccepted: false }),
    ).toThrow('terms_not_accepted')
  })

  it('accepts only documented checkout transitions', () => {
    expect(canTransitionCheckout('CREATED', 'STARTED')).toBe(true)
    expect(() => assertCheckoutTransition('COMPLETED', 'STARTED')).toThrow(
      'invalid_checkout_transition',
    )
  })

  it('accepts only documented provisioning transitions', () => {
    expect(() => assertProvisioningTransition('PENDING', 'RUNNING')).not.toThrow()
    expect(() => assertProvisioningTransition('SUCCESS', 'FAILED')).toThrow(
      'invalid_provisioning_transition',
    )
  })
})
