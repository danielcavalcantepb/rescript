import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import {
  applyThemeClass,
  resolveTheme,
  readStoredTheme,
  writeStoredTheme,
  THEME_STORAGE_KEY,
} from '#/platform/theme/storage'

describe('theme storage', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('persists preference', () => {
    writeStoredTheme('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(readStoredTheme()).toBe('dark')
  })

  it('resolves explicit preferences', () => {
    expect(resolveTheme('light')).toBe('light')
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('applies dark class without reload', () => {
    applyThemeClass('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')

    applyThemeClass('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('resolves system from matchMedia', () => {
    const original = window.matchMedia
    window.matchMedia = ((query: string) =>
      ({
        matches: query.includes('dark'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      })) as typeof window.matchMedia

    expect(resolveTheme('system')).toBe('dark')
    window.matchMedia = original
  })
})
