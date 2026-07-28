import { createServerFn } from '@tanstack/react-start'
import type { PermissionKey } from '@rescript/permissions'
import type { SupabaseClient } from '@supabase/supabase-js'

type Client = SupabaseClient
async function context(org: string, permission: PermissionKey) {
  const { can, isRolePreset, permissionsForRole } = await import('@rescript/permissions')
  const { createServerSupabaseClient } = await import('#/lib/supabase/server.server')
  const client = createServerSupabaseClient(); const { data: { user } } = await client.auth.getUser()
  if (!user) throw Error('not_authenticated')
  const { data: membership } = await client.from('membership').select('role,status').eq('organization_id', org).eq('user_id', user.id).eq('status', 'active').maybeSingle()
  if (!membership || !isRolePreset(membership.role) || !can(permissionsForRole(membership.role), permission)) throw Error('permission_denied')
  return client as unknown as Client
}
async function run<T>(work: () => Promise<T>) { try { return { ok: true as const, data: await work() } } catch (error) { const code = error instanceof Error ? error.message : 'fiscal_error'; return { ok: false as const, error: { code, message: code === 'permission_denied' ? 'Você não tem permissão para consultar documentos fiscais.' : 'Não foi possível consultar o documento fiscal.' } } } }

export const listFiscalDocuments = createServerFn({ method: 'POST' }).inputValidator((d: { organizationId: string; query?: { q?: string; status?: string; limit?: number; offset?: number } }) => d).handler(({ data }) => run(async () => {
  const client = await context(data.organizationId, 'fiscal.documents.read')
  let query = client.from('fiscal_document_search').select('*', { count: 'exact' }).eq('organization_id', data.organizationId).order('updated_at', { ascending: false }).range(data.query?.offset ?? 0, (data.query?.offset ?? 0) + (data.query?.limit ?? 25) - 1)
  if (data.query?.status) query = query.eq('status', data.query.status)
  if (data.query?.q) query = query.ilike('search_text', `%${data.query.q}%`)
  const { data: rows, error } = await query; if (error) throw Error(error.message); return rows ?? []
}))

export const getFiscalDocument = createServerFn({ method: 'POST' }).inputValidator((d: { organizationId: string; id: string }) => d).handler(({ data }) => run(async () => {
  const client = await context(data.organizationId, 'fiscal.documents.read')
  const [{ data: document, error: documentError }, { data: items, error: itemsError }, { data: history, error: historyError }] = await Promise.all([
    client.from('fiscal_document').select('*').eq('organization_id', data.organizationId).eq('id', data.id).maybeSingle(),
    client.from('fiscal_document_item').select('*').eq('organization_id', data.organizationId).eq('fiscal_document_id', data.id).order('created_at'),
    client.from('fiscal_document_history').select('*').eq('organization_id', data.organizationId).eq('fiscal_document_id', data.id).order('created_at'),
  ])
  const firstError = documentError ?? itemsError ?? historyError
  if (firstError) throw Error(firstError.message)
  if (!document) throw Error('not_found')
  return { document, items: items ?? [], history: history ?? [] }
}))

export const buildFiscalDocumentFromSales = createServerFn({ method: 'POST' }).inputValidator((d: { organizationId: string; salesOrderId: string }) => d).handler(({ data }) => run(async () => {
  const client = await context(data.organizationId, 'fiscal.documents.create')
  const { data: result, error } = await client.rpc('build_fiscal_document_from_sales', { p_organization_id: data.organizationId, p_sales_order_id: data.salesOrderId })
  if (error) throw Error(error.message); return result as Record<string, string | boolean>
}))
