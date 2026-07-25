import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@rescript/database'
import { getSupabaseEnv } from '#/lib/supabase/env'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null

/** Browser Supabase client — cookie session via @supabase/ssr. */
export function createBrowserSupabaseClient() {
  if (browserClient) return browserClient
  const { url, publishableKey } = getSupabaseEnv()
  browserClient = createBrowserClient<Database>(url, publishableKey)
  return browserClient
}
