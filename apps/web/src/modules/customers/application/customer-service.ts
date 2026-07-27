import {
  canArchiveCustomers,
  canCreateCustomers,
  canEditCustomers,
  canManageAddresses,
  canManageContacts,
  canReadCustomers,
  canRestoreCustomers,
  type CustomerAppDeps,
} from '#/modules/customers/application/deps'
import {
  CustomerArchivedError,
  CustomerConflictError,
  CustomerNotFoundError,
  CustomerPermissionError,
  CustomerValidationError,
  mapRepositoryError,
} from '#/modules/customers/application/errors'
import { normalizeDocumentDigits } from '#/modules/customers/domain/document'
import { assertCustomerTransition } from '#/modules/customers/domain/lifecycle'
import type {
  CreateAddressInput,
  CreateContactInput,
  CreateCustomerInput,
  Customer,
  CustomerAddress,
  CustomerContact,
  CustomerHistoryEntry,
  CustomerSnapshot,
  ListCustomersQuery,
  ListCustomersResult,
  SearchCustomersQuery,
  UpdateAddressInput,
  UpdateContactInput,
  UpdateCustomerInput,
} from '#/modules/customers/domain/types'
import {
  hasFieldErrors,
  validateCreateAddress,
  validateCreateContact,
  validateCreateCustomer,
  validateUpdateAddress,
  validateUpdateContact,
  validateUpdateCustomer,
} from '#/modules/customers/domain/validation'

async function requireCustomer(
  deps: CustomerAppDeps,
  customerId: string,
): Promise<Customer> {
  const customer = await deps.customers.getById(deps.organizationId, customerId)
  if (!customer) throw new CustomerNotFoundError()
  return customer
}

async function audit(
  deps: CustomerAppDeps,
  entry: {
    customerId: string
    action: string
    fieldName?: string | null
    oldValue?: string | null
    newValue?: string | null
    reason?: string | null
  },
) {
  await deps.history.append(deps.organizationId, {
    ...entry,
    actorUserId: deps.userId,
    actorIp: deps.actorIp ?? null,
  })
}

function assertEditable(customer: Customer) {
  if (customer.status === 'archived') throw new CustomerArchivedError()
}

