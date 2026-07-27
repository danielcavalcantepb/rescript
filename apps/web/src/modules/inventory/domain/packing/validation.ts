export function validatePackingQuantity(value: string | number) {
  const text = String(value).trim()
  if (!/^[0-9]+(\.[0-9]{1,6})?$/.test(text)) {
    throw new Error('invalid_packing_quantity')
  }
  const quantity = Number(text)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('invalid_packing_quantity')
  }
  return text
}

export function assertPackingQuantityImmutable(
  original: string | number,
  next: string | number,
) {
  if (validatePackingQuantity(original) !== validatePackingQuantity(next)) {
    throw new Error('packing_quantity_is_immutable')
  }
}
