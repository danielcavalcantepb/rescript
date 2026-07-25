import type { PermissionKey } from '@rescript/permissions'
import { PermissionError } from '#/modules/inventory/application/errors'
import type {
  InventoryRepository,
  ListMovementsQuery,
  ListMovementsResult,
} from '#/modules/inventory/domain/types'

type Can = (key: PermissionKey) => boolean

export async function listMovements(deps: {
  repository: InventoryRepository
  can: Can
  organizationId: string
  query: ListMovementsQuery
}): Promise<ListMovementsResult> {
  if (!deps.can('inventory.read')) {
    throw new PermissionError()
  }
  return deps.repository.listMovements(deps.organizationId, deps.query)
}
