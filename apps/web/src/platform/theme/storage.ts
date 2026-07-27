export const THEME_STORAGE_KEY = 'rescript.theme'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function readStoredTheme(): ThemePreference | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(raw) ? raw : null
  } catch {
    return null
  }
}

export function writeStoredTheme(preference: ThemePreference): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Ignore quota / private mode failures — theme still applies in-session.
  }
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Resolve theme: saved preference → OS preference → light.
 */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') return getSystemTheme()
  return preference
}

export function applyThemeClass(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}
