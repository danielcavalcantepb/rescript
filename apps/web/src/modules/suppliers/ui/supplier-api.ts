import { createServerFn } from '@tanstack/react-start'
import type {
  CreateAddressInput,
  CreateContactInput,
  CreateSupplierInput,
  SupplierRpcResult,
  ListSuppliersQuery,
  SearchSuppliersQuery,
  UpdateAddressInput,
  UpdateContactInput,
  UpdateSupplierInput,
} from '#/modules/suppliers/ui/api/contracts'
import { toSupplierRpcError } from '#/modules/suppliers/ui/errors/supplier-rpc-errors'

/**
 * Supplier Aggregate UI → Application RPC bridge.
 * organizationId from the client is a membership selection claim only.
 */
async function createServerSupplierApp(organizationId: string) {
  const {
    can: canCheck,
    isRolePreset,
    permissionsForRole,
  } = await import('@rescript/permissions')
  const { createSupplierService } = await import(
    '#/modules/suppliers/application/supplier-service'
  )
  const { createInMemorySupplierEventCollector } = await import(
    '#/modules/suppliers/domain/events'
  )
  const { createServerSupabaseClient } = await import(
    '#/lib/supabase/server.server'
  )
  const { createSupabaseSupplierRepos } = await import(
    '#/modules/suppliers/infrastructure/index.server'
  )

  const client = createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser()
  if (userError || !user) throw new Error('not_authenticated')

  const { data: membership, error: membershipError } = await client
    .from('membership')
    .select('role, status')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membership || !isRolePreset(membership.role)) {
    throw new Error('not_org_member')
  }

  const grants = permissionsForRole(membership.role)
  const can = (key: Parameters<typeof canCheck>[1]) => canCheck(grants, key)
  const repos = await createSupabaseSupplierRepos({
    client,
    actorUserId: user.id,
    organizationId,
  })

  return createSupplierService({
    organizationId: repos.organizationId,
    userId: repos.actorUserId,
    can,
    ids: { next: () => crypto.randomUUID() },
    clock: { nowIso: () => new Date().toISOString() },
    events: createInMemorySupplierEventCollector(),
    suppliers: repos.suppliers,
    search: repos.search,
    contacts: repos.contacts,
    addresses: repos.addresses,
    history: repos.history,
  })
}

async function runSupplierRpc<T>(
  organizationId: string,
  run: (
    app: Awaited<ReturnType<typeof createServerSupplierApp>>,
  ) => Promise<T>,
): Promise<SupplierRpcResult<T>> {
  try {
    const app = await createServerSupplierApp(organizationId)
    return { ok: true, data: await run(app) }
  } catch (error) {
    return { ok: false, error: toSupplierRpcError(error) }
  }
}

export const supplierList = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; query: ListSuppliersQuery }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) => app.listSuppliers(data.query)),
  )

export const supplierSearch = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; query: SearchSuppliersQuery }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) => app.searchSuppliers(data.query)),
  )

export const supplierGet = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; supplierId: string }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) => app.getSupplier(data.supplierId)),
  )

export const supplierGetSnapshot = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; supplierId: string }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) =>
      app.getSupplierSnapshot(data.supplierId),
    ),
  )

export const supplierCreate = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; input: CreateSupplierInput }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) => app.createSupplier(data.input)),
  )

export const supplierUpdate = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      supplierId: string
      input: UpdateSupplierInput
    }) => data,
  )
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) =>
      app.updateSupplier(data.supplierId, data.input),
    ),
  )

export const supplierActivate = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; supplierId: string }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) =>
      app.activateSupplier(data.supplierId),
    ),
  )

export const supplierDeactivate = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; supplierId: string }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) =>
      app.deactivateSupplier(data.supplierId),
    ),
  )

export const supplierArchive = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; supplierId: string }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) =>
      app.archiveSupplier(data.supplierId),
    ),
  )

export const supplierRestore = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; supplierId: string }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) =>
      app.restoreSupplier(data.supplierId),
    ),
  )

export const supplierListContacts = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; supplierId: string }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) =>
      app.listContacts(data.supplierId),
    ),
  )

export const supplierCreateContact = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; input: CreateContactInput }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) => app.createContact(data.input)),
  )

export const supplierUpdateContact = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      contactId: string
      input: UpdateContactInput
    }) => data,
  )
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) =>
      app.updateContact(data.contactId, data.input),
    ),
  )

export const supplierRemoveContact = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; contactId: string }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) =>
      app.removeContact(data.contactId),
    ),
  )

export const supplierListAddresses = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; supplierId: string }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) =>
      app.listAddresses(data.supplierId),
    ),
  )

export const supplierCreateAddress = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; input: CreateAddressInput }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) => app.createAddress(data.input)),
  )

export const supplierUpdateAddress = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      addressId: string
      input: UpdateAddressInput
    }) => data,
  )
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) =>
      app.updateAddress(data.addressId, data.input),
    ),
  )

export const supplierRemoveAddress = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; addressId: string }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) =>
      app.removeAddress(data.addressId),
    ),
  )

export const supplierListHistory = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; supplierId: string }) => data)
  .handler(({ data }) =>
    runSupplierRpc(data.organizationId, (app) =>
      app.listHistory(data.supplierId),
    ),
  )
