import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('AppShellProviders', () => {
  it('composes the permanent provider stack', () => {
    const source = readFileSync(
      path.resolve(__dirname, './app-shell-providers.tsx'),
      'utf8',
    )
    expect(source).toContain('OrganizationProvider')
    expect(source).toContain('PermissionProvider')
    expect(source).toContain('CommandBootstrap')
    expect(source).toContain('ToastViewport')
    expect(source).toContain('DialogHost')
    expect(source).toContain('GlobalErrorBoundary')
  })
})
