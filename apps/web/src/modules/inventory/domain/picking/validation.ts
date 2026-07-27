export function validatePickingQuantity(value: string | number) {
  const text = String(value).trim()
  if (!/^[0-9]+(\.[0-9]{1,6})?$/.test(text)) {
    throw new Error('invalid_picking_quantity')
  }
  const quantity = Number(text)
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error('invalid_picking_quantity')
  }
  return text
}

export function validatePickedWithinReserved(
  quantityPicked: string | number,
  quantityReserved: string | number,
) {
  const picked = Number(validatePickingQuantity(quantityPicked))
  const reserved = Number(validatePickingQuantity(quantityReserved))
  if (reserved <= 0 || picked > reserved) {
    throw new Error('picked_quantity_exceeds_reserved')
  }
}

export function validatePickingItemUpdates(
  items: Array<{ itemId: string; quantity: string }> | null | undefined,
) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('invalid_picking_items')
  }
  const seen = new Set<string>()
  for (const item of items) {
    if (!item.itemId || seen.has(item.itemId)) {
      throw new Error('invalid_picking_items')
    }
    seen.add(item.itemId)
    validatePickingQuantity(item.quantity)
  }
}
