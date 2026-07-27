import { createServerFn } from '@tanstack/react-start'
import type { CommandCenterSnapshot } from '#/modules/command-center/domain/types'
import type { PermissionKey } from '@rescript/permissions'
import type { SupabaseCommandCenterReadClient } from '#/modules/command-center/infrastructure/index.server'

export type CommandCenterRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

async function createServerCommandCenterApp(organizationId: string) {
  const {
    can: canCheck,
    isRolePreset,
    permissionsForRole,
  } = await import('@rescript/permissions')
  const { createCommandCenterService } = await import(
    '#/modules/command-center/application/command-center-service'
  )
  const { createServerSupabaseClient } = await import(
    '#/lib/supabase/server.server'
  )
  const { createSupabaseCommandCenterReadRepository } = await import(
    '#/modules/command-center/infrastructure/index.server'
  )

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
  const read = createSupabaseCommandCenterReadRepository({
    client: client as unknown as SupabaseCommandCenterReadClient,
    organizationId,
  })

  return createCommandCenterService({ can, read })
}

function rpcError(error: unknown) {
  const raw = error instanceof Error ? error.message : 'command_center_error'
  if (raw.includes('permission_denied')) {
    return {
      code: 'permission_denied',
      message: 'Você não tem permissão para acessar o Centro de Comando.',
    }
  }
  if (raw.includes('not_authenticated')) {
    return {
      code: 'not_authenticated',
      message: 'Faça login para acessar o Centro de Comando.',
    }
  }
  if (raw.includes('not_org_member')) {
    return {
      code: 'not_org_member',
      message: 'Você não participa desta organização.',
    }
  }
  return {
    code: raw,
    message: 'Não foi possível carregar o Centro de Comando.',
  }
}

async function runCommandCenterRpc<T>(
  organizationId: string,
  run: (
    app: Awaited<ReturnType<typeof createServerCommandCenterApp>>,
  ) => Promise<T>,
): Promise<CommandCenterRpcResult<T>> {
  try {
    const app = await createServerCommandCenterApp(organizationId)
    return { ok: true, data: await run(app) }
  } catch (error) {
    return { ok: false, error: rpcError(error) }
  }
}

export const getCommandCenter = createServerFn({ method: 'POST' })
  .validator((data: { organizationId: string }) => data)
  .handler(({ data }): Promise<CommandCenterRpcResult<CommandCenterSnapshot>> =>
    runCommandCenterRpc(data.organizationId, (app) => app.getOverview()),
  )
