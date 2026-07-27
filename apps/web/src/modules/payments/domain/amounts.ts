import type { PaymentAmounts } from '#/modules/payments/domain/types'

const SCALE = 10_000n

export function moneyUnits(value: string): bigint {
  if (!/^\d+(?:\.\d{1,4})?$/.test(value.trim())) throw new Error('invalid_money')
  const [whole, fraction = ''] = value.trim().split('.')
  return BigInt(whole!) * SCALE + BigInt(fraction.padEnd(4, '0'))
}

export function formatMoneyUnits(value: bigint): string {
  const whole = value / SCALE
  const fraction = (value % SCALE).toString().padStart(4, '0')
  return `${whole}.${fraction}`
}

export function calculateNetAmount(
  input: Omit<PaymentAmounts, 'netAmount'>,
): string {
  const values = Object.values(input).map(moneyUnits)
  const net = values[0]! - values[1]! + values[2]! + values[3]! + values[4]!
  if (net <= 0n) throw new Error('invalid_net_amount')
  return formatMoneyUnits(net)
}

export function assertAllocationTotal(
  allocations: Array<{ amount: string }>,
  netAmount: string,
) {
  if (allocations.length === 0) throw new Error('allocations_required')
  const total = allocations.reduce((sum, item) => sum + moneyUnits(item.amount), 0n)
  if (allocations.some((item) => moneyUnits(item.amount) <= 0n)) {
    throw new Error('invalid_allocation')
  }
  if (total !== moneyUnits(netAmount)) throw new Error('allocation_total_mismatch')
}
