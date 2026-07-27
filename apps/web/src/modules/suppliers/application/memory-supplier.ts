import type {
  SupplierAddressRepository,
  SupplierContactRepository,
  SupplierHistoryRepository,
  SupplierRepository,
  SupplierSearchRepository,
} from '#/modules/suppliers/application/ports'
import type {
  Supplier,
  SupplierAddress,
  SupplierContact,
  SupplierHistoryEntry,
  SupplierListItem,
  SupplierStatus,
  ListSuppliersQuery,
  ListSuppliersResult,
  SearchSuppliersQuery,
} from '#/modules/suppliers/domain/types'

function buildSearchText(c: Supplier, contacts: SupplierContact[]): string {
  return [
    c.legalName,
    c.tradeName,
    c.document,
    c.email,
    c.phone,
    c.city,
    ...contacts.map((x) => `${x.name} ${x.email} ${x.phone}`),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function createMemorySupplierRepos(seed?: {
  suppliers?: Supplier[]
  contacts?: SupplierContact[]
  addresses?: SupplierAddress[]
}) {
  const suppliers = new Map<string, Supplier>(
    (seed?.suppliers ?? []).map((c) => [c.id, c]),
  )
  const contacts = new Map<string, SupplierContact>(
    (seed?.contacts ?? []).map((c) => [c.id, c]),
  )
  const addresses = new Map<string, SupplierAddress>(
    (seed?.addresses ?? []).map((a) => [a.id, a]),
  )
  const history: SupplierHistoryEntry[] = []
  let seq = 1
  const nextId = () => `mem_${seq++}`

  const supplierRepo: SupplierRepository = {
    async getById(organizationId, id) {
      const c = suppliers.get(id)
      return c?.organizationId === organizationId ? c : null
    },
    async create(organizationId, _userId, input) {
      const now = new Date().toISOString()
      const supplier: Supplier = {
        id: nextId(),
        organizationId,
        personType: input.personType,
        legalName: input.legalName.trim(),
        tradeName: input.tradeName?.trim() || null,
        document: input.document,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        city: input.city?.trim() || null,
        notes: input.notes?.trim() || null,
        status: input.status,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      for (const existing of suppliers.values()) {
        if (
          existing.organizationId === organizationId &&
          existing.document &&
          existing.document === supplier.document
        ) {
          const err = new Error('duplicate') as Error & { code: string }
          err.code = '23505'
          throw err
        }
      }
      suppliers.set(supplier.id, supplier)
      return supplier
    },
    async update(organizationId, _userId, id, input) {
      const existing = suppliers.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: Supplier = {
        ...existing,
        legalName: input.legalName?.trim() ?? existing.legalName,
        tradeName:
          input.tradeName !== undefined
            ? input.tradeName?.trim() || null
            : existing.tradeName,
        document:
          input.document !== undefined ? input.document : existing.document,
        email:
          input.email !== undefined
            ? input.email?.trim() || null
            : existing.email,
        phone:
          input.phone !== undefined
            ? input.phone?.trim() || null
            : existing.phone,
        city:
          input.city !== undefined ? input.city?.trim() || null : existing.city,
        notes:
          input.notes !== undefined
            ? input.notes?.trim() || null
            : existing.notes,
        updatedAt: new Date().toISOString(),
      }
      suppliers.set(id, next)
      return next
    },
    async setStatus(organizationId, _userId, id, status, archive) {
      const existing = suppliers.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: Supplier = {
        ...existing,
        status,
        archivedAt: archive?.archivedAt ?? null,
        updatedAt: new Date().toISOString(),
      }
      suppliers.set(id, next)
      return next
    },
  }

  const searchRepo: SupplierSearchRepository = {
    async list(
      organizationId: string,
      query: ListSuppliersQuery,
    ): Promise<ListSuppliersResult> {
      const status = query.status ?? 'active'
      const q = (query.q ?? '').toLowerCase().trim()
      const digits = q.replace(/\D/g, '')
      let items = [...suppliers.values()].filter(
        (c) => c.organizationId === organizationId,
      )
      if (status !== 'all') items = items.filter((c) => c.status === status)
      if (q) {
        items = items.filter((c) => {
          const contactBits = [...contacts.values()].filter(
            (x) => x.supplierId === c.id && x.status !== 'archived',
          )
          const text = buildSearchText(c, contactBits)
          return (
            text.includes(q) ||
            (digits.length >= 3 && (c.document ?? '').includes(digits))
          )
        })
      }
      items.sort((a, b) => a.legalName.localeCompare(b.legalName))
      const limit = Math.min(query.limit ?? 20, 50)
      const page = items.slice(0, limit)
      return {
        items: page.map(toListItem),
        nextCursor: items.length > limit ? page[page.length - 1]!.id : null,
      }
    },
    async search(organizationId: string, query: SearchSuppliersQuery) {
      const result = await this.list(organizationId, {
        q: query.q,
        status: query.status ?? 'all',
        limit: query.limit ?? 20,
      })
      return result.items
    },
  }

  const contactRepo: SupplierContactRepository = {
    async listBySupplier(organizationId, supplierId) {
      return [...contacts.values()].filter(
        (c) =>
          c.organizationId === organizationId &&
          c.supplierId === supplierId &&
          c.status !== 'archived',
      )
    },
    async getById(organizationId, id) {
      const c = contacts.get(id)
      return c?.organizationId === organizationId ? c : null
    },
    async create(organizationId, _userId, input) {
      const now = new Date().toISOString()
      const contact: SupplierContact = {
        id: nextId(),
        organizationId,
        supplierId: input.supplierId,
        name: input.name.trim(),
        roleTitle: input.roleTitle?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        isPrimary: Boolean(input.isPrimary),
        status: 'active',
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      contacts.set(contact.id, contact)
      return contact
    },
    async update(organizationId, _userId, id, input) {
      const existing = contacts.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: SupplierContact = {
        ...existing,
        ...input,
        name: input.name?.trim() ?? existing.name,
        roleTitle:
          input.roleTitle !== undefined
            ? input.roleTitle?.trim() || null
            : existing.roleTitle,
        email:
          input.email !== undefined
            ? input.email?.trim() || null
            : existing.email,
        phone:
          input.phone !== undefined
            ? input.phone?.trim() || null
            : existing.phone,
        updatedAt: new Date().toISOString(),
      }
      contacts.set(id, next)
      return next
    },
    async softRemove(organizationId, _userId, id) {
      const existing = contacts.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: SupplierContact = {
        ...existing,
        status: 'archived',
        isPrimary: false,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      contacts.set(id, next)
      return next
    },
    async clearPrimary(organizationId, supplierId, exceptId) {
      for (const [id, c] of contacts) {
        if (
          c.organizationId === organizationId &&
          c.supplierId === supplierId &&
          c.isPrimary &&
          id !== exceptId
        ) {
          contacts.set(id, { ...c, isPrimary: false })
        }
      }
    },
  }

  const addressRepo: SupplierAddressRepository = {
    async listBySupplier(organizationId, supplierId) {
      return [...addresses.values()].filter(
        (a) =>
          a.organizationId === organizationId &&
          a.supplierId === supplierId &&
          a.status !== 'archived',
      )
    },
    async getById(organizationId, id) {
      const a = addresses.get(id)
      return a?.organizationId === organizationId ? a : null
    },
    async create(organizationId, _userId, input) {
      const now = new Date().toISOString()
      const address: SupplierAddress = {
        id: nextId(),
        organizationId,
        supplierId: input.supplierId,
        kind: input.kind,
        postalCode: input.postalCode.replace(/\D/g, '') || input.postalCode,
        street: input.street.trim(),
        number: input.number?.trim() || null,
        complement: input.complement?.trim() || null,
        district: input.district?.trim() || null,
        city: input.city.trim(),
        state: input.state.trim().toUpperCase(),
        country: (input.country ?? 'BR').toUpperCase(),
        isPrimary: Boolean(input.isPrimary),
        status: 'active',
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      addresses.set(address.id, address)
      return address
    },
    async update(organizationId, _userId, id, input) {
      const existing = addresses.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: SupplierAddress = {
        ...existing,
        ...input,
        postalCode:
          input.postalCode !== undefined
            ? input.postalCode.replace(/\D/g, '') || input.postalCode
            : existing.postalCode,
        street: input.street?.trim() ?? existing.street,
        city: input.city?.trim() ?? existing.city,
        state: input.state?.trim().toUpperCase() ?? existing.state,
        country: input.country?.trim().toUpperCase() ?? existing.country,
        updatedAt: new Date().toISOString(),
      }
      addresses.set(id, next)
      return next
    },
    async softRemove(organizationId, _userId, id) {
      const existing = addresses.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: SupplierAddress = {
        ...existing,
        status: 'archived',
        isPrimary: false,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addresses.set(id, next)
      return next
    },
    async clearPrimaryForKind(organizationId, supplierId, kind, exceptId) {
      for (const [id, a] of addresses) {
        if (
          a.organizationId === organizationId &&
          a.supplierId === supplierId &&
          a.kind === kind &&
          a.isPrimary &&
          id !== exceptId
        ) {
          addresses.set(id, { ...a, isPrimary: false })
        }
      }
    },
  }

  const historyRepo: SupplierHistoryRepository = {
    async append(organizationId, entry) {
      const row: SupplierHistoryEntry = {
        id: nextId(),
        organizationId,
        supplierId: entry.supplierId,
        action: entry.action,
        fieldName: entry.fieldName ?? null,
        oldValue: entry.oldValue ?? null,
        newValue: entry.newValue ?? null,
        reason: entry.reason ?? null,
        actorUserId: entry.actorUserId,
        actorIp: entry.actorIp ?? null,
        createdAt: new Date().toISOString(),
      }
      history.push(row)
      return row
    },
    async listBySupplier(organizationId, supplierId, limit = 50) {
      return history
        .filter(
          (h) =>
            h.organizationId === organizationId && h.supplierId === supplierId,
        )
        .slice(0, limit)
    },
  }

  return {
    suppliers: supplierRepo,
    search: searchRepo,
    contacts: contactRepo,
    addresses: addressRepo,
    history: historyRepo,
    _suppliers: suppliers,
  }
}

function toListItem(c: Supplier): SupplierListItem {
  return {
    id: c.id,
    legalName: c.legalName,
    tradeName: c.tradeName,
    document: c.document,
    email: c.email,
    phone: c.phone,
    status: c.status as SupplierStatus,
    updatedAt: c.updatedAt,
  }
}
