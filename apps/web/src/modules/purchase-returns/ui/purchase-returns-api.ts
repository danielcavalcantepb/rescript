import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const listInput = z.object({ organizationId: z.string().uuid(), search: z.string().optional() })
type ReturnSearchRow = {
  purchase_return_id: string
  number: string
  purchase_order_id: string
  goods_receipt_id: string
  status: string
  returned_at: string | null
}

export const purchaseReturnList = createServerFn({ method: 'POST' })
  .inputValidator(listInput)
  .handler(async ({ data }) => {
    const { createServerSupabaseClient } = await import('#/lib/supabase/server.server')
    const supabase = createServerSupabaseClient()
    const client = supabase as unknown as { from: (table: string) => { select: (columns: string) => ReturnSearchQuery } }
    let query = client.from('purchase_return_search').select('*').eq('organization_id', data.organizationId).order('updated_at', { ascending: false }).limit(50)
    if (data.search?.trim()) query = query.ilike('search_text', `%${data.search.trim().toLowerCase()}%`)
    const { data: rows, error } = await query
    if (error) throw new Error(error.message)
    return (rows ?? []) as ReturnSearchRow[]
  })

type ReturnSearchQuery = {
  eq: (column: string, value: string) => ReturnSearchQuery
  order: (column: string, options: { ascending: boolean }) => ReturnSearchQuery
  limit: (count: number) => ReturnSearchQuery
  ilike: (column: string, value: string) => ReturnSearchQuery
  then: PromiseLike<{ data: unknown; error: { message: string } | null }>['then']
}
