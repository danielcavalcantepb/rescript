/**
 * Single source of truth for human identity labels.
 *
 * Never derive a person's name from their email address.
 * Email may appear in UI only as secondary metadata.
 *
 * Priority:
 * 1. public profile full_name (when provided)
 * 2. user_metadata.full_name
 * 3. user_metadata.display_name
 * 4. user_metadata.name
 * 5. user_metadata.first_name
 * 6. neutral fallback: "Usuário"
 */

export const USER_NAME_FALLBACK = 'Usuário'

export type UserNameSource = {
  email?: string | null
  userMetadata?: Record<string, unknown> | null
  /** Optional public.profile.full_name when the table exists */
  profileFullName?: string | null
}

function readMetaString(
  meta: Record<string, unknown>,
  key: string,
): string | null {
  const value = meta[key]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function readOptionalName(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : null
}

/**
 * Canonical full display name for profile chrome, avatars, headers.
 */
export function resolveUserDisplayName(source: UserNameSource): string {
  const meta = source.userMetadata ?? {}

  return (
    readOptionalName(source.profileFullName) ||
    readMetaString(meta, 'full_name') ||
    readMetaString(meta, 'display_name') ||
    readMetaString(meta, 'name') ||
    readMetaString(meta, 'first_name') ||
    USER_NAME_FALLBACK
  )
}

/**
 * First token of the resolved full name — for greetings only.
 * Never returns an email or email local-part.
 */
export function resolveUserFirstName(source: UserNameSource): string {
  const meta = source.userMetadata ?? {}
  const explicitFirst = readMetaString(meta, 'first_name')
  if (explicitFirst) {
    return explicitFirst.split(/\s+/).filter(Boolean)[0] ?? USER_NAME_FALLBACK
  }

  const full = resolveUserDisplayName(source)
  if (full === USER_NAME_FALLBACK) return USER_NAME_FALLBACK

  const first = full.split(/\s+/).filter(Boolean)[0]
  return first || USER_NAME_FALLBACK
}

/** True when a real human name is available (not the neutral fallback). */
export function hasResolvedUserName(source: UserNameSource): boolean {
  return resolveUserDisplayName(source) !== USER_NAME_FALLBACK
}

/**
 * Metadata payload for auth.updateUser / inviteUserByEmail.
 * Never invents a name from email.
 */
export function buildAuthNameMetadata(fullName: string): {
  full_name: string
  display_name: string
} {
  const trimmed = fullName.trim()
  if (trimmed.length < 2) {
    throw new Error('invalid_full_name')
  }
  return {
    full_name: trimmed,
    display_name: trimmed,
  }
}

/** @deprecated Prefer resolveUserDisplayName */
export const getAuthDisplayName = resolveUserDisplayName

/** @deprecated Prefer resolveUserFirstName */
export function getAuthFirstName(
  source: UserNameSource & { displayName?: string | null },
): string {
  if (source.displayName?.trim() && !source.userMetadata && !source.profileFullName) {
    const display = source.displayName.trim()
    if (display === USER_NAME_FALLBACK) return USER_NAME_FALLBACK
    // Guard: never treat email / local-part as a first name
    if (display.includes('@')) return USER_NAME_FALLBACK
    return display.split(/\s+/).filter(Boolean)[0] || USER_NAME_FALLBACK
  }
  return resolveUserFirstName(source)
}
