// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { createCustomerService } from '#/modules/customers/application/customer-service'
import { createInMemoryCustomerEventCollector } from '#/modules/customers/domain/events'
import { createSupabaseCustomerRepos } from '#/modules/customers/infrastructure/create-supabase-customer-repos'
import {
  afterAllCatalogPersistence,
  createCatalogPersistenceFixture,
  isLocalSupabaseAvailable,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'
import { can, permissionsForRole } from '@rescript/permissions'

const available = await isLocalSupabaseAvailable()

describe.skipIf(!available)('customer aggregate (local Supabase)', () => {
  afterAll(async () => {
    await afterAllCatalogPersistence()
  })

  it(
    'persists lifecycle, contacts, addresses, search and isolates tenants',
    async () => {
    const orgA = await createCatalogPersistenceFixture('cust-a')
    const orgB = await createCatalogPersistenceFixture('cust-b')
    try {
      const grants = permissionsForRole('manager')
      const reposA = await createSupabaseCustomerRepos({
        client: orgA.client,
        organizationId: orgA.organizationId,
        actorUserId: orgA.userId,
      })
      const appA = createCustomerService({
        organizationId: orgA.organizationId,
        userId: orgA.userId,
        can: (key) => can(grants, key),
        clock: { nowIso: () => new Date().toISOString() },
        ids: { next: () => crypto.randomUUID() },
        events: createInMemoryCustomerEventCollector(),
        customers: reposA.customers,
        search: reposA.search,
        contacts: reposA.contacts,
        addresses: reposA.addresses,
        history: reposA.history,
      })

      const customer = await appA.createCustomer({
        personType: 'PJ',
        legalName: 'Rescript Comércio LTDA',
        tradeName: 'Rescript',
        document: '11444777000161',
        email: 'ops@rescript.test',
        activate: true,
      })
      expect(customer.status).toBe('active')

      await appA.createContact({
        customerId: customer.id,
        name: 'Financeiro',
        email: 'fin@rescript.test',
        isPrimary: true,
      })
      await appA.createAddress({
        customerId: customer.id,
        kind: 'shipping',
        postalCode: '01310100',
        street: 'Av Paulista',
        number: '1000',
        city: 'São Paulo',
        state: 'SP',
        isPrimary: true,
      })

      const search = await appA.searchCustomers({ q: '11444777000161' })
      expect(search.some((x) => x.id === customer.id)).toBe(true)

      await appA.archiveCustomer(customer.id)
      const restored = await appA.restoreCustomer(customer.id)
      expect(restored.status).toBe('active')

      const history = await appA.listHistory(customer.id)
      expect(history.some((h) => h.action === 'customer.created')).toBe(true)

      const reposB = await createSupabaseCustomerRepos({
        client: orgB.client,
        organizationId: orgB.organizationId,
        actorUserId: orgB.userId,
      })
      const appB = createCustomerService({
        organizationId: orgB.organizationId,
        userId: orgB.userId,
        can: (key) => can(permissionsForRole('manager'), key),
        clock: { nowIso: () => new Date().toISOString() },
        ids: { next: () => crypto.randomUUID() },
        events: createInMemoryCustomerEventCollector(),
        customers: reposB.customers,
        search: reposB.search,
        contacts: reposB.contacts,
        addresses: reposB.addresses,
        history: reposB.history,
      })
      await expect(appB.getCustomer(customer.id)).rejects.toThrow(/not_found/)
      const cross = await appB.searchCustomers({ q: 'Rescript' })
      expect(cross).toHaveLength(0)
    } finally {
      await orgA.cleanup()
      await orgB.cleanup()
    }
  },
    30_000,
  )
})
