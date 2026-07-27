import { CatalogPermissionError } from '#/modules/catalog/application/errors'
import type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'

/**
 * Prove JWT subject + active membership before any persistence work.
 * actorUserId / organizationId from the caller are not trusted alone.
 */
export async function assertCatalogTenantAccess(
  options: CatalogSupabaseReposOptions,
): Promise<void> {
  const { data: auth, error: authError } = await options.client.auth.getUser()
  if (authError || !auth.user?.id) {
    throw new CatalogPermissionError('not_authenticated')
  }
  if (auth.user.id !== options.actorUserId) {
    throw new CatalogPermissionError('actor_mismatch')
  }

  const { data: membership, error: membershipError } = await options.client
    .from('membership')
    .select('id')
    .eq('organization_id', options.organizationId)
    .eq('user_id', options.actorUserId)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membership) {
    throw new CatalogPermissionError('not_org_member')
  }
}

/** Reject aggregates that target a different tenant than the verified context. */
export function assertEntityOrganization(
  entityOrganizationId: string,
  trustedOrganizationId: string,
): void {
  if (entityOrganizationId !== trustedOrganizationId) {
    throw new CatalogPermissionError('organization_mismatch')
  }
}

/**
 * Database URL must come from server env (never Vite public vars).
 * Values are never returned in error messages.
 */
export function assertSafeDatabaseUrl(databaseUrl: string): void {
  const trimmed = databaseUrl.trim()
  if (!trimmed) {
    throw new CatalogPermissionError('database_url_missing')
  }
  if (/^vite_/i.test(trimmed) || /import\.meta\.env/i.test(trimmed)) {
    throw new CatalogPermissionError('database_url_invalid')
  }
  // Reject obvious browser-injected placeholders; require postgres scheme.
  if (!/^postgres(ql)?:\/\//i.test(trimmed)) {
    throw new CatalogPermissionError('database_url_invalid')
  }
}

export function maskSecret(value: string): string {
  if (value.length <= 8) return '***'
  return `${value.slice(0, 4)}…${value.slice(-2)}`
}

/** Redact connection strings / tokens from diagnostic text. */
export function redactSensitive(text: string): string {
  return text
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, 'postgresql://***')
    .replace(/service_role/gi, '[redacted_role]')
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[redacted_jwt]')
    .replace(/password=[^&\s]+/gi, 'password=***')
}
