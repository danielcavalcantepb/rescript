// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { createSupplierService } from '#/modules/suppliers/application/supplier-service'
import { createInMemorySupplierEventCollector } from '#/modules/suppliers/domain/events'
import { createSupabaseSupplierRepos } from '#/modules/suppliers/infrastructure/create-supabase-supplier-repos'
import {
  afterAllCatalogPersistence,
  createCatalogPersistenceFixture,
  isLocalSupabaseAvailable,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'
import { can, permissionsForRole } from '@rescript/permissions'

const available = await isLocalSupabaseAvailable()

describe.skipIf(!available)('supplier aggregate (local Supabase)', () => {
  afterAll(async () => {
    await afterAllCatalogPersistence()
  })

  it(
    'persists lifecycle, contacts, addresses, search and isolates tenants',
    async () => {
    const orgA = await createCatalogPersistenceFixture('sup-a')
    const orgB = await createCatalogPersistenceFixture('sup-b')
    try {
      const grants = permissionsForRole('manager')
      const reposA = await createSupabaseSupplierRepos({
        client: orgA.client,
        organizationId: orgA.organizationId,
        actorUserId: orgA.userId,
      })
      const appA = createSupplierService({
        organizationId: orgA.organizationId,
        userId: orgA.userId,
        can: (key) => can(grants, key),
        clock: { nowIso: () => new Date().toISOString() },
        ids: { next: () => crypto.randomUUID() },
        events: createInMemorySupplierEventCollector(),
        suppliers: reposA.suppliers,
        search: reposA.search,
        contacts: reposA.contacts,
        addresses: reposA.addresses,
        history: reposA.history,
      })

      const supplier = await appA.createSupplier({
        personType: 'PJ',
        legalName: 'Rescript Comércio LTDA',
        tradeName: 'Rescript',
        document: '11444777000161',
        email: 'ops@rescript.test',
        activate: true,
      })
      expect(supplier.status).toBe('active')

      await appA.createContact({
        supplierId: supplier.id,
        name: 'Financeiro',
        email: 'fin@rescript.test',
        isPrimary: true,
      })
      await appA.createAddress({
        supplierId: supplier.id,
        kind: 'shipping',
        postalCode: '01310100',
        street: 'Av Paulista',
        number: '1000',
        city: 'São Paulo',
        state: 'SP',
        isPrimary: true,
      })

      const search = await appA.searchSuppliers({ q: '11444777000161' })
      expect(search.some((x) => x.id === supplier.id)).toBe(true)

      await appA.archiveSupplier(supplier.id)
      const restored = await appA.restoreSupplier(supplier.id)
      expect(restored.status).toBe('active')

      const history = await appA.listHistory(supplier.id)
      expect(history.some((h) => h.action === 'supplier.created')).toBe(true)

      const reposB = await createSupabaseSupplierRepos({
        client: orgB.client,
        organizationId: orgB.organizationId,
        actorUserId: orgB.userId,
      })
      const appB = createSupplierService({
        organizationId: orgB.organizationId,
        userId: orgB.userId,
        can: (key) => can(permissionsForRole('manager'), key),
        clock: { nowIso: () => new Date().toISOString() },
        ids: { next: () => crypto.randomUUID() },
        events: createInMemorySupplierEventCollector(),
        suppliers: reposB.suppliers,
        search: reposB.search,
        contacts: reposB.contacts,
        addresses: reposB.addresses,
        history: reposB.history,
      })
      await expect(appB.getSupplier(supplier.id)).rejects.toThrow(/not_found/)
      const cross = await appB.searchSuppliers({ q: 'Rescript' })
      expect(cross).toHaveLength(0)
    } finally {
      await orgA.cleanup()
      await orgB.cleanup()
    }
  },
    30_000,
  )
})
