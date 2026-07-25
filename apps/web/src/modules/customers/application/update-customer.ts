import type { PermissionKey } from '@rescript/permissions'
import {
  noopCustomerAudit,
  type CustomerAuditPort,
} from '#/modules/customers/application/audit'
import {
  CustomerArchivedError,
  CustomerNotFoundError,
  CustomerPermissionError,
  CustomerValidationError,
  mapRepositoryError,
} from '#/modules/customers/application/errors'
import type {
  Customer,
  CustomerRepository,
  UpdateCustomerInput,
} from '#/modules/customers/domain/types'
import {
  hasFieldErrors,
  validateUpdateCustomer,
} from '#/modules/customers/domain/validation'

type Can = (key: PermissionKey) => boolean

export async function updateCustomer(deps: {
  repository: CustomerRepository
  can: Can
  organizationId: string
  userId: string
  customerId: string
  input: UpdateCustomerInput
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
  if (existing.status === 'inactive') throw new CustomerArchivedError()

  const errors = validateUpdateCustomer(deps.input, {
    personType: existing.personType,
  })
  if (hasFieldErrors(errors)) throw new CustomerValidationError(errors)

  try {
    const customer = await deps.repository.update(
      deps.organizationId,
      deps.userId,
      deps.customerId,
      deps.input,
    )
    ;(deps.audit ?? noopCustomerAudit).record({
      action: 'customer.updated',
      organizationId: deps.organizationId,
      customerId: customer.id,
      actorUserId: deps.userId,
    })
    return customer
  } catch (error) {
    mapRepositoryError(error)
  }
}
