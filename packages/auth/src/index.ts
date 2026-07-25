/**
 * @rescript/auth — identity helpers for Supabase Auth.
 * Browser/SSR clients live in apps/web (framework boundary).
 * Auth ≠ authorization ≠ organization (see Architecture ADRs).
 */
export type { AuthUser, AuthSessionSnapshot } from './types'
export { mapAuthError } from './errors'
export { getAuthDisplayName } from './display-name'
export { sanitizeRedirectPath } from './redirect'
