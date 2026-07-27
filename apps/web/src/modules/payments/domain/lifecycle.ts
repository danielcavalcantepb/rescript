import type { PaymentStatus } from '#/modules/payments/domain/types'

const transitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  draft: ['confirmed', 'archived'],
  confirmed: ['reversed'],
  reversed: ['archived'],
  archived: [],
}

export function assertPaymentTransition(from: PaymentStatus, to: PaymentStatus) {
  if (!transitions[from].includes(to)) throw new Error('invalid_payment_transition')
}

export function isPaymentEditable(status: PaymentStatus) {
  return status === 'draft'
}
