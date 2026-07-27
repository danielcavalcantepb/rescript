import { createClient } from '@supabase/supabase-js'
import type { Database } from '@rescript/database'

/**
 * Server-only Supabase admin client.
 *
 * Used only for platform provisioning tasks that cannot run from the browser,
 * such as creating the owner Auth user during checkout completion.
 */
export function createAdminSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase admin não configurado. Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no servidor.',
    )
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
