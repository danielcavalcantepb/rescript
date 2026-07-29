import { createServerFn } from '@tanstack/react-start'
import type { PermissionKey } from '@rescript/permissions'
import type { PaymentTermInstallmentInput, PaymentTermKind } from '#/modules/foundation/domain/contracts'
import { validatePaymentTerm } from '#/modules/foundation/domain/contracts'

export type CommercialRpcResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }
type Client = {
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>
}

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

async function run<T>(operation: () => Promise<T>): Promise<CommercialRpcResult<T>> {
  try { return { ok: true, data: await operation() } } catch (error) {
    const code = error instanceof Error ? error.message : 'commercial_configuration_error'
    return { ok: false, error: { code, message: code.includes('permission') ? 'Você não tem permissão para esta configuração.' : 'Não foi possível concluir a configuração comercial.' } }
  }
}

export type SellerOption = { id: string; fullName: string; shortName: string; branchId: string | null; userId: string | null; status: string }
export type SellerManagementOption = SellerOption & { commissionRate: string; salaryAmount: string; bonusAmount: string; bonusTargetPercentage: string }
export type PaymentMethodOption = { id: string; code: string; name: string; kind: string; isDefault: boolean }
export type PaymentTermOption = { id: string; code: string; name: string; kind: string; isDefault: boolean }
export type SellerMemberOption = { userId: string; role: string }

export const listCommercialSellers = createServerFn({ method: 'POST' }).inputValidator((data: { organizationId: string }) => data).handler(({ data }) => run(async () => {
  const rows = await rpc<Array<Record<string, unknown>>>(await clientFor(data.organizationId, 'sellers.read'), 'list_sellers', { p_org: data.organizationId })
  return rows.map((row) => ({ id: String(row.id), fullName: String(row.full_name), shortName: String(row.short_name), branchId: row.branch_id == null ? null : String(row.branch_id), userId: row.user_id == null ? null : String(row.user_id), status: String(row.status) })) satisfies SellerOption[]
}))

export const listCommercialSellersForManagement = createServerFn({ method: 'POST' }).inputValidator((data: { organizationId: string }) => data).handler(({ data }) => run(async () => {
  const rows = await rpc<Array<Record<string, unknown>>>(await clientFor(data.organizationId, 'sellers.manage'), 'list_sellers_for_management', { p_org: data.organizationId })
  return rows.map((row) => ({
    id: String(row.id), fullName: String(row.full_name), shortName: String(row.short_name),
    branchId: row.branch_id == null ? null : String(row.branch_id), userId: row.user_id == null ? null : String(row.user_id), status: String(row.status),
    commissionRate: String(row.commission_rate ?? '0'), salaryAmount: String(row.salary_amount ?? '0'), bonusAmount: String(row.bonus_amount ?? '0'), bonusTargetPercentage: String(row.bonus_target_percentage ?? '0'),
  })) satisfies SellerManagementOption[]
}))

export const createCommercialSeller = createServerFn({ method: 'POST' }).inputValidator((data: { organizationId: string; branchId?: string | null; userId?: string | null; fullName: string; shortName: string; commissionRate: string; salaryAmount: string; bonusAmount: string; bonusTargetPercentage: string }) => data).handler(({ data }) => run(async () =>
  rpc<string>(await clientFor(data.organizationId, 'sellers.manage'), 'create_seller', { p_org: data.organizationId, p_branch: data.branchId || null, p_user: data.userId || null, p_full_name: data.fullName, p_short_name: data.shortName, p_commission_rate: data.commissionRate || '0', p_salary_amount: data.salaryAmount || '0', p_bonus_amount: data.bonusAmount || '0', p_bonus_target_percentage: data.bonusTargetPercentage || '0' }),
))

export const listSellerMembers = createServerFn({ method: 'POST' }).inputValidator((data: { organizationId: string }) => data).handler(({ data }) => run(async () => {
  const rows = await rpc<Array<Record<string, unknown>>>(await clientFor(data.organizationId, 'sellers.manage'), 'list_seller_members', { p_org: data.organizationId })
  return rows.map((row) => ({ userId: String(row.user_id), role: String(row.role) })) satisfies SellerMemberOption[]
}))

export const listCommercialPaymentMethods = createServerFn({ method: 'POST' }).inputValidator((data: { organizationId: string }) => data).handler(({ data }) => run(async () => {
  const rows = await rpc<Array<Record<string, unknown>>>(await clientFor(data.organizationId, 'payment_methods.read'), 'list_payment_methods', { p_org: data.organizationId })
  return rows.map((row) => ({ id: String(row.id), code: String(row.code), name: String(row.name), kind: String(row.kind), isDefault: Boolean(row.is_default) })) satisfies PaymentMethodOption[]
}))

export const createCommercialPaymentMethod = createServerFn({ method: 'POST' }).inputValidator((data: { organizationId: string; code: string; name: string; kind: string; isDefault?: boolean }) => data).handler(({ data }) => run(async () =>
  rpc<string>(await clientFor(data.organizationId, 'payment_methods.manage'), 'create_payment_method', { p_org: data.organizationId, p_code: data.code, p_name: data.name, p_kind: data.kind, p_is_default: data.isDefault ?? false }),
))

export const listCommercialPaymentTerms = createServerFn({ method: 'POST' }).inputValidator((data: { organizationId: string }) => data).handler(({ data }) => run(async () => {
  const rows = await rpc<Array<Record<string, unknown>>>(await clientFor(data.organizationId, 'payment_terms.read'), 'list_payment_terms', { p_org: data.organizationId, p_status: 'active' })
  return rows.map((row) => ({ id: String(row.id), code: String(row.code), name: String(row.name), kind: String(row.kind), isDefault: Boolean(row.is_default) })) satisfies PaymentTermOption[]
}))

export const createCommercialPaymentTerm = createServerFn({ method: 'POST' }).inputValidator((data: { organizationId: string; code: string; name: string; kind: PaymentTermKind; installments: PaymentTermInstallmentInput[]; isDefault?: boolean }) => data).handler(({ data }) => run(async () => {
  validatePaymentTerm(data.kind, data.installments)
  return rpc<string>(await clientFor(data.organizationId, 'payment_terms.manage'), 'create_payment_term', { p_org: data.organizationId, p_code: data.code, p_name: data.name, p_kind: data.kind, p_installments: data.installments.map((item) => ({ percentage: item.percentage, dueDays: item.dueDays })), p_is_default: data.isDefault ?? false })
}))
