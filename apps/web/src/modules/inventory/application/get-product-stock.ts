import type { PermissionKey } from '@rescript/permissions'
import {
  NotFoundError,
  PermissionError,
} from '#/modules/inventory/application/errors'
import type {
  InventoryRepository,
  ProductStock,
} from '#/modules/inventory/domain/types'

type Can = (key: PermissionKey) => boolean

export async function getProductStock(deps: {
  repository: InventoryRepository
  can: Can
  organizationId: string
  productId: string
}): Promise<ProductStock> {
  if (!deps.can('inventory.read')) {
    throw new PermissionError()
  }
  const stock = await deps.repository.getProductStock(
    deps.organizationId,
    deps.productId,
  )
  if (!stock) throw new NotFoundError('product_not_found')
  return stock
}
