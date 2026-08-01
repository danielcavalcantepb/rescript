import { createClient } from '@supabase/supabase-js'
import type { Database } from '@rescript/database'

/**
 * Privileged client reserved for server-only ingestion and worker processes.
 * Never import this file from UI, loaders, or public server functions.
 */
export function createServiceRoleSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('CAP service role n\u00e3o configurada no servidor.')
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
