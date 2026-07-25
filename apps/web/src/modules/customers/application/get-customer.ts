import type { PermissionKey } from '@rescript/permissions'
import {
  CustomerNotFoundError,
  CustomerPermissionError,
} from '#/modules/customers/application/errors'
import type { Customer, CustomerRepository } from '#/modules/customers/domain/types'

type Can = (key: PermissionKey) => boolean

export async function getCustomer(deps: {
  repository: CustomerRepository
  can: Can
  organizationId: string
  customerId: string
}): Promise<Customer> {
  if (!deps.can('customers.read')) {
    throw new CustomerPermissionError()
  }
  const customer = await deps.repository.getById(
    deps.organizationId,
    deps.customerId,
  )
  if (!customer) throw new CustomerNotFoundError()
  return customer
}
