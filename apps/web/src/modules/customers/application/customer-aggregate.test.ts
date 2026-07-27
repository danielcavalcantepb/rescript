import { describe, expect, it } from 'vitest'
import { createCustomerService } from '#/modules/customers/application/customer-service'
import { createMemoryCustomerRepos } from '#/modules/customers/application/memory-customer'
import { createInMemoryCustomerEventCollector } from '#/modules/customers/domain/events'
import type { PermissionKey } from '@rescript/permissions'

function app(grants: PermissionKey[] = [
  'customers.read',
  'customers.create',
  'customers.edit',
  'customers.archive',
  'customers.restore',
  'customers.contacts.manage',
  'customers.addresses.manage',
]) {
  const repos = createMemoryCustomerRepos()
  const events = createInMemoryCustomerEventCollector()
  const service = createCustomerService({
    organizationId: 'org_1',
    userId: 'user_1',
    can: (key) => grants.includes(key),
    clock: { nowIso: () => '2026-07-26T00:00:00.000Z' },
    ids: { next: () => 'id' },
    events,
    ...repos,
  })
  return { service, events, repos }
}

describe('Customer aggregate application', () => {
  it('creates draft/active, contacts, addresses, search and lifecycle', async () => {
    const { service, events } = app()

    const draft = await service.createCustomer({
      personType: 'PF',
      legalName: 'Maria Silva',
      document: '52998224725',
      activate: false,
    })
    expect(draft.status).toBe('draft')

    const active = await service.activateCustomer(draft.id)
    expect(active.status).toBe('active')

    const contact = await service.createContact({
      customerId: draft.id,
      name: 'Compras',
      email: 'compras@example.com',
      isPrimary: true,
    })
    expect(contact.isPrimary).toBe(true)

    const address = await service.createAddress({
      customerId: draft.id,
      kind: 'billing',
      postalCode: '01310-100',
      street: 'Av Paulista',
      city: 'São Paulo',
      state: 'SP',
      isPrimary: true,
    })
    expect(address.postalCode).toBe('01310100')

    const search = await service.searchCustomers({ q: '52998224725' })
    expect(search.some((x) => x.id === draft.id)).toBe(true)

    await service.deactivateCustomer(draft.id)
    await service.archiveCustomer(draft.id)
    const restored = await service.restoreCustomer(draft.id)
    expect(restored.status).toBe('active')

    const history = await service.listHistory(draft.id)
    expect(history.length).toBeGreaterThan(3)

    const drained = events.drain()
    expect(drained.some((e) => e.type === 'CustomerCreated')).toBe(true)
    expect(drained.some((e) => e.type === 'ContactAdded')).toBe(true)
    expect(drained.some((e) => e.type === 'AddressAdded')).toBe(true)
    expect(drained.some((e) => e.type === 'CustomerArchived')).toBe(true)
  })

  it('rejects person-type change attempts via update (not in input) and perms', async () => {
    const { service } = app(['customers.read'])
    await expect(
      service.createCustomer({
        personType: 'PJ',
        legalName: 'ACME',
        document: '11444777000161',
        activate: true,
      }),
    ).rejects.toThrow(/permission/)
  })

  it('requires document to activate', async () => {
    const { service } = app()
    const c = await service.createCustomer({
      personType: 'PJ',
      legalName: 'Sem Doc',
      activate: false,
    })
    await expect(service.activateCustomer(c.id)).rejects.toThrow(/validation/)
  })

  it('isolates organizations in memory search', async () => {
    const repos = createMemoryCustomerRepos()
    const a = createCustomerService({
      organizationId: 'org_a',
      userId: 'u',
      can: () => true,
      clock: { nowIso: () => new Date().toISOString() },
      ids: { next: () => crypto.randomUUID() },
      events: createInMemoryCustomerEventCollector(),
      ...repos,
    })
    const b = createCustomerService({
      organizationId: 'org_b',
      userId: 'u',
      can: () => true,
      clock: { nowIso: () => new Date().toISOString() },
      ids: { next: () => crypto.randomUUID() },
      events: createInMemoryCustomerEventCollector(),
      ...repos,
    })
    await a.createCustomer({
      personType: 'PF',
      legalName: 'Only A',
      document: '52998224725',
      activate: true,
    })
    const hits = await b.searchCustomers({ q: 'Only' })
    expect(hits).toHaveLength(0)
  })
})
