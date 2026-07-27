import { createServerFn } from '@tanstack/react-start'
import type {
  CreateReceiptInput,
  ListReceiptsQuery,
  PostReceiptInput,
  ReceivingRpcResult,
  SearchReceiptsQuery,
  UpdateReceiptItemInput,
} from '#/modules/receiving/ui/api/contracts'
import { toReceivingRpcError } from '#/modules/receiving/ui/errors/receiving-rpc-errors'

/**
 * Receiving Aggregate UI → Application RPC bridge.
 * organizationId from the client is a membership selection claim only.
 */
async function createServerReceivingApp(organizationId: string) {
  const {
    can: canCheck,
    isRolePreset,
    permissionsForRole,
  } = await import('@rescript/permissions')
  const { createReceivingService } = await import(
    '#/modules/receiving/application/receiving-service'
  )
  const { createInMemoryReceivingEventCollector } = await import(
    '#/modules/receiving/domain/events'
  )
  const { createServerSupabaseClient } = await import(
    '#/lib/supabase/server.server'
  )
  const { createSupabaseReceivingRepos } = await import(
    '#/modules/receiving/infrastructure/index.server'
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
  const repos = await createSupabaseReceivingRepos({
    client,
    actorUserId: user.id,
    organizationId,
  })

  return createReceivingService({
    organizationId: repos.organizationId,
    userId: repos.actorUserId,
    can,
    ids: { next: () => crypto.randomUUID() },
    clock: { nowIso: () => new Date().toISOString() },
    events: createInMemoryReceivingEventCollector(),
    numbers: repos.numbers,
    purchases: repos.purchases,
    receipts: repos.receipts,
    items: repos.items,
    search: repos.search,
    history: repos.history,
    poster: repos.poster,
  })
}

async function runReceivingRpc<T>(
  organizationId: string,
  run: (
    app: Awaited<ReturnType<typeof createServerReceivingApp>>,
  ) => Promise<T>,
): Promise<ReceivingRpcResult<T>> {
  try {
    const app = await createServerReceivingApp(organizationId)
    return { ok: true, data: await run(app) }
  } catch (error) {
    return { ok: false, error: toReceivingRpcError(error) }
  }
}

export const receivingList = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; query: ListReceiptsQuery }) => data)
  .handler(({ data }) =>
    runReceivingRpc(data.organizationId, (app) => app.listReceipts(data.query)),
  )

export const receivingSearch = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; query: SearchReceiptsQuery }) => data)
  .handler(({ data }) =>
    runReceivingRpc(data.organizationId, (app) => app.searchReceipts(data.query)),
  )

export const receivingGet = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; goodsReceiptId: string }) => data)
  .handler(({ data }) =>
    runReceivingRpc(data.organizationId, (app) => app.getReceipt(data.goodsReceiptId)),
  )

export const receivingGetSnapshot = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; goodsReceiptId: string }) => data)
  .handler(({ data }) =>
    runReceivingRpc(data.organizationId, (app) =>
      app.getReceiptSnapshot(data.goodsReceiptId),
    ),
  )

export const receivingCreate = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; input: CreateReceiptInput }) => data)
  .handler(({ data }) =>
    runReceivingRpc(data.organizationId, (app) => app.createReceipt(data.input)),
  )

export const receivingUpdateItem = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      itemId: string
      input: UpdateReceiptItemInput
    }) => data,
  )
  .handler(({ data }) =>
    runReceivingRpc(data.organizationId, (app) =>
      app.updateReceiptItem(data.itemId, data.input),
    ),
  )

export const receivingReceivePartial = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      goodsReceiptId: string
      lines: Array<{ itemId: string; receivedQuantity: string }>
    }) => data,
  )
  .handler(({ data }) =>
    runReceivingRpc(data.organizationId, (app) =>
      app.receivePartial(data.goodsReceiptId, data.lines),
    ),
  )

export const receivingReceiveComplete = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; goodsReceiptId: string }) => data)
  .handler(({ data }) =>
    runReceivingRpc(data.organizationId, (app) =>
      app.receiveComplete(data.goodsReceiptId),
    ),
  )

export const receivingPost = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      input: PostReceiptInput
    }) => data,
  )
  .handler(({ data }) =>
    runReceivingRpc(data.organizationId, (app) => app.postReceipt(data.input)),
  )

export const receivingCancel = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; goodsReceiptId: string }) => data)
  .handler(({ data }) =>
    runReceivingRpc(data.organizationId, (app) =>
      app.cancelReceipt(data.goodsReceiptId),
    ),
  )

export const receivingArchive = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; goodsReceiptId: string }) => data)
  .handler(({ data }) =>
    runReceivingRpc(data.organizationId, (app) =>
      app.archiveReceipt(data.goodsReceiptId),
    ),
  )

export const receivingRestore = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; goodsReceiptId: string }) => data)
  .handler(({ data }) =>
    runReceivingRpc(data.organizationId, (app) =>
      app.restoreReceipt(data.goodsReceiptId),
    ),
  )

export const receivingListHistory = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      goodsReceiptId: string
      limit?: number
    }) => data,
  )
  .handler(({ data }) =>
    runReceivingRpc(data.organizationId, (app) =>
      app.listHistory(data.goodsReceiptId, data.limit),
    ),
  )
