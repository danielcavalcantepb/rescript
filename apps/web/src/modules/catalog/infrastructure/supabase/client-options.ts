import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@rescript/database'

export type CatalogSupabaseReposOptions = {
  /**
   * Authenticated Supabase client (user JWT). Used for RLS-backed reads
   * and membership verification. Never a service-role browser client.
   */
  client: SupabaseClient<Database>
  /** Must equal `client.auth.getUser().id` — verified at factory time. */
  actorUserId: string
  /**
   * Membership-verified organization. All SQL writes are scoped to this
   * tenant; entity.organizationId must match.
   */
  organizationId: string
  /**
   * Server-only Postgres URL (`process.env.SUPABASE_DB_URL` / `DATABASE_URL`).
   * Never a `VITE_*` value. Direct SQL bypasses RLS — org filters are mandatory.
   */
  databaseUrl: string
  nowIso?: () => string
}

export function resolveNowIso(options: CatalogSupabaseReposOptions): string {
  return options.nowIso?.() ?? new Date().toISOString()
}

/** Resolve DB URL from server env only (names, never logged values). */
export function resolveCatalogDatabaseUrlFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const url = env.SUPABASE_DB_URL ?? env.DATABASE_URL ?? ''
  return url
}
