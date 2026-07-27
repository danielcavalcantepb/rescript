import { createServerFn } from '@tanstack/react-start'
import type { PermissionKey } from '@rescript/permissions'
import type { AnalyticsFilters, AnalyticsWorkspaceSnapshot } from '../domain/types'
import type { SupabaseAnalyticsReadClient } from '../infrastructure/index.server'

export type AnalyticsRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

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
