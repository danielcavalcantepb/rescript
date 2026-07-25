import type { PermissionKey } from '@rescript/permissions'
import { PermissionError } from '#/modules/inventory/application/errors'
import type {
  InventoryRepository,
  ListStockQuery,
  ListStockResult,
} from '#/modules/inventory/domain/types'

type Can = (key: PermissionKey) => boolean

export async function listStock(deps: {
  repository: InventoryRepository
  can: Can
  organizationId: string
  query: ListStockQuery
}): Promise<ListStockResult> {
  if (!deps.can('inventory.read')) {
    throw new PermissionError()
  }
  return deps.repository.listStock(deps.organizationId, deps.query)
}