export function createCustomerService(deps: CustomerAppDeps) {
  return {
    async createCustomer(input: CreateCustomerInput): Promise<Customer> {
      if (!canCreateCustomers(deps.can)) throw new CustomerPermissionError()
      const errors = validateCreateCustomer(input)
      if (hasFieldErrors(errors)) throw new CustomerValidationError(errors)

      const document = normalizeDocumentDigits(input.document)
      const status =
        input.activate && document ? ('active' as const) : ('draft' as const)

      try {
        const customer = await deps.customers.create(
          deps.organizationId,
          deps.userId,
          { ...input, document, status },
        )
        await audit(deps, {
          customerId: customer.id,
          action: 'customer.created',
          newValue: status,
        })
        deps.events.emit({
          type: 'CustomerCreated',
          organizationId: deps.organizationId,
          customerId: customer.id,
          personType: customer.personType,
          at: deps.clock.nowIso(),
        })
        if (status === 'active') {
          deps.events.emit({
            type: 'CustomerActivated',
            organizationId: deps.organizationId,
            customerId: customer.id,
            at: deps.clock.nowIso(),
          })
        }
        return customer
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async updateCustomer(
      customerId: string,
      input: UpdateCustomerInput,
    ): Promise<Customer> {
      if (!canEditCustomers(deps.can)) throw new CustomerPermissionError()
      const existing = await requireCustomer(deps, customerId)
      assertEditable(existing)

      const errors = validateUpdateCustomer(input, {
        personType: existing.personType,
      })
      if (hasFieldErrors(errors)) throw new CustomerValidationError(errors)

      const document =
        input.document !== undefined
          ? normalizeDocumentDigits(input.document)
          : undefined

      try {
        const customer = await deps.customers.update(
          deps.organizationId,
          deps.userId,
          customerId,
          { ...input, document },
        )
        await audit(deps, {
          customerId,
          action: 'customer.updated',
          fieldName: 'profile',
          oldValue: existing.legalName,
          newValue: customer.legalName,
        })
        deps.events.emit({
          type: 'CustomerUpdated',
          organizationId: deps.organizationId,
          customerId,
          at: deps.clock.nowIso(),
        })
        return customer
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async activateCustomer(customerId: string): Promise<Customer> {
      if (!canEditCustomers(deps.can)) throw new CustomerPermissionError()
      const existing = await requireCustomer(deps, customerId)
      assertCustomerTransition(existing.status, 'active')
      if (!existing.document) {
        throw new CustomerValidationError({
          document:
            existing.personType === 'PF'
              ? 'CPF obrigatório para ativar.'
              : 'CNPJ obrigatório para ativar.',
        })
      }
      const customer = await deps.customers.setStatus(
        deps.organizationId,
        deps.userId,
        customerId,
        'active',
        { archivedAt: null, archivedBy: null },
      )
      await audit(deps, {
        customerId,
        action: 'customer.activated',
        oldValue: existing.status,
        newValue: 'active',
      })
      deps.events.emit({
        type: 'CustomerActivated',
        organizationId: deps.organizationId,
        customerId,
        at: deps.clock.nowIso(),
      })
      return customer
    },

    async deactivateCustomer(customerId: string): Promise<Customer> {
      if (!canEditCustomers(deps.can)) throw new CustomerPermissionError()
      const existing = await requireCustomer(deps, customerId)
      assertCustomerTransition(existing.status, 'inactive')
      const customer = await deps.customers.setStatus(
        deps.organizationId,
        deps.userId,
        customerId,
        'inactive',
        { archivedAt: null, archivedBy: null },
      )
      await audit(deps, {
        customerId,
        action: 'customer.deactivated',
        oldValue: existing.status,
        newValue: 'inactive',
      })
      deps.events.emit({
        type: 'CustomerDeactivated',
        organizationId: deps.organizationId,
        customerId,
        at: deps.clock.nowIso(),
      })
      return customer
    },

    async archiveCustomer(customerId: string): Promise<Customer> {
      if (!canArchiveCustomers(deps.can)) throw new CustomerPermissionError()
      const existing = await requireCustomer(deps, customerId)
      assertCustomerTransition(existing.status, 'archived')
      const now = deps.clock.nowIso()
      const customer = await deps.customers.setStatus(
        deps.organizationId,
        deps.userId,
        customerId,
        'archived',
        { archivedAt: now, archivedBy: deps.userId },
      )
      await audit(deps, {
        customerId,
        action: 'customer.archived',
        oldValue: existing.status,
        newValue: 'archived',
      })
      deps.events.emit({
        type: 'CustomerArchived',
        organizationId: deps.organizationId,
        customerId,
        at: now,
      })
      return customer
    },

    async restoreCustomer(
      customerId: string,
      toStatus: 'active' | 'inactive' = 'active',
    ): Promise<Customer> {
      if (!canRestoreCustomers(deps.can)) throw new CustomerPermissionError()
      const existing = await requireCustomer(deps, customerId)
      if (existing.status !== 'archived') {
        throw new CustomerConflictError('customer_not_archived')
      }
      assertCustomerTransition(existing.status, toStatus)
      const customer = await deps.customers.setStatus(
        deps.organizationId,
        deps.userId,
        customerId,
        toStatus,
        { archivedAt: null, archivedBy: null },
      )
      await audit(deps, {
        customerId,
        action: 'customer.restored',
        oldValue: 'archived',
        newValue: toStatus,
      })
      deps.events.emit({
        type: 'CustomerRestored',
        organizationId: deps.organizationId,
        customerId,
        at: deps.clock.nowIso(),
      })
      return customer
    },

    async getCustomer(customerId: string): Promise<Customer> {
      if (!canReadCustomers(deps.can)) throw new CustomerPermissionError()
      return requireCustomer(deps, customerId)
    },

    async getCustomerSnapshot(customerId: string): Promise<CustomerSnapshot> {
      if (!canReadCustomers(deps.can)) throw new CustomerPermissionError()
      const customer = await requireCustomer(deps, customerId)
      const [contacts, addresses] = await Promise.all([
        deps.contacts.listByCustomer(deps.organizationId, customerId),
        deps.addresses.listByCustomer(deps.organizationId, customerId),
      ])
      return { customer, contacts, addresses }
    },

    async listCustomers(query: ListCustomersQuery): Promise<ListCustomersResult> {
      if (!canReadCustomers(deps.can)) throw new CustomerPermissionError()
      return deps.search.list(deps.organizationId, query)
    },

    async searchCustomers(query: SearchCustomersQuery) {
      if (!canReadCustomers(deps.can)) throw new CustomerPermissionError()
      return deps.search.search(deps.organizationId, query)
    },

    async listContacts(customerId: string): Promise<CustomerContact[]> {
      if (!canReadCustomers(deps.can)) throw new CustomerPermissionError()
      await requireCustomer(deps, customerId)
      return deps.contacts.listByCustomer(deps.organizationId, customerId)
    },

    async createContact(input: CreateContactInput): Promise<CustomerContact> {
      if (!canManageContacts(deps.can)) throw new CustomerPermissionError()
      const customer = await requireCustomer(deps, input.customerId)
      assertEditable(customer)
      const errors = validateCreateContact(input)
      if (hasFieldErrors(errors)) throw new CustomerValidationError(errors)

      if (input.isPrimary) {
        await deps.contacts.clearPrimary(
          deps.organizationId,
          input.customerId,
        )
      }
      try {
        const contact = await deps.contacts.create(
          deps.organizationId,
          deps.userId,
          input,
        )
        await audit(deps, {
          customerId: input.customerId,
          action: 'contact.added',
          newValue: contact.id,
        })
        deps.events.emit({
          type: 'ContactAdded',
          organizationId: deps.organizationId,
          customerId: input.customerId,
          contactId: contact.id,
          at: deps.clock.nowIso(),
        })
        return contact
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async updateContact(
      contactId: string,
      input: UpdateContactInput,
    ): Promise<CustomerContact> {
      if (!canManageContacts(deps.can)) throw new CustomerPermissionError()
      const existing = await deps.contacts.getById(deps.organizationId, contactId)
      if (!existing) throw new CustomerNotFoundError()
      const customer = await requireCustomer(deps, existing.customerId)
      assertEditable(customer)
      const errors = validateUpdateContact(input)
      if (hasFieldErrors(errors)) throw new CustomerValidationError(errors)

      if (input.isPrimary) {
        await deps.contacts.clearPrimary(
          deps.organizationId,
          existing.customerId,
          contactId,
        )
      }
      const contact = await deps.contacts.update(
        deps.organizationId,
        deps.userId,
        contactId,
        input,
      )
      await audit(deps, {
        customerId: existing.customerId,
        action: 'contact.updated',
        fieldName: 'contact',
        newValue: contactId,
      })
      return contact
    },

    async removeContact(contactId: string): Promise<CustomerContact> {
      if (!canManageContacts(deps.can)) throw new CustomerPermissionError()
      const existing = await deps.contacts.getById(deps.organizationId, contactId)
      if (!existing) throw new CustomerNotFoundError()
      const customer = await requireCustomer(deps, existing.customerId)
      assertEditable(customer)
      const contact = await deps.contacts.softRemove(
        deps.organizationId,
        deps.userId,
        contactId,
      )
      await audit(deps, {
        customerId: existing.customerId,
        action: 'contact.removed',
        oldValue: contactId,
      })
      return contact
    },

    async listAddresses(customerId: string): Promise<CustomerAddress[]> {
      if (!canReadCustomers(deps.can)) throw new CustomerPermissionError()
      await requireCustomer(deps, customerId)
      return deps.addresses.listByCustomer(deps.organizationId, customerId)
    },

    async createAddress(input: CreateAddressInput): Promise<CustomerAddress> {
      if (!canManageAddresses(deps.can)) throw new CustomerPermissionError()
      const customer = await requireCustomer(deps, input.customerId)
      assertEditable(customer)
      const errors = validateCreateAddress(input)
      if (hasFieldErrors(errors)) throw new CustomerValidationError(errors)

      if (input.isPrimary) {
        await deps.addresses.clearPrimaryForKind(
          deps.organizationId,
          input.customerId,
          input.kind,
        )
      }
      try {
        const address = await deps.addresses.create(
          deps.organizationId,
          deps.userId,
          input,
        )
        await audit(deps, {
          customerId: input.customerId,
          action: 'address.added',
          newValue: address.id,
        })
        deps.events.emit({
          type: 'AddressAdded',
          organizationId: deps.organizationId,
          customerId: input.customerId,
          addressId: address.id,
          at: deps.clock.nowIso(),
        })
        return address
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async updateAddress(
      addressId: string,
      input: UpdateAddressInput,
    ): Promise<CustomerAddress> {
      if (!canManageAddresses(deps.can)) throw new CustomerPermissionError()
      const existing = await deps.addresses.getById(
        deps.organizationId,
        addressId,
      )
      if (!existing) throw new CustomerNotFoundError()
      const customer = await requireCustomer(deps, existing.customerId)
      assertEditable(customer)
      const errors = validateUpdateAddress(input)
      if (hasFieldErrors(errors)) throw new CustomerValidationError(errors)

      const kind = input.kind ?? existing.kind
      if (input.isPrimary) {
        await deps.addresses.clearPrimaryForKind(
          deps.organizationId,
          existing.customerId,
          kind,
          addressId,
        )
      }
      const address = await deps.addresses.update(
        deps.organizationId,
        deps.userId,
        addressId,
        input,
      )
      await audit(deps, {
        customerId: existing.customerId,
        action: 'address.updated',
        newValue: addressId,
      })
      return address
    },

    async removeAddress(addressId: string): Promise<CustomerAddress> {
      if (!canManageAddresses(deps.can)) throw new CustomerPermissionError()
      const existing = await deps.addresses.getById(
        deps.organizationId,
        addressId,
      )
      if (!existing) throw new CustomerNotFoundError()
      const customer = await requireCustomer(deps, existing.customerId)
      assertEditable(customer)
      const address = await deps.addresses.softRemove(
        deps.organizationId,
        deps.userId,
        addressId,
      )
      await audit(deps, {
        customerId: existing.customerId,
        action: 'address.removed',
        oldValue: addressId,
      })
      return address
    },

    async listHistory(
      customerId: string,
      limit?: number,
    ): Promise<CustomerHistoryEntry[]> {
      if (!canReadCustomers(deps.can)) throw new CustomerPermissionError()
      await requireCustomer(deps, customerId)
      return deps.history.listByCustomer(
        deps.organizationId,
        customerId,
        limit,
      )
    },
  }
}

export type CustomerService = ReturnType<typeof createCustomerService>
