import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { can, cannot } from '@rescript/permissions'
import type { PermissionStatus } from '#/platform/permissions'
import {
  FeatureGate,
  PermissionBoundary,
  PermissionGuard,
  RequirePermission,
} from '#/platform/permissions'

const permissionMock = vi.hoisted(() => ({
  grants: ['customers.read'] as string[],
  isLoading: false,
  status: 'ready' as PermissionStatus,
  error: null as Error | null,
}))

vi.mock('#/platform/permissions/permission-context', () => ({
  usePermission: () => ({
    grants: permissionMock.grants,
    isLoading: permissionMock.status === 'loading',
    status: permissionMock.status,
    error: permissionMock.error,
    // Mirrors production: allow only when ready + grant present (no "denied" status).
    can: (key: string) =>
      permissionMock.status === 'ready' &&
      permissionMock.grants.includes(key),
    cannot: (key: string) =>
      permissionMock.status !== 'ready' ||
      !permissionMock.grants.includes(key),
    canAny: (keys: string[]) =>
      permissionMock.status === 'ready' &&
      keys.some((k) => permissionMock.grants.includes(k)),
    canAll: (keys: string[]) =>
      permissionMock.status === 'ready' &&
      keys.every((k) => permissionMock.grants.includes(k)),
  }),
}))

describe('permission helpers', () => {
  it('can / cannot use resource.action', () => {
    const grants = ['customers.read'] as const
    expect(can(grants, 'customers.read')).toBe(true)
    expect(cannot(grants, 'customers.read')).toBe(false)
    expect(can(grants, 'sales.confirm')).toBe(false)
  })

  it('write implies create/edit', () => {
    expect(can(['customers.write'], 'customers.create')).toBe(true)
    expect(can(['customers.write'], 'customers.edit')).toBe(true)
  })
})

describe('PermissionGuard', () => {
  it('renders children when allowed', () => {
    permissionMock.isLoading = false
    permissionMock.status = 'ready'
    permissionMock.grants = ['customers.read']
    render(
      <PermissionGuard permission="customers.read">
        <span>allowed</span>
      </PermissionGuard>,
    )
    expect(screen.getByText('allowed')).toBeTruthy()
  })

  it('hides children when denied', () => {
    permissionMock.isLoading = false
    permissionMock.status = 'ready'
    permissionMock.grants = ['customers.read']
    render(
      <PermissionGuard permission="sales.confirm">
        <span>denied</span>
      </PermissionGuard>,
    )
    expect(screen.queryByText('denied')).toBeNull()
  })

  it('hides children while loading (no protected flash)', () => {
    permissionMock.isLoading = true
    permissionMock.status = 'loading'
    permissionMock.grants = ['customers.read']
    render(
      <PermissionGuard permission="customers.read">
        <span>premature</span>
      </PermissionGuard>,
    )
    expect(screen.queryByText('premature')).toBeNull()
  })
})

describe('FeatureGate', () => {
  it('gates features by permission key', () => {
    permissionMock.isLoading = false
    permissionMock.status = 'ready'
    permissionMock.grants = ['customers.read']
    render(
      <FeatureGate permission="customers.read">
        <span>feature</span>
      </FeatureGate>,
    )
    expect(screen.getByText('feature')).toBeTruthy()
  })
})

describe('PermissionBoundary / RequirePermission', () => {
  it('shows loading instead of Forbidden while unresolved', () => {
    permissionMock.isLoading = true
    permissionMock.status = 'loading'
    render(
      <PermissionBoundary permission="customers.read">
        <span>secret</span>
      </PermissionBoundary>,
    )
    expect(screen.getByText('Carregando permissões…')).toBeTruthy()
    expect(screen.queryByText('Sem permissão')).toBeNull()
    expect(screen.queryByText('secret')).toBeNull()
  })

  it('shows Forbidden when ready and not allowed (no denied status)', () => {
    permissionMock.isLoading = false
    permissionMock.status = 'ready'
    permissionMock.grants = ['customers.read']
    render(
      <PermissionBoundary permission="sales.confirm">
        <span>secret</span>
      </PermissionBoundary>,
    )
    expect(screen.queryByText('secret')).toBeNull()
    expect(screen.getByText('Sem permissão')).toBeTruthy()
  })

  it('shows error state when grant load failed', () => {
    permissionMock.isLoading = false
    permissionMock.status = 'error'
    permissionMock.error = new Error('falha grants')
    permissionMock.grants = []
    render(
      <RequirePermission permission="customers.read">
        <span>secret</span>
      </RequirePermission>,
    )
    expect(screen.queryByText('secret')).toBeNull()
    expect(screen.queryByText('Sem permissão')).toBeNull()
    expect(screen.getByText('falha grants')).toBeTruthy()
  })

  it('renders children when allowed after ready', () => {
    permissionMock.isLoading = false
    permissionMock.status = 'ready'
    permissionMock.error = null
    permissionMock.grants = ['customers.read']
    render(
      <RequirePermission permission="customers.read">
        <span>ok</span>
      </RequirePermission>,
    )
    expect(screen.getByText('ok')).toBeTruthy()
  })
})
