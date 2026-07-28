import { createServerFn } from '@tanstack/react-start'
type DashboardClient = { rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }> }

export const getExecutiveDashboard = createServerFn({ method: 'POST' })
  .validator((data: { organizationId: string; period?: 'today' | '7d' | '30d' | '12m' }) => data)
  .handler(async ({ data }) => {
    const { createServerSupabaseClient } = await import('#/lib/supabase/server.server')
    const client = createServerSupabaseClient()
    const { data: result, error } = await (client as unknown as DashboardClient).rpc('get_executive_dashboard', { p_organization_id: data.organizationId, p_period: data.period ?? '30d' })
    if (error) throw Error(error.message)
    return result as { period: string; cards: Record<string, number>; revenue: Array<{ date: string; value: number }>; topProducts: Array<{ product: string; quantity: number; value: number }>; finance: Record<string, number>; stock: Record<string, number | null> }
  })
