import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyThemeClass,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '#/platform/theme/storage'

type ThemeContextValue = {
  /** Explicit preference (may be system). */
  preference: ThemePreference
  /** Concrete theme currently painted. */
  resolved: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
  /** Toggle between light and dark (stores explicit choice). */
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function initialPreference(): ThemePreference {
  return readStoredTheme() ?? 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    initialPreference,
  )
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveTheme(initialPreference()),
  )

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    writeStoredTheme(next)
    const concrete = resolveTheme(next)
    setResolved(concrete)
    applyThemeClass(concrete)
  }, [])

  const toggle = useCallback(() => {
    setPreference(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setPreference])

  // Keep in sync with OS when preference is "system".
  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => {
      const concrete = resolveTheme(preference)
      setResolved(concrete)
      applyThemeClass(concrete)
    }

    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [preference])

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, setPreference, toggle }),
    [preference, resolved, setPreference, toggle],
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
