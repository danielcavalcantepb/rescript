import type { PurchaseItem, PurchaseTotals } from '#/modules/purchase/domain/types'

function round4(n: number): string {
  return (Math.round(n * 10000) / 10000).toFixed(4)
}

export function calculateLineTotals(input: {
  quantity: string
  unitPrice: string
  discount?: string
}): { subtotal: string; total: string } {
  const qty = Number(input.quantity)
  const price = Number(input.unitPrice)
  const discount = Number(input.discount ?? '0')
  if (!Number.isFinite(qty) || qty <= 0) throw new Error('invalid_quantity')
  if (!Number.isFinite(price) || price < 0) throw new Error('invalid_unit_price')
  if (!Number.isFinite(discount) || discount < 0) throw new Error('invalid_discount')
  const subtotal = qty * price
  const total = Math.max(0, subtotal - discount)
  return { subtotal: round4(subtotal), total: round4(total) }
}

/** Domain service — never calculate totals in the UI. */
export function calculatePurchaseTotals(
  items: readonly PurchaseItem[],
  currency: string,
): PurchaseTotals {
  const active = items.filter((i) => i.status === 'active')
  let subtotal = 0
  let discountTotal = 0
  let grandTotal = 0
  for (const item of active) {
    subtotal += Number(item.subtotal)
    discountTotal += Number(item.discount)
    grandTotal += Number(item.total)
  }
  return {
    currency,
    subtotal: round4(subtotal),
    discountTotal: round4(discountTotal),
    grandTotal: round4(grandTotal),
  }
}
