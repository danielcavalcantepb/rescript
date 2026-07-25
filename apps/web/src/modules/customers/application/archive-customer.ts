import type { PermissionKey } from '@rescript/permissions'
import {
  noopCustomerAudit,
  type CustomerAuditPort,
} from '#/modules/customers/application/audit'
import {
  CustomerNotFoundError,
  CustomerPermissionError,
  mapRepositoryError,
} from '#/modules/customers/application/errors'
import type { Customer, CustomerRepository } from '#/modules/customers/domain/types'

type Can = (key: PermissionKey) => boolean

export async function archiveCustomer(deps: {
  repository: CustomerRepository
  can: Can
  organizationId: string
  userId: string
  customerId: string
  audit?: CustomerAuditPort
}): Promise<Customer> {
  if (!deps.can('customers.edit') && !deps.can('customers.write')) {
    throw new CustomerPermissionError()
  }

  const existing = await deps.repository.getById(
    deps.organizationId,
    deps.customerId,
  )
  if (!existing) throw new CustomerNotFoundError()

  try {
    const customer = await deps.repository.archive(
      deps.organizationId,
      deps.userId,
      deps.customerId,
    )
    ;(deps.audit ?? noopCustomerAudit).record({
      action: 'customer.archived',
      organizationId: deps.organizationId,
      customerId: customer.id,
      actorUserId: deps.userId,
    })
    return customer
  } catch (error) {
    mapRepositoryError(error)
  }
}
