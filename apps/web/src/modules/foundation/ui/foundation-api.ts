import { createServerFn } from '@tanstack/react-start'
import type { PermissionKey } from '@rescript/permissions'
import { validateInventoryPolicy, validatePaymentTerm, type InventoryPolicy, type PaymentTermInstallmentInput, type PaymentTermKind } from '../domain/contracts'

type Client = { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> }

async function clientFor(organizationId: string, permission: PermissionKey): Promise<Client> {
  const { can, isRolePreset, permissionsForRole } = await import('@rescript/permissions')
  const { createServerSupabaseClient } = await import('#/lib/supabase/server.server')
  const client = createServerSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('not_authenticated')
  const { data: membership } = await client.from('membership').select('role,status').eq('organization_id', organizationId).eq('user_id', user.id).eq('status', 'active').maybeSingle()
  if (!membership || !isRolePreset(membership.role) || !can(permissionsForRole(membership.role), permission)) throw new Error('permission_denied')
  return client as unknown as Client
}

async function rpc<T>(client: Client, name: string, args: Record<string, unknown>) {
  const { data, error } = await client.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const createBranch = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; code: string; name: string }) => data)
  .handler(async ({ data }) => rpc<string>(await clientFor(data.organizationId, 'branches.manage'), 'create_branch', { p_org: data.organizationId, p_code: data.code, p_name: data.name }))

export const archiveBranch = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; branchId: string }) => data)
  .handler(async ({ data }) => rpc<void>(await clientFor(data.organizationId, 'branches.manage'), 'archive_branch', { p_org: data.organizationId, p_branch: data.branchId }))

export const createPaymentTerm = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; code: string; name: string; kind: PaymentTermKind; installments: PaymentTermInstallmentInput[]; isDefault?: boolean }) => data)
  .handler(async ({ data }) => {
    validatePaymentTerm(data.kind, data.installments)
    return rpc<string>(await clientFor(data.organizationId, 'payment_terms.manage'), 'create_payment_term', {
      p_org: data.organizationId, p_code: data.code, p_name: data.name, p_kind: data.kind, p_installments: data.installments.map(({ percentage, dueDays }) => ({ percentage, dueDays })), p_is_default: data.isDefault ?? false,
    })
  })

export const updateInventoryPolicy = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string; policy: InventoryPolicy }) => data)
  .handler(async ({ data }) => {
    validateInventoryPolicy(data.policy)
    const policy = data.policy
    return rpc<void>(await clientFor(data.organizationId, 'inventory.policy.manage'), 'upsert_inventory_policy', {
      p_org: data.organizationId,
      p_allow_negative: policy.allowNegativeStock,
      p_auto_reservation: policy.automaticReservation,
      p_auto_decrease: policy.automaticStockDecrease,
      p_allow_without_stock: policy.allowConfirmationWithoutStock,
      p_allow_partial: policy.allowPartialReservation,
    })
  })

export const getInventoryPolicy = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string }) => data)
  .handler(async ({ data }) => rpc<InventoryPolicy>(await clientFor(data.organizationId, 'inventory.policy.read'), 'get_inventory_policy', { p_org: data.organizationId }))
