import type {
  CustomerAddressRepository,
  CustomerContactRepository,
  CustomerHistoryRepository,
  CustomerRepository,
  CustomerSearchRepository,
} from '#/modules/customers/application/ports'
import type {
  Customer,
  CustomerAddress,
  CustomerContact,
  CustomerHistoryEntry,
  CustomerListItem,
  CustomerStatus,
  ListCustomersQuery,
  ListCustomersResult,
  SearchCustomersQuery,
} from '#/modules/customers/domain/types'

function buildSearchText(c: Customer, contacts: CustomerContact[]): string {
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

export function createMemoryCustomerRepos(seed?: {
  customers?: Customer[]
  contacts?: CustomerContact[]
  addresses?: CustomerAddress[]
}) {
  const customers = new Map<string, Customer>(
    (seed?.customers ?? []).map((c) => [c.id, c]),
  )
  const contacts = new Map<string, CustomerContact>(
    (seed?.contacts ?? []).map((c) => [c.id, c]),
  )
  const addresses = new Map<string, CustomerAddress>(
    (seed?.addresses ?? []).map((a) => [a.id, a]),
  )
  const history: CustomerHistoryEntry[] = []
  let seq = 1
  const nextId = () => `mem_${seq++}`

  const customerRepo: CustomerRepository = {
    async getById(organizationId, id) {
      const c = customers.get(id)
      return c?.organizationId === organizationId ? c : null
    },
    async create(organizationId, _userId, input) {
      const now = new Date().toISOString()
      const customer: Customer = {
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
      for (const existing of customers.values()) {
        if (
          existing.organizationId === organizationId &&
          existing.document &&
          existing.document === customer.document
        ) {
          const err = new Error('duplicate') as Error & { code: string }
          err.code = '23505'
          throw err
        }
      }
      customers.set(customer.id, customer)
      return customer
    },
    async update(organizationId, _userId, id, input) {
      const existing = customers.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: Customer = {
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
      customers.set(id, next)
      return next
    },
    async setStatus(organizationId, _userId, id, status, archive) {
      const existing = customers.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: Customer = {
        ...existing,
        status,
        archivedAt: archive?.archivedAt ?? null,
        updatedAt: new Date().toISOString(),
      }
      customers.set(id, next)
      return next
    },
  }

  const searchRepo: CustomerSearchRepository = {
    async list(
      organizationId: string,
      query: ListCustomersQuery,
    ): Promise<ListCustomersResult> {
      const status = query.status ?? 'active'
      const q = (query.q ?? '').toLowerCase().trim()
      const digits = q.replace(/\D/g, '')
      let items = [...customers.values()].filter(
        (c) => c.organizationId === organizationId,
      )
      if (status !== 'all') items = items.filter((c) => c.status === status)
      if (q) {
        items = items.filter((c) => {
          const contactBits = [...contacts.values()].filter(
            (x) => x.customerId === c.id && x.status !== 'archived',
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
    async search(organizationId: string, query: SearchCustomersQuery) {
      const result = await this.list(organizationId, {
        q: query.q,
        status: query.status ?? 'all',
        limit: query.limit ?? 20,
      })
      return result.items
    },
  }

  const contactRepo: CustomerContactRepository = {
    async listByCustomer(organizationId, customerId) {
      return [...contacts.values()].filter(
        (c) =>
          c.organizationId === organizationId &&
          c.customerId === customerId &&
          c.status !== 'archived',
      )
    },
    async getById(organizationId, id) {
      const c = contacts.get(id)
      return c?.organizationId === organizationId ? c : null
    },
    async create(organizationId, _userId, input) {
      const now = new Date().toISOString()
      const contact: CustomerContact = {
        id: nextId(),
        organizationId,
        customerId: input.customerId,
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
      const next: CustomerContact = {
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
      const next: CustomerContact = {
        ...existing,
        status: 'archived',
        isPrimary: false,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      contacts.set(id, next)
      return next
    },
    async clearPrimary(organizationId, customerId, exceptId) {
      for (const [id, c] of contacts) {
        if (
          c.organizationId === organizationId &&
          c.customerId === customerId &&
          c.isPrimary &&
          id !== exceptId
        ) {
          contacts.set(id, { ...c, isPrimary: false })
        }
      }
    },
  }

  const addressRepo: CustomerAddressRepository = {
    async listByCustomer(organizationId, customerId) {
      return [...addresses.values()].filter(
        (a) =>
          a.organizationId === organizationId &&
          a.customerId === customerId &&
          a.status !== 'archived',
      )
    },
    async getById(organizationId, id) {
      const a = addresses.get(id)
      return a?.organizationId === organizationId ? a : null
    },
    async create(organizationId, _userId, input) {
      const now = new Date().toISOString()
      const address: CustomerAddress = {
        id: nextId(),
        organizationId,
        customerId: input.customerId,
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
      const next: CustomerAddress = {
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
      const next: CustomerAddress = {
        ...existing,
        status: 'archived',
        isPrimary: false,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addresses.set(id, next)
      return next
    },
    async clearPrimaryForKind(organizationId, customerId, kind, exceptId) {
      for (const [id, a] of addresses) {
        if (
          a.organizationId === organizationId &&
          a.customerId === customerId &&
          a.kind === kind &&
          a.isPrimary &&
          id !== exceptId
        ) {
          addresses.set(id, { ...a, isPrimary: false })
        }
      }
    },
  }

  const historyRepo: CustomerHistoryRepository = {
    async append(organizationId, entry) {
      const row: CustomerHistoryEntry = {
        id: nextId(),
        organizationId,
        customerId: entry.customerId,
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
    async listByCustomer(organizationId, customerId, limit = 50) {
      return history
        .filter(
          (h) =>
            h.organizationId === organizationId && h.customerId === customerId,
        )
        .slice(0, limit)
    },
  }

  return {
    customers: customerRepo,
    search: searchRepo,
    contacts: contactRepo,
    addresses: addressRepo,
    history: historyRepo,
    _customers: customers,
  }
}

function toListItem(c: Customer): CustomerListItem {
  return {
    id: c.id,
    legalName: c.legalName,
    tradeName: c.tradeName,
    document: c.document,
    email: c.email,
    phone: c.phone,
    status: c.status as CustomerStatus,
    updatedAt: c.updatedAt,
  }
}
