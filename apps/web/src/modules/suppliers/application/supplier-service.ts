import {
  canArchiveSuppliers,
  canCreateSuppliers,
  canEditSuppliers,
  canManageAddresses,
  canManageContacts,
  canReadSuppliers,
  canRestoreSuppliers,
  type SupplierAppDeps,
} from '#/modules/suppliers/application/deps'
import {
  SupplierArchivedError,
  SupplierConflictError,
  SupplierNotFoundError,
  SupplierPermissionError,
  SupplierValidationError,
  mapRepositoryError,
} from '#/modules/suppliers/application/errors'
import { normalizeDocumentDigits } from '#/modules/suppliers/domain/document'
import { assertSupplierTransition } from '#/modules/suppliers/domain/lifecycle'
import type {
  CreateAddressInput,
  CreateContactInput,
  CreateSupplierInput,
  Supplier,
  SupplierAddress,
  SupplierContact,
  SupplierHistoryEntry,
  SupplierSnapshot,
  ListSuppliersQuery,
  ListSuppliersResult,
  SearchSuppliersQuery,
  UpdateAddressInput,
  UpdateContactInput,
  UpdateSupplierInput,
} from '#/modules/suppliers/domain/types'
import {
  hasFieldErrors,
  validateCreateAddress,
  validateCreateContact,
  validateCreateSupplier,
  validateUpdateAddress,
  validateUpdateContact,
  validateUpdateSupplier,
} from '#/modules/suppliers/domain/validation'

async function requireSupplier(
  deps: SupplierAppDeps,
  supplierId: string,
): Promise<Supplier> {
  const supplier = await deps.suppliers.getById(deps.organizationId, supplierId)
  if (!supplier) throw new SupplierNotFoundError()
  return supplier
}

