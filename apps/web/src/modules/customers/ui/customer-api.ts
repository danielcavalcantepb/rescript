import { createServerFn } from '@tanstack/react-start'
import type {
  CreateAddressInput,
  CreateContactInput,
  CreateCustomerInput,
  CustomerRpcResult,
  ListCustomersQuery,
  SearchCustomersQuery,
  UpdateAddressInput,
  UpdateContactInput,
  UpdateCustomerInput,
} from '#/modules/customers/ui/api/contracts'
import { toCustomerRpcError } from '#/modules/customers/ui/errors/customer-rpc-errors'

/**
 * Customer Aggregate UI → Application RPC bridge.
 * organizationId from the client is a membership selection claim only.
 */
async function createServerCustomerApp(organizationId: string) {
  const {
    can: canCheck,
    isRolePreset,
    permissionsForRole,
  } = await import('@rescript/permissions')
  const { createCustomerService } = await import(
    '#/modules/customers/application/customer-service'
  )
  const { createInMemoryCustomerEventCollector } = await import(
    '#/modules/customers/domain/events'
  )
  const { createServerSupabaseClient } = await import(
    '#/lib/supabase/server.server'
  )
  const { createSupabaseCustomerRepos } = await import(
    '#/modules/customers/infrastructure/index.server'
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
  const repos = await createSupabaseCustomerRepos({
    client,
    actorUserId: user.id,
    organizationId,
  })

  return createCustomerService({
    organizationId: repos.organizationId,
    userId: repos.actorUserId,
    can,
    ids: { next: () => crypto.randomUUID() },
    clock: { nowIso: () => new Date().toISOString() },
    events: createInMemoryCustomerEventCollector(),
    customers: repos.customers,
    search: repos.search,
    contacts: repos.contacts,
    addresses: repos.addresses,
    history: repos.history,
  })
}

async function runCustomerRpc<T>(
  organizationId: string,
  run: (
    app: Awaited<ReturnType<typeof createServerCustomerApp>>,
  ) => Promise<T>,
): Promise<CustomerRpcResult<T>> {
  try {
    const app = await createServerCustomerApp(organizationId)
    return { ok: true, data: await run(app) }
  } catch (error) {
    return { ok: false, error: toCustomerRpcError(error) }
  }
}

export const customerList = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; query: ListCustomersQuery }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) => app.listCustomers(data.query)),
  )

export const customerSearch = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; query: SearchCustomersQuery }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) => app.searchCustomers(data.query)),
  )

export const customerGet = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; customerId: string }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) => app.getCustomer(data.customerId)),
  )

export const customerGetSnapshot = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; customerId: string }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) =>
      app.getCustomerSnapshot(data.customerId),
    ),
  )

export const customerCreate = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; input: CreateCustomerInput }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) => app.createCustomer(data.input)),
  )

export const customerUpdate = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      customerId: string
      input: UpdateCustomerInput
    }) => data,
  )
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) =>
      app.updateCustomer(data.customerId, data.input),
    ),
  )

export const customerActivate = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; customerId: string }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) =>
      app.activateCustomer(data.customerId),
    ),
  )

export const customerDeactivate = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; customerId: string }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) =>
      app.deactivateCustomer(data.customerId),
    ),
  )

export const customerArchive = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; customerId: string }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) =>
      app.archiveCustomer(data.customerId),
    ),
  )

export const customerRestore = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; customerId: string }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) =>
      app.restoreCustomer(data.customerId),
    ),
  )

export const customerListContacts = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; customerId: string }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) =>
      app.listContacts(data.customerId),
    ),
  )

export const customerCreateContact = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; input: CreateContactInput }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) => app.createContact(data.input)),
  )

export const customerUpdateContact = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      contactId: string
      input: UpdateContactInput
    }) => data,
  )
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) =>
      app.updateContact(data.contactId, data.input),
    ),
  )

export const customerRemoveContact = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; contactId: string }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) =>
      app.removeContact(data.contactId),
    ),
  )

export const customerListAddresses = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; customerId: string }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) =>
      app.listAddresses(data.customerId),
    ),
  )

export const customerCreateAddress = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; input: CreateAddressInput }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) => app.createAddress(data.input)),
  )

export const customerUpdateAddress = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      addressId: string
      input: UpdateAddressInput
    }) => data,
  )
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) =>
      app.updateAddress(data.addressId, data.input),
    ),
  )

export const customerRemoveAddress = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; addressId: string }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) =>
      app.removeAddress(data.addressId),
    ),
  )

export const customerListHistory = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; customerId: string }) => data)
  .handler(({ data }) =>
    runCustomerRpc(data.organizationId, (app) =>
      app.listHistory(data.customerId),
    ),
  )
