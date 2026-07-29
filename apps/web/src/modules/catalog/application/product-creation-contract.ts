/**
 * Pure application-contract helpers for the transactional product creator.
 * Persistence is performed only by create_product_with_initial_setup().
 */
export type InitialVariantSetup = {
  identityKey: string
  sku: string
  salePrice: string
  /** Dynamic attribute assignments. Catalog owns their persistence. */
  attributes?: Array<{
    attributeDefinitionId: string
    optionId: string
  }>
  isDefault?: boolean
  tracksInventory?: boolean
  initialQuantity?: string
  unitCost?: string | null
  allowZeroCost?: boolean
  branchId?: string | null
  locationId?: string | null
  ean?: { type: string; value: string } | null
}

export type ProductCreationCommand = {
  name: string
  description?: string | null
  unitOfMeasureId: string
  branchId?: string | null
  priceListId?: string | null
  brandId?: string | null
  categoryId?: string | null
  topology?: 'simple' | 'variable'
  variants: InitialVariantSetup[]
}

export type ProductCreationIdempotencyKeys = {
  product: string
  variant: string
  price: string
  inventory: string
  valuation: string
}

export function deriveProductCreationKeys(input: {
  globalKey: string
  variantIdentity: string
  branchId: string
  locationId: string
}): ProductCreationIdempotencyKeys {
  const key = input.globalKey.trim()
  const identity = input.variantIdentity.trim()
  const scope = `${identity}:${input.branchId}:${input.locationId}`
  return {
    product: `product:${key}`,
    variant: `variant:${key}:${identity}`,
    price: `price:${key}:${identity}`,
    inventory: `inventory:${key}:${scope}`,
    valuation: `valuation:${key}:${scope}`,
  }
}

/** Returns null when a margin is not meaningful, never a persisted value. */
export function calculateDerivedMargin(
  salePrice: number | null | undefined,
  unitCost: number | null | undefined,
): number | null {
  if (salePrice == null || unitCost == null || salePrice <= 0) return null
  return Number((((salePrice - unitCost) / salePrice) * 100).toFixed(2))
}

export function validateInitialValuation(input: {
  quantity: number
  unitCost: number | null | undefined
  allowZeroCost?: boolean
}) {
  if (input.quantity <= 0) return 'initial_quantity_invalid'
  if (input.unitCost == null) return null
  if (input.unitCost < 0) return 'initial_unit_cost_invalid'
  if (input.unitCost === 0 && !input.allowZeroCost) {
    return 'initial_unit_cost_invalid'
  }
  return null
}
