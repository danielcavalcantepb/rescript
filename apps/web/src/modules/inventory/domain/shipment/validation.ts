export function validateShipmentQuantity(value: string | number) {
  const text = String(value).trim()
  if (!/^[0-9]+(\.[0-9]{1,6})?$/.test(text)) {
    throw new Error('invalid_shipment_quantity')
  }
  const quantity = Number(text)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('invalid_shipment_quantity')
  }
  return text
}

export function assertShipmentQuantityBounds(
  packed: string | number,
  shipped: string | number,
) {
  const packedQuantity = Number(validateShipmentQuantity(packed))
  const shippedQuantity = Number(validateShipmentQuantity(shipped))
  if (shippedQuantity > packedQuantity) {
    throw new Error('shipped_quantity_exceeds_packed')
  }
}

export function validateFreightAmount(value: string | number | null | undefined) {
  if (value == null || String(value).trim() === '') return null
  const text = String(value).trim()
  if (!/^[0-9]+(\.[0-9]{1,4})?$/.test(text)) {
    throw new Error('invalid_freight_amount')
  }
  return text
}
