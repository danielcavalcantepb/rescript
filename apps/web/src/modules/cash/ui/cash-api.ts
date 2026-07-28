import { createServerFn } from '@tanstack/react-start'

export type CashFlowSnapshot = {
  realizedBalance: number
  forecastIn: number
  forecastOut: number
  projectedBalance: number
  from: string
  to: string
  grain: 'day' | 'week' | 'month'
}

export const getCashFlowSnapshot = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    organizationId: string
    branchId?: string
    cashAccountId?: string
    from?: string
    to?: string
    grain?: 'day' | 'week' | 'month'
  }) => data)
  .handler(async ({ data }): Promise<CashFlowSnapshot> => {
    const { createServerSupabaseClient } = await import('#/lib/supabase/server.server')
    const client = createServerSupabaseClient()
    const rpc = client.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
    const { data: result, error } = await rpc('get_finance_cash_flow', {
      p_org: data.organizationId,
      p_branch: data.branchId ?? null,
      p_account: data.cashAccountId ?? null,
      p_from: data.from ?? null,
      p_to: data.to ?? null,
      p_grain: data.grain ?? 'day',
    })
    if (error) throw new Error(error.message)
    return result as unknown as CashFlowSnapshot
  })
