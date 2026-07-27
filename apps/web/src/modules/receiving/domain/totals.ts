import type { GoodsReceiptItem, ReceiptTotals } from '#/modules/receiving/domain/types'

function round4(n: number): string {
  return (Math.round(n * 10000) / 10000).toFixed(4)
}

export function pendingQuantity(ordered: string, received: string): string {
  return round4(Math.max(0, Number(ordered) - Number(received)))
}

export function calculateReceiptTotals(
  items: readonly GoodsReceiptItem[],
): ReceiptTotals {
  let ordered = 0
  let received = 0
  for (const item of items) {
    ordered += Number(item.orderedQuantity)
    received += Number(item.receivedQuantity)
  }
  return {
    lines: items.length,
    orderedQuantity: round4(ordered),
    receivedQuantity: round4(received),
    pendingQuantity: round4(Math.max(0, ordered - received)),
  }
}
