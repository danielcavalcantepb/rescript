import { createServerFn } from '@tanstack/react-start'
import type {
  CreatePayableInput,
  ListPayablesQuery,
  PayableRpcResult,
  SearchPayablesQuery,
  UpdatePayableInput,
} from '#/modules/payable/ui/api/contracts'
import { toPayableRpcError } from '#/modules/payable/ui/errors/payable-rpc-errors'

/**
 * Accounts Payable Aggregate UI → Application RPC bridge.
 * organizationId from the client is a membership selection claim only.
 */
async function createServerPayableApp(organizationId: string) {
  const {
    can: canCheck,
    isRolePreset,
    permissionsForRole,
  } = await import('@rescript/permissions')
  const { createPayableService } = await import(
    '#/modules/payable/application/payable-service'
  )
  const { createInMemoryPayableEventCollector } = await import(
    '#/modules/payable/domain/events'
  )
  const { createServerSupabaseClient } = await import(
    '#/lib/supabase/server.server'
  )
  const { createSupabasePayableRepos } = await import(
    '#/modules/payable/infrastructure/index.server'
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
  const repos = await createSupabasePayableRepos({
    client,
    actorUserId: user.id,
    organizationId,
  })

  return createPayableService({
    organizationId: repos.organizationId,
    userId: repos.actorUserId,
    can,
    ids: { next: () => crypto.randomUUID() },
    clock: { nowIso: () => new Date().toISOString() },
    events: createInMemoryPayableEventCollector(),
    numbers: repos.numbers,
    origins: repos.origins,
    payables: repos.payables,
    installments: repos.installments,
    search: repos.search,
    history: repos.history,
  })
}

async function runPayableRpc<T>(
  organizationId: string,
  run: (
    app: Awaited<ReturnType<typeof createServerPayableApp>>,
  ) => Promise<T>,
): Promise<PayableRpcResult<T>> {
  try {
    const app = await createServerPayableApp(organizationId)
    return { ok: true, data: await run(app) }
  } catch (error) {
    return { ok: false, error: toPayableRpcError(error) }
  }
}

export const payableList = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; query: ListPayablesQuery }) => data)
  .handler(({ data }) =>
    runPayableRpc(data.organizationId, (app) => app.listPayables(data.query)),
  )

export const payableSearch = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; query: SearchPayablesQuery }) => data)
  .handler(({ data }) =>
    runPayableRpc(data.organizationId, (app) => app.searchPayables(data.query)),
  )

export const payableGet = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { organizationId: string; accountsPayableId: string }) => data,
  )
  .handler(({ data }) =>
    runPayableRpc(data.organizationId, (app) =>
      app.getPayable(data.accountsPayableId),
    ),
  )

export const payableGetSnapshot = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { organizationId: string; accountsPayableId: string }) => data,
  )
  .handler(({ data }) =>
    runPayableRpc(data.organizationId, (app) =>
      app.getPayableSnapshot(data.accountsPayableId),
    ),
  )

export const payableCreate = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { organizationId: string; input: CreatePayableInput }) => data,
  )
  .handler(({ data }) =>
    runPayableRpc(data.organizationId, (app) => app.createPayable(data.input)),
  )

export const payableUpdate = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      accountsPayableId: string
      input: UpdatePayableInput
    }) => data,
  )
  .handler(({ data }) =>
    runPayableRpc(data.organizationId, (app) =>
      app.updatePayable(data.accountsPayableId, data.input),
    ),
  )

export const payableApprove = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { organizationId: string; accountsPayableId: string }) => data,
  )
  .handler(({ data }) =>
    runPayableRpc(data.organizationId, (app) =>
      app.approvePayable(data.accountsPayableId),
    ),
  )

export const payableCancel = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      organizationId: string
      accountsPayableId: string
      reason?: string | null
    }) => data,
  )
  .handler(({ data }) =>
    runPayableRpc(data.organizationId, (app) =>
      app.cancelPayable(data.accountsPayableId, data.reason),
    ),
  )

export const payableArchive = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { organizationId: string; accountsPayableId: string }) => data,
  )
  .handler(({ data }) =>
    runPayableRpc(data.organizationId, (app) =>
      app.archivePayable(data.accountsPayableId),
    ),
  )

export const payableRestore = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { organizationId: string; accountsPayableId: string }) => data,
  )
  .handler(({ data }) =>
    runPayableRpc(data.organizationId, (app) =>
      app.restorePayable(data.accountsPayableId),
    ),
  )

export const payableListInstallments = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { organizationId: string; accountsPayableId: string }) => data,
  )
  .handler(({ data }) =>
    runPayableRpc(data.organizationId, (app) =>
      app.listInstallments(data.accountsPayableId),
    ),
  )

export const payableListHistory = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { organizationId: string; accountsPayableId: string }) => data,
  )
  .handler(({ data }) =>
    runPayableRpc(data.organizationId, (app) =>
      app.listHistory(data.accountsPayableId),
    ),
  )
