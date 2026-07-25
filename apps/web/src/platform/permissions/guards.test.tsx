import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { can, cannot } from '@rescript/permissions'
import {
  FeatureGate,
  PermissionBoundary,
  PermissionGuard,
} from '#/platform/permissions/guards'

vi.mock('#/platform/permissions/permission-context', () => ({
  usePermission: () => ({
    grants: ['customers.read'],
    isLoading: false,
    can: (key: string) => key === 'customers.read',
    cannot: (key: string) => key !== 'customers.read',
    canAny: (keys: string[]) => keys.includes('customers.read'),
    canAll: (keys: string[]) => keys.every((k) => k === 'customers.read'),
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
    render(
      <PermissionGuard permission="customers.read">
        <span>allowed</span>
      </PermissionGuard>,
    )
    expect(screen.getByText('allowed')).toBeTruthy()
  })

  it('hides children when denied', () => {
    render(
      <PermissionGuard permission="sales.confirm">
        <span>denied</span>
      </PermissionGuard>,
    )
    expect(screen.queryByText('denied')).toBeNull()
  })
})

describe('FeatureGate', () => {
  it('gates features by permission key', () => {
    render(
      <FeatureGate permission="customers.read">
        <span>feature</span>
      </FeatureGate>,
    )
    expect(screen.getByText('feature')).toBeTruthy()
  })
})

describe('PermissionBoundary', () => {
  it('shows forbidden state when denied', () => {
    render(
      <PermissionBoundary permission="sales.confirm">
        <span>secret</span>
      </PermissionBoundary>,
    )
    expect(screen.queryByText('secret')).toBeNull()
    expect(screen.getByText('Sem permissão')).toBeTruthy()
  })
})
