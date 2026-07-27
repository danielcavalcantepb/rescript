/**
 * @rescript/auth — identity helpers for Supabase Auth.
 * Browser/SSR clients live in apps/web (framework boundary).
 * Auth ≠ authorization ≠ organization (see Architecture ADRs).
 */
export type { AuthUser, AuthSessionSnapshot } from './types'
export { mapAuthError } from './errors'
export {
  resolveUserDisplayName,
  resolveUserFirstName,
  hasResolvedUserName,
  buildAuthNameMetadata,
  getAuthDisplayName,
  getAuthFirstName,
  USER_NAME_FALLBACK,
} from './display-name'
export type { UserNameSource } from './display-name'
export { sanitizeRedirectPath } from './redirect'
