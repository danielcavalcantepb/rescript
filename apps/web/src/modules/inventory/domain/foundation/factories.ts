import type {
  InventoryItem,
  OrganizationId,
  StockLocation,
  VariantId,
} from '#/modules/inventory/domain/foundation/types'

export function createStockLocation(input: {
  id: string
  organizationId: OrganizationId
  code: string
  name: string
  description?: string | null
  isDefault?: boolean
  priority?: number
}): StockLocation {
  return {
    id: input.id,
    organizationId: input.organizationId,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    isDefault: input.isDefault ?? false,
    priority: input.priority ?? (input.isDefault ? 100 : 0),
    status: 'active',
  }
}

export function createDefaultStockLocation(input: {
  id: string
  organizationId: OrganizationId
}): StockLocation {
  return createStockLocation({
    id: input.id,
    organizationId: input.organizationId,
    code: 'MAIN',
    name: 'Principal',
    description: 'Local padrão da organização',
    isDefault: true,
    priority: 100,
  })
}

export function createInventoryItem(input: {
  id: string
  organizationId: OrganizationId
  locationId: string
  variantId: VariantId
  quantityOnHand?: number
}): InventoryItem {
  const quantityOnHand = input.quantityOnHand ?? 0
  if (!Number.isFinite(quantityOnHand) || quantityOnHand < 0) {
    throw new Error('invalid_quantity')
  }
  return {
    id: input.id,
    organizationId: input.organizationId,
    locationId: input.locationId,
    variantId: input.variantId,
    quantityOnHand,
    quantityReserved: 0,
    status: 'active',
  }
}
