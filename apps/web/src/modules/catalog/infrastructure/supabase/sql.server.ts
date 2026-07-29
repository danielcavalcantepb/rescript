import '#/modules/catalog/infrastructure/supabase/assert-server-only'
import postgres from 'postgres'
import { mapSupabaseError } from '#/modules/catalog/infrastructure/supabase/errors'
import { redactSensitive } from '#/modules/catalog/infrastructure/supabase/tenant-context'

export type CatalogSql = ReturnType<typeof postgres>

const pools = new Map<string, CatalogSql>()

/**
 * Direct Postgres pool.
 *
 * SECURITY MODEL (proven by RLS tests):
 * - Connection role is typically the DB owner (`postgres` on local Supabase).
 * - That role **bypasses RLS** (FORCE ROW LEVEL SECURITY is not enabled).
 * - `auth.uid()` is NULL on this connection unless JWT claims are injected
 *   (we do not inject claims; we do not pretend RLS applies).
 * - Tenant isolation for SQL writes/reads MUST use explicit `organization_id`
 *   predicates + verified `options.organizationId`.
 * - Pool entries are keyed by URL only; transactions use `BEGIN`/`COMMIT` and
 *   `SET LOCAL` so session state does not leak across callers.
 */
export function getCatalogSql(databaseUrl: string): CatalogSql {
  let sql = pools.get(databaseUrl)
  if (!sql) {
    sql = postgres(databaseUrl, {
      max: 4,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      // Never log connection parameters with secrets.
      onnotice: () => undefined,
      debug: false,
    })
    pools.set(databaseUrl, sql)
  }
  return sql
}

export type CatalogTransactionContext = {
  sql: CatalogSql
  /** Trusted tenant for this transaction (membership-verified). */
  organizationId: string
  actorUserId: string
}

export async function withCatalogTransaction<T>(
  databaseUrl: string,
  organizationId: string,
  actorUserId: string,
  run: (ctx: CatalogTransactionContext) => Promise<T>,
): Promise<T> {
  const sql = getCatalogSql(databaseUrl)
  try {
    const result = await sql.begin(async (tx) => {
      const scoped = tx as unknown as CatalogSql
      // Isolate session GUC for this transaction only (no cross-request leak).
      await scoped`
        select set_config('app.catalog_organization_id', ${organizationId}, true)
      `
      await scoped`
        select set_config('app.catalog_actor_user_id', ${actorUserId}, true)
      `
      return run({
        sql: scoped,
        organizationId,
        actorUserId,
      })
    })
    return result as T
  } catch (error) {
    // Ensure driver messages cannot surface connection strings.
    if (typeof error === 'object' && error && 'message' in error) {
      const message = String((error as { message?: string }).message ?? '')
      ;(error as { message: string }).message = redactSensitive(message)
    }
    // Keep database diagnostics server-side. The UI receives only the mapped
    // domain error, while deployment logs retain the PostgreSQL code needed to
    // fix migrations/constraints without exposing tenant data or credentials.
    const pg = error as { code?: unknown; message?: unknown; detail?: unknown }
    console.error('[catalog.persistence.failed]', {
      code: typeof pg?.code === 'string' ? pg.code : 'unknown',
      message: redactSensitive(String(pg?.message ?? 'unknown')),
      detail: redactSensitive(String(pg?.detail ?? '')),
    })
    mapSupabaseError(error)
  }
}

export async function closeCatalogSqlPools(): Promise<void> {
  const closing = [...pools.values()].map((sql) => sql.end({ timeout: 5 }))
  pools.clear()
  await Promise.allSettled(closing)
}

/** Introspection helper for security tests (never expose to UI). */
export async function probeSqlSecurityContext(databaseUrl: string): Promise<{
  currentUser: string
  rowSecurityForced: boolean
}> {
  const sql = getCatalogSql(databaseUrl)
  const rows = await sql<{
    current_user: string
    forced: boolean
  }[]>`
    select
      current_user,
      exists (
        select 1
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = 'brand'
          and c.relrowsecurity
          and c.relforcerowsecurity
      ) as forced
  `
  return {
    currentUser: rows[0]?.current_user ?? 'unknown',
    rowSecurityForced: Boolean(rows[0]?.forced),
  }
}
