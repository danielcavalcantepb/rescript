import type { PermissionKey } from '@rescript/permissions'
import { CustomerPermissionError } from '#/modules/customers/application/errors'
import type {
  CustomerRepository,
  ListCustomersQuery,
  ListCustomersResult,
} from '#/modules/customers/domain/types'

type Can = (key: PermissionKey) => boolean

export async function listCustomers(deps: {
  repository: CustomerRepository
  can: Can
  organizationId: string
  query: ListCustomersQuery
}): Promise<ListCustomersResult> {
  if (!deps.can('customers.read')) {
    throw new CustomerPermissionError()
  }
  return deps.repository.list(deps.organizationId, deps.query)
}

/** Alias — search is list with `q` (advanced search later). */
export const searchCustomers = listCustomers
