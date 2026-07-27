import { describe, expect, it } from 'vitest'
import { createSupplierService } from '#/modules/suppliers/application/supplier-service'
import { createMemorySupplierRepos } from '#/modules/suppliers/application/memory-supplier'
import { createInMemorySupplierEventCollector } from '#/modules/suppliers/domain/events'
import type { PermissionKey } from '@rescript/permissions'

function app(grants: PermissionKey[] = [
  'suppliers.read',
  'suppliers.create',
  'suppliers.edit',
  'suppliers.archive',
  'suppliers.restore',
  'suppliers.contacts.manage',
  'suppliers.addresses.manage',
]) {
  const repos = createMemorySupplierRepos()
  const events = createInMemorySupplierEventCollector()
  const service = createSupplierService({
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

describe('Supplier aggregate application', () => {
  it('creates draft/active, contacts, addresses, search and lifecycle', async () => {
    const { service, events } = app()

    const draft = await service.createSupplier({
      personType: 'PF',
      legalName: 'Maria Silva',
      document: '52998224725',
      activate: false,
    })
    expect(draft.status).toBe('draft')

    const active = await service.activateSupplier(draft.id)
    expect(active.status).toBe('active')

    const contact = await service.createContact({
      supplierId: draft.id,
      name: 'Compras',
      email: 'compras@example.com',
      isPrimary: true,
    })
    expect(contact.isPrimary).toBe(true)

    const address = await service.createAddress({
      supplierId: draft.id,
      kind: 'billing',
      postalCode: '01310-100',
      street: 'Av Paulista',
      city: 'São Paulo',
      state: 'SP',
      isPrimary: true,
    })
    expect(address.postalCode).toBe('01310100')

    const search = await service.searchSuppliers({ q: '52998224725' })
    expect(search.some((x) => x.id === draft.id)).toBe(true)

    await service.deactivateSupplier(draft.id)
    await service.archiveSupplier(draft.id)
    const restored = await service.restoreSupplier(draft.id)
    expect(restored.status).toBe('active')

    const history = await service.listHistory(draft.id)
    expect(history.length).toBeGreaterThan(3)

    const drained = events.drain()
    expect(drained.some((e) => e.type === 'SupplierCreated')).toBe(true)
    expect(drained.some((e) => e.type === 'SupplierContactAdded')).toBe(true)
    expect(drained.some((e) => e.type === 'SupplierAddressAdded')).toBe(true)
    expect(drained.some((e) => e.type === 'SupplierArchived')).toBe(true)
  })

  it('rejects person-type change attempts via update (not in input) and perms', async () => {
    const { service } = app(['suppliers.read'])
    await expect(
      service.createSupplier({
        personType: 'PJ',
        legalName: 'ACME',
        document: '11444777000161',
        activate: true,
      }),
    ).rejects.toThrow(/permission/)
  })

  it('requires document to activate', async () => {
    const { service } = app()
    const c = await service.createSupplier({
      personType: 'PJ',
      legalName: 'Sem Doc',
      activate: false,
    })
    await expect(service.activateSupplier(c.id)).rejects.toThrow(/validation/)
  })

  it('isolates organizations in memory search', async () => {
    const repos = createMemorySupplierRepos()
    const a = createSupplierService({
      organizationId: 'org_a',
      userId: 'u',
      can: () => true,
      clock: { nowIso: () => new Date().toISOString() },
      ids: { next: () => crypto.randomUUID() },
      events: createInMemorySupplierEventCollector(),
      ...repos,
    })
    const b = createSupplierService({
      organizationId: 'org_b',
      userId: 'u',
      can: () => true,
      clock: { nowIso: () => new Date().toISOString() },
      ids: { next: () => crypto.randomUUID() },
      events: createInMemorySupplierEventCollector(),
      ...repos,
    })
    await a.createSupplier({
      personType: 'PF',
      legalName: 'Only A',
      document: '52998224725',
      activate: true,
    })
    const hits = await b.searchSuppliers({ q: 'Only' })
    expect(hits).toHaveLength(0)
  })
})
