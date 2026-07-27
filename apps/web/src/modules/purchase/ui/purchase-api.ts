import { createServerFn } from '@tanstack/react-start'
import type {
  AddPurchaseItemInput,
  CreatePurchaseInput,
  ListPurchasesQuery,
  SearchPurchasesQuery,
  UpdatePurchaseInput,
  UpdatePurchaseItemInput,
  PurchaseRpcResult,
} from '#/modules/purchase/ui/api/contracts'
import { toPurchaseRpcError } from '#/modules/purchase/ui/errors/purchase-rpc-errors'

/**
 * Purchase Aggregate UI → Application RPC bridge.
 * organizationId from the client is a membership selection claim only.
 */
async function createServerPurchaseApp(organizationId: string) {
  const {
    can: canCheck,
    isRolePreset,
    permissionsForRole,
  } = await import('@rescript/permissions')
  const { createPurchaseService } = await import(
    '#/modules/purchase/application/purchase-service'
  )
  const { createInMemoryPurchaseEventCollector } = await import(
    '#/modules/purchase/domain/events'
  )
  const { createServerSupabaseClient } = await import(
    '#/lib/supabase/server.server'
  )
  const { createSupabasePurchaseRepos } = await import(
    '#/modules/purchase/infrastructure/index.server'
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
  const repos = await createSupabasePurchaseRepos({
    client,
    actorUserId: user.id,
    organizationId,
  })

  return createPurchaseService({
    organizationId: repos.organizationId,
    userId: repos.actorUserId,
    can,
    ids: { next: () => crypto.randomUUID() },
    clock: { nowIso: () => new Date().toISOString() },
    events: createInMemoryPurchaseEventCollector(),
    numbers: repos.numbers,
    snapshots: repos.snapshots,
    purchases: repos.purchases,
    items: repos.items,
    search: repos.search,
    history: repos.history,
  })
}

async function runPurchaseRpc<T>(
  organizationId: string,
  run: (
    app: Awaited<ReturnType<typeof createServerPurchaseApp>>,
  ) => Promise<T>,
): Promise<PurchaseRpcResult<T>> {
  try {
    const app = await createServerPurchaseApp(organizationId)
    return { ok: true, data: await run(app) }
  } catch (error) {
    return { ok: false, error: toPurchaseRpcError(error) }
  }
}

export const purchaseList = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; query: ListPurchasesQuery }) => data)
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) => app.listPurchases(data.query)),
  )

export const purchaseSearch = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; query: SearchPurchasesQuery }) => data)
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) => app.searchPurchases(data.query)),
  )

export const purchaseGet = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; purchaseOrderId: string }) => data)
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) =>
      app.getPurchase(data.purchaseOrderId),
    ),
  )

export const purchaseGetSnapshot = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; purchaseOrderId: string }) => data)
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) =>
      app.getPurchaseSnapshot(data.purchaseOrderId),
    ),
  )

export const purchaseCreate = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; input: CreatePurchaseInput }) => data)
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) => app.createPurchase(data.input)),
  )

export const purchaseUpdate = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      purchaseOrderId: string
      input: UpdatePurchaseInput
    }) => data,
  )
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) =>
      app.updatePurchase(data.purchaseOrderId, data.input),
    ),
  )

export const purchaseApprove = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; purchaseOrderId: string }) => data)
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) =>
      app.approvePurchase(data.purchaseOrderId),
    ),
  )

export const purchaseCancel = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      purchaseOrderId: string
      reason?: string | null
    }) => data,
  )
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) =>
      app.cancelPurchase(data.purchaseOrderId, data.reason),
    ),
  )

export const purchaseArchive = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; purchaseOrderId: string }) => data)
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) =>
      app.archivePurchase(data.purchaseOrderId),
    ),
  )

export const purchaseRestore = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; purchaseOrderId: string }) => data)
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) =>
      app.restorePurchase(data.purchaseOrderId),
    ),
  )

export const purchaseListItems = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; purchaseOrderId: string }) => data)
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) =>
      app.listItems(data.purchaseOrderId),
    ),
  )

export const purchaseAddItem = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; input: AddPurchaseItemInput }) => data)
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) => app.addItem(data.input)),
  )

export const purchaseUpdateItem = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      itemId: string
      input: UpdatePurchaseItemInput
    }) => data,
  )
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) =>
      app.updateItem(data.itemId, data.input),
    ),
  )

export const purchaseRemoveItem = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; itemId: string }) => data)
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) => app.removeItem(data.itemId)),
  )

export const purchaseListHistory = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      purchaseOrderId: string
      limit?: number
    }) => data,
  )
  .handler(({ data }) =>
    runPurchaseRpc(data.organizationId, (app) =>
      app.listHistory(data.purchaseOrderId, data.limit),
    ),
  )
