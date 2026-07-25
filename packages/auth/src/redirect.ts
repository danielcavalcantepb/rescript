/**
 * Only allow same-origin relative paths for post-login redirects.
 * Blocks open redirects (https://..., //evil, javascript:, etc.).
 */
export function sanitizeRedirectPath(
  value: unknown,
  fallback = '/',
): string {
  if (typeof value !== 'string') return fallback
  const path = value.trim()
  if (!path.startsWith('/')) return fallback
  if (path.startsWith('//')) return fallback
  if (path.includes('://')) return fallback
  if (path.includes('\\')) return fallback
  if (path.startsWith('/login')) return fallback
  return path
}