async function audit(
  deps: SupplierAppDeps,
  entry: {
    supplierId: string
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

function assertEditable(supplier: Supplier) {
  if (supplier.status === 'archived') throw new SupplierArchivedError()
}

export function createSupplierService(deps: SupplierAppDeps) {
  return {
    async createSupplier(input: CreateSupplierInput): Promise<Supplier> {
      if (!canCreateSuppliers(deps.can)) throw new SupplierPermissionError()
      const errors = validateCreateSupplier(input)
      if (hasFieldErrors(errors)) throw new SupplierValidationError(errors)

      const document = normalizeDocumentDigits(input.document)
      const status =
        input.activate && document ? ('active' as const) : ('draft' as const)

      try {
        const supplier = await deps.suppliers.create(
          deps.organizationId,
          deps.userId,
          { ...input, document, status },
        )
        await audit(deps, {
          supplierId: supplier.id,
          action: 'supplier.created',
          newValue: status,
        })
        deps.events.emit({
          type: 'SupplierCreated',
          organizationId: deps.organizationId,
          supplierId: supplier.id,
          personType: supplier.personType,
          at: deps.clock.nowIso(),
        })
        if (status === 'active') {
          deps.events.emit({
            type: 'SupplierActivated',
            organizationId: deps.organizationId,
            supplierId: supplier.id,
            at: deps.clock.nowIso(),
          })
        }
        return supplier
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async updateSupplier(
      supplierId: string,
      input: UpdateSupplierInput,
    ): Promise<Supplier> {
      if (!canEditSuppliers(deps.can)) throw new SupplierPermissionError()
      const existing = await requireSupplier(deps, supplierId)
      assertEditable(existing)

      const errors = validateUpdateSupplier(input, {
        personType: existing.personType,
      })
      if (hasFieldErrors(errors)) throw new SupplierValidationError(errors)

      const document =
        input.document !== undefined
          ? normalizeDocumentDigits(input.document)
          : undefined

      try {
        const supplier = await deps.suppliers.update(
          deps.organizationId,
          deps.userId,
          supplierId,
          { ...input, document },
        )
        await audit(deps, {
          supplierId,
          action: 'supplier.updated',
          fieldName: 'profile',
          oldValue: existing.legalName,
          newValue: supplier.legalName,
        })
        deps.events.emit({
          type: 'SupplierUpdated',
          organizationId: deps.organizationId,
          supplierId,
          at: deps.clock.nowIso(),
        })
        return supplier
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async activateSupplier(supplierId: string): Promise<Supplier> {
      if (!canEditSuppliers(deps.can)) throw new SupplierPermissionError()
      const existing = await requireSupplier(deps, supplierId)
      assertSupplierTransition(existing.status, 'active')
      if (!existing.document) {
        throw new SupplierValidationError({
          document:
            existing.personType === 'PF'
              ? 'CPF obrigatório para ativar.'
              : 'CNPJ obrigatório para ativar.',
        })
      }
      const supplier = await deps.suppliers.setStatus(
        deps.organizationId,
        deps.userId,
        supplierId,
        'active',
        { archivedAt: null, archivedBy: null },
      )
      await audit(deps, {
        supplierId,
        action: 'supplier.activated',
        oldValue: existing.status,
        newValue: 'active',
      })
      deps.events.emit({
        type: 'SupplierActivated',
        organizationId: deps.organizationId,
        supplierId,
        at: deps.clock.nowIso(),
      })
      return supplier
    },

    async deactivateSupplier(supplierId: string): Promise<Supplier> {
      if (!canEditSuppliers(deps.can)) throw new SupplierPermissionError()
      const existing = await requireSupplier(deps, supplierId)
      assertSupplierTransition(existing.status, 'inactive')
      const supplier = await deps.suppliers.setStatus(
        deps.organizationId,
        deps.userId,
        supplierId,
        'inactive',
        { archivedAt: null, archivedBy: null },
      )
      await audit(deps, {
        supplierId,
        action: 'supplier.deactivated',
        oldValue: existing.status,
        newValue: 'inactive',
      })
      deps.events.emit({
        type: 'SupplierDeactivated',
        organizationId: deps.organizationId,
        supplierId,
        at: deps.clock.nowIso(),
      })
      return supplier
    },

    async archiveSupplier(supplierId: string): Promise<Supplier> {
      if (!canArchiveSuppliers(deps.can)) throw new SupplierPermissionError()
      const existing = await requireSupplier(deps, supplierId)
      assertSupplierTransition(existing.status, 'archived')
      const now = deps.clock.nowIso()
      const supplier = await deps.suppliers.setStatus(
        deps.organizationId,
        deps.userId,
        supplierId,
        'archived',
        { archivedAt: now, archivedBy: deps.userId },
      )
      await audit(deps, {
        supplierId,
        action: 'supplier.archived',
        oldValue: existing.status,
        newValue: 'archived',
      })
      deps.events.emit({
        type: 'SupplierArchived',
        organizationId: deps.organizationId,
        supplierId,
        at: now,
      })
      return supplier
    },

    async restoreSupplier(
      supplierId: string,
      toStatus: 'active' | 'inactive' = 'active',
    ): Promise<Supplier> {
      if (!canRestoreSuppliers(deps.can)) throw new SupplierPermissionError()
      const existing = await requireSupplier(deps, supplierId)
      if (existing.status !== 'archived') {
        throw new SupplierConflictError('supplier_not_archived')
      }
      assertSupplierTransition(existing.status, toStatus)
      const supplier = await deps.suppliers.setStatus(
        deps.organizationId,
        deps.userId,
        supplierId,
        toStatus,
        { archivedAt: null, archivedBy: null },
      )
      await audit(deps, {
        supplierId,
        action: 'supplier.restored',
        oldValue: 'archived',
        newValue: toStatus,
      })
      deps.events.emit({
        type: 'SupplierRestored',
        organizationId: deps.organizationId,
        supplierId,
        at: deps.clock.nowIso(),
      })
      return supplier
    },

    async getSupplier(supplierId: string): Promise<Supplier> {
      if (!canReadSuppliers(deps.can)) throw new SupplierPermissionError()
      return requireSupplier(deps, supplierId)
    },

    async getSupplierSnapshot(supplierId: string): Promise<SupplierSnapshot> {
      if (!canReadSuppliers(deps.can)) throw new SupplierPermissionError()
      const supplier = await requireSupplier(deps, supplierId)
      const [contacts, addresses] = await Promise.all([
        deps.contacts.listBySupplier(deps.organizationId, supplierId),
        deps.addresses.listBySupplier(deps.organizationId, supplierId),
      ])
      return { supplier, contacts, addresses }
    },

    async listSuppliers(query: ListSuppliersQuery): Promise<ListSuppliersResult> {
      if (!canReadSuppliers(deps.can)) throw new SupplierPermissionError()
      return deps.search.list(deps.organizationId, query)
    },

    async searchSuppliers(query: SearchSuppliersQuery) {
      if (!canReadSuppliers(deps.can)) throw new SupplierPermissionError()
      return deps.search.search(deps.organizationId, query)
    },

    async listContacts(supplierId: string): Promise<SupplierContact[]> {
      if (!canReadSuppliers(deps.can)) throw new SupplierPermissionError()
      await requireSupplier(deps, supplierId)
      return deps.contacts.listBySupplier(deps.organizationId, supplierId)
    },

    async createContact(input: CreateContactInput): Promise<SupplierContact> {
      if (!canManageContacts(deps.can)) throw new SupplierPermissionError()
      const supplier = await requireSupplier(deps, input.supplierId)
      assertEditable(supplier)
      const errors = validateCreateContact(input)
      if (hasFieldErrors(errors)) throw new SupplierValidationError(errors)

      if (input.isPrimary) {
        await deps.contacts.clearPrimary(
          deps.organizationId,
          input.supplierId,
        )
      }
      try {
        const contact = await deps.contacts.create(
          deps.organizationId,
          deps.userId,
          input,
        )
        await audit(deps, {
          supplierId: input.supplierId,
          action: 'contact.added',
          newValue: contact.id,
        })
        deps.events.emit({
          type: 'SupplierContactAdded',
          organizationId: deps.organizationId,
          supplierId: input.supplierId,
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
    ): Promise<SupplierContact> {
      if (!canManageContacts(deps.can)) throw new SupplierPermissionError()
      const existing = await deps.contacts.getById(deps.organizationId, contactId)
      if (!existing) throw new SupplierNotFoundError()
      const supplier = await requireSupplier(deps, existing.supplierId)
      assertEditable(supplier)
      const errors = validateUpdateContact(input)
      if (hasFieldErrors(errors)) throw new SupplierValidationError(errors)

      if (input.isPrimary) {
        await deps.contacts.clearPrimary(
          deps.organizationId,
          existing.supplierId,
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
        supplierId: existing.supplierId,
        action: 'contact.updated',
        fieldName: 'contact',
        newValue: contactId,
      })
      return contact
    },

    async removeContact(contactId: string): Promise<SupplierContact> {
      if (!canManageContacts(deps.can)) throw new SupplierPermissionError()
      const existing = await deps.contacts.getById(deps.organizationId, contactId)
      if (!existing) throw new SupplierNotFoundError()
      const supplier = await requireSupplier(deps, existing.supplierId)
      assertEditable(supplier)
      const contact = await deps.contacts.softRemove(
        deps.organizationId,
        deps.userId,
        contactId,
      )
      await audit(deps, {
        supplierId: existing.supplierId,
        action: 'contact.removed',
        oldValue: contactId,
      })
      return contact
    },

    async listAddresses(supplierId: string): Promise<SupplierAddress[]> {
      if (!canReadSuppliers(deps.can)) throw new SupplierPermissionError()
      await requireSupplier(deps, supplierId)
      return deps.addresses.listBySupplier(deps.organizationId, supplierId)
    },

    async createAddress(input: CreateAddressInput): Promise<SupplierAddress> {
      if (!canManageAddresses(deps.can)) throw new SupplierPermissionError()
      const supplier = await requireSupplier(deps, input.supplierId)
      assertEditable(supplier)
      const errors = validateCreateAddress(input)
      if (hasFieldErrors(errors)) throw new SupplierValidationError(errors)

      if (input.isPrimary) {
        await deps.addresses.clearPrimaryForKind(
          deps.organizationId,
          input.supplierId,
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
          supplierId: input.supplierId,
          action: 'address.added',
          newValue: address.id,
        })
        deps.events.emit({
          type: 'SupplierAddressAdded',
          organizationId: deps.organizationId,
          supplierId: input.supplierId,
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
    ): Promise<SupplierAddress> {
      if (!canManageAddresses(deps.can)) throw new SupplierPermissionError()
      const existing = await deps.addresses.getById(
        deps.organizationId,
        addressId,
      )
      if (!existing) throw new SupplierNotFoundError()
      const supplier = await requireSupplier(deps, existing.supplierId)
      assertEditable(supplier)
      const errors = validateUpdateAddress(input)
      if (hasFieldErrors(errors)) throw new SupplierValidationError(errors)

      const kind = input.kind ?? existing.kind
      if (input.isPrimary) {
        await deps.addresses.clearPrimaryForKind(
          deps.organizationId,
          existing.supplierId,
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
        supplierId: existing.supplierId,
        action: 'address.updated',
        newValue: addressId,
      })
      return address
    },

    async removeAddress(addressId: string): Promise<SupplierAddress> {
      if (!canManageAddresses(deps.can)) throw new SupplierPermissionError()
      const existing = await deps.addresses.getById(
        deps.organizationId,
        addressId,
      )
      if (!existing) throw new SupplierNotFoundError()
      const supplier = await requireSupplier(deps, existing.supplierId)
      assertEditable(supplier)
      const address = await deps.addresses.softRemove(
        deps.organizationId,
        deps.userId,
        addressId,
      )
      await audit(deps, {
        supplierId: existing.supplierId,
        action: 'address.removed',
        oldValue: addressId,
      })
      return address
    },

    async listHistory(
      supplierId: string,
      limit?: number,
    ): Promise<SupplierHistoryEntry[]> {
      if (!canReadSuppliers(deps.can)) throw new SupplierPermissionError()
      await requireSupplier(deps, supplierId)
      return deps.history.listBySupplier(
        deps.organizationId,
        supplierId,
        limit,
      )
    },
  }
}

export type SupplierService = ReturnType<typeof createSupplierService>
