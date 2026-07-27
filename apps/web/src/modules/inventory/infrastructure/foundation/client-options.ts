import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@rescript/database'

export type InventoryFoundationReposOptions = {
  client: SupabaseClient<Database>
  actorUserId: string
  organizationId: string
  nowIso?: () => string
}

export function resolveNowIso(
  options: InventoryFoundationReposOptions,
): string {
  return options.nowIso?.() ?? new Date().toISOString()
}
