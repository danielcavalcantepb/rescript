import { createServerFn } from '@tanstack/react-start'
import type { PermissionKey } from '@rescript/permissions'
import type { AnalyticsFilters, AnalyticsWorkspaceSnapshot } from '../domain/types'
import type { SupabaseAnalyticsReadClient } from '../infrastructure/index.server'

export type AnalyticsRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

export type AnalyticsRequest = {
  organizationId: string
  filters: AnalyticsFilters
}

async function createServerAnalyticsApp(organizationId: string) {
  const { can: canCheck, isRolePreset, permissionsForRole } = await import('@rescript/permissions')
  const { createAnalyticsService } = await import('../application/analytics-service')
  const { createServerSupabaseClient } = await import('#/lib/supabase/server.server')
  const { createSupabaseAnalyticsProvider } = await import('../infrastructure/index.server')

  const client = createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser()
  if (userError || !user) throw new Error('not_authenticated')

  const { data: membership, error: membershipError } = await client
    .from('membership')
    .select('role,status')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membership || !isRolePreset(membership.role)) {
    throw new Error('not_org_member')
  }

  const grants = permissionsForRole(membership.role)
  const can = (permission: PermissionKey) => canCheck(grants, permission)
  const provider = createSupabaseAnalyticsProvider({
    client: client as unknown as SupabaseAnalyticsReadClient,
    organizationId,
  })

  return createAnalyticsService({ can, provider })
}

function rpcError(error: unknown) {
  const raw = error instanceof Error ? error.message : 'analytics_error'
  if (raw.includes('permission_denied')) {
    return { code: 'permission_denied', message: 'Você não tem permissão para acessar Métricas.' }
  }
  if (raw.includes('not_authenticated')) {
    return { code: 'not_authenticated', message: 'Faça login para acessar Métricas.' }
  }
  if (raw.includes('not_org_member')) {
    return { code: 'not_org_member', message: 'Você não participa desta organização.' }
  }
  return { code: raw, message: 'Não foi possível carregar as Métricas.' }
}

async function runAnalyticsRpc<T>(
  request: AnalyticsRequest,
  run: (app: Awaited<ReturnType<typeof createServerAnalyticsApp>>) => Promise<T>,
): Promise<AnalyticsRpcResult<T>> {
  try {
    const app = await createServerAnalyticsApp(request.organizationId)
    return { ok: true, data: await run(app) }
  } catch (error) {
    return { ok: false, error: rpcError(error) }
  }
}

export const getAnalyticsWorkspace = createServerFn({ method: 'POST' })
  .inputValidator((data: AnalyticsRequest) => data)
  .handler(({ data }): Promise<AnalyticsRpcResult<AnalyticsWorkspaceSnapshot>> =>
    runAnalyticsRpc(data, (app) => app.getWorkspace(data)),
  )

type AnalyticsReadModelInput = {
  organizationId: string
  from: string
  to: string
  branchId?: string
}

type AnalyticsRpcClient = { rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }> }

async function analyticsReadClient(organizationId: string): Promise<AnalyticsRpcClient> {
  const { can, isRolePreset, permissionsForRole } = await import('@rescript/permissions')
  const { createServerSupabaseClient } = await import('#/lib/supabase/server.server')
  const client = createServerSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('not_authenticated')
  const { data: membership } = await client.from('membership').select('role,status')
    .eq('organization_id', organizationId).eq('user_id', user.id).eq('status', 'active').maybeSingle()
  if (!membership || !isRolePreset(membership.role) || !can(permissionsForRole(membership.role), 'analytics.view')) throw new Error('permission_denied')
  return client as unknown as AnalyticsRpcClient
}

async function analyticsRead<T extends Json>(organizationId: string, name: string, args: Record<string, unknown>): Promise<AnalyticsRpcResult<T>> {
  try {
    const client = await analyticsReadClient(organizationId)
    const { data, error } = await client.rpc(name, args)
    if (error) throw new Error(error.message)
    return { ok: true, data: data as T }
  } catch (error) {
    return { ok: false, error: rpcError(error) }
  }
}

export const getAnalyticsKpis = createServerFn({ method: 'POST' })
  .inputValidator((data: AnalyticsReadModelInput) => data)
  .handler(({ data }) => analyticsRead<{ [key: string]: Json }>(data.organizationId, 'get_analytics_kpis', {
    p_org: data.organizationId, p_from: data.from, p_to: data.to, p_branch: data.branchId ?? null,
  }))

export const getAnalyticsRanking = createServerFn({ method: 'POST' })
  .inputValidator((data: AnalyticsReadModelInput & { dimension: 'product' | 'customer' | 'brand' | 'category' | 'seller' | 'payment_term'; limit?: number }) => data)
  .handler(({ data }) => analyticsRead<Json[]>(data.organizationId, 'get_analytics_ranking', {
    p_org: data.organizationId, p_dimension: data.dimension, p_from: data.from, p_to: data.to,
    p_branch: data.branchId ?? null, p_limit: data.limit ?? 10,
  }))

export const getAnalyticsTimeSeries = createServerFn({ method: 'POST' })
  .inputValidator((data: AnalyticsReadModelInput & { grain: 'day' | 'week' | 'month' | 'quarter' | 'year' }) => data)
  .handler(({ data }) => analyticsRead<Json[]>(data.organizationId, 'get_analytics_time_series', {
    p_org: data.organizationId, p_from: data.from, p_to: data.to, p_branch: data.branchId ?? null, p_grain: data.grain,
  }))

export const getAnalyticsOperationalFeed = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; branchId?: string; limit?: number }) => data)
  .handler(({ data }) => analyticsRead<{ [key: string]: Json }>(data.organizationId, 'get_analytics_operational_feed', {
    p_org: data.organizationId, p_branch: data.branchId ?? null, p_limit: data.limit ?? 5,
  }))
