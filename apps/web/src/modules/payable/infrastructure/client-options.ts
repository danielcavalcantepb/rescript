import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@rescript/database'

export type PayableReposOptions = {
  client: SupabaseClient<Database>
  organizationId: string
  actorUserId: string
}
