export function validateReservationQuantity(value: string | number) {
  const text = String(value).trim()
  if (!/^[0-9]+(\.[0-9]{1,6})?$/.test(text)) {
    throw new Error('invalid_reservation_quantity')
  }
  const quantity = Number(text)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('invalid_reservation_quantity')
  }
  return text
}

export function validateReservationReleaseItems(
  items: Array<{ itemId: string; quantity: string }> | null | undefined,
) {
  if (!items) return
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('invalid_release_items')
  }
  const seen = new Set<string>()
  for (const item of items) {
    if (!item.itemId || seen.has(item.itemId)) {
      throw new Error('invalid_release_items')
    }
    seen.add(item.itemId)
    validateReservationQuantity(item.quantity)
  }
}
