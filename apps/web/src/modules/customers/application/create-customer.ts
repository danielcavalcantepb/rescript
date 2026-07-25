import type { PermissionKey } from '@rescript/permissions'
import {
  noopCustomerAudit,
  type CustomerAuditPort,
} from '#/modules/customers/application/audit'
import {
  CustomerPermissionError,
  CustomerValidationError,
  mapRepositoryError,
} from '#/modules/customers/application/errors'
import type {
  CreateCustomerInput,
  Customer,
  CustomerRepository,
} from '#/modules/customers/domain/types'
import {
  hasFieldErrors,
  validateCreateCustomer,
} from '#/modules/customers/domain/validation'

type Can = (key: PermissionKey) => boolean

export async function createCustomer(deps: {
  repository: CustomerRepository
  can: Can
  organizationId: string
  userId: string
  input: CreateCustomerInput
  audit?: CustomerAuditPort
}): Promise<Customer> {
  if (!deps.can('customers.create') && !deps.can('customers.write')) {
    throw new CustomerPermissionError()
  }
  const errors = validateCreateCustomer(deps.input)
  if (hasFieldErrors(errors)) throw new CustomerValidationError(errors)

  try {
    const customer = await deps.repository.create(
      deps.organizationId,
      deps.userId,
      deps.input,
    )
    ;(deps.audit ?? noopCustomerAudit).record({
      action: 'customer.created',
      organizationId: deps.organizationId,
      customerId: customer.id,
      actorUserId: deps.userId,
    })
    return customer
  } catch (error) {
    mapRepositoryError(error)
  }
}
