import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { PermissionKey } from '@rescript/permissions'
import {
  PermissionProvider,
  usePermission,
} from '#/platform/permissions/permission-context'
import type { PermissionRepository } from '#/platform/permissions/types'

function repo(
  listForMembership: PermissionRepository['listForMembership'],
): PermissionRepository {
  return { listForMembership }
}

const sessionState = vi.hoisted(() => ({
  authUser: { id: 'u1', email: 'a@test.local', displayName: 'A' } as {
    id: string
    email: string
    displayName: string
  } | null,
  isAuthenticated: true,
  isAuthLoading: false,
}))

const orgState = vi.hoisted(() => ({
  currentOrganization: {
    id: 'org1',
    name: 'Org',
    slug: 'org',
    status: 'active' as const,
  } as {
    id: string
    name: string
    slug: string
    status: 'active' | 'suspended' | 'canceled'
  } | null,
  isLoading: false,
}))

vi.mock('#/providers/app-session', () => ({
  useSession: () => ({
    authUser: sessionState.authUser,
    isAuthenticated: sessionState.isAuthenticated,
    isAuthLoading: sessionState.isAuthLoading,
  }),
}))

vi.mock('#/platform/organization/organization-context', () => ({
  useOrganization: () => ({
    currentOrganization: orgState.currentOrganization,
    isLoading: orgState.isLoading,
  }),
}))

function Probe() {
  const { isLoading, status, can, error } = usePermission()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="can-read">{String(can('customers.read'))}</span>
      <span data-testid="error">{error?.message ?? ''}</span>
      {can('customers.read') ? <span>protected</span> : null}
    </div>
  )
}

function renderWithRepo(repository: PermissionRepository) {
  return render(
    <PermissionProvider repository={repository}>
      <Probe />
    </PermissionProvider>,
  )
}

describe('PermissionProvider load states', () => {
  beforeEach(() => {
    sessionState.authUser = {
      id: 'u1',
      email: 'a@test.local',
      displayName: 'A',
    }
    sessionState.isAuthenticated = true
    sessionState.isAuthLoading = false
    orgState.currentOrganization = {
      id: 'org1',
      name: 'Org',
      slug: 'org',
      status: 'active',
    }
    orgState.isLoading = false
  })

  it('stays loading while session is unresolved', () => {
    sessionState.isAuthLoading = true
    const listForMembership = vi.fn(async () => ['customers.read'] as const)
    const r = repo(listForMembership)
    renderWithRepo(r)
    expect(screen.getByTestId('status').textContent).toBe('loading')
    expect(screen.getByTestId('loading').textContent).toBe('true')
    expect(screen.queryByText('protected')).toBeNull()
    expect(screen.queryByText('Sem permissão')).toBeNull()
    expect(listForMembership).not.toHaveBeenCalled()
  })

  it('stays loading while organization is unresolved', () => {
    orgState.isLoading = true
    const listForMembership = vi.fn(async () => ['customers.read'] as const)
    renderWithRepo(repo(listForMembership))
    expect(screen.getByTestId('status').textContent).toBe('loading')
    expect(screen.queryByText('protected')).toBeNull()
    expect(listForMembership).not.toHaveBeenCalled()
  })

  it('allows after grants load', async () => {
    renderWithRepo(
      repo(vi.fn(async () => ['customers.read'] as const)),
    )
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('ready')
    })
    expect(screen.getByTestId('can-read').textContent).toBe('true')
    expect(screen.getByText('protected')).toBeTruthy()
  })

  it('denies after grants load without permission', async () => {
    renderWithRepo(
      repo(vi.fn(async () => ['products.read'] as const)),
    )
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('ready')
    })
    expect(screen.getByTestId('can-read').textContent).toBe('false')
    expect(screen.queryByText('protected')).toBeNull()
  })

  it('surfaces error when grant load fails', async () => {
    renderWithRepo(
      repo(
        vi.fn(async () => {
          throw new Error('boom')
        }),
      ),
    )
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error')
    })
    expect(screen.getByTestId('error').textContent).toBe('boom')
    expect(screen.queryByText('protected')).toBeNull()
  })

  it('re-enters loading and does not keep prior grants across org switch', async () => {
    let resolveGrants: ((value: readonly PermissionKey[]) => void) | null =
      null
    const listForMembership = vi.fn(
      () =>
        new Promise<readonly PermissionKey[]>((resolve) => {
          resolveGrants = resolve
        }),
    )
    const r = repo(listForMembership)

    const { rerender } = renderWithRepo(r)
    expect(screen.getByTestId('status').textContent).toBe('loading')

    resolveGrants!(['customers.read'])
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('ready')
    })
    expect(screen.getByText('protected')).toBeTruthy()

    orgState.currentOrganization = {
      id: 'org2',
      name: 'Org 2',
      slug: 'org-2',
      status: 'active',
    }

    rerender(
      <PermissionProvider repository={r}>
        <Probe />
      </PermissionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('loading')
    })
    expect(screen.queryByText('protected')).toBeNull()
    expect(screen.getByTestId('can-read').textContent).toBe('false')
  })
})

describe('RequirePermission flash prevention', () => {
  beforeEach(() => {
    sessionState.isAuthLoading = false
    sessionState.isAuthenticated = true
    sessionState.authUser = {
      id: 'u1',
      email: 'a@test.local',
      displayName: 'A',
    }
    orgState.isLoading = false
    orgState.currentOrganization = {
      id: 'org1',
      name: 'Org',
      slug: 'org',
      status: 'active',
    }
  })

  it('does not render Forbidden while grants are loading', async () => {
    const { RequirePermission } = await import('#/platform/permissions/guards')
    const r = repo(
      vi.fn(() => new Promise<readonly PermissionKey[]>(() => undefined)),
    )

    function Page({ children }: { children: ReactNode }) {
      return (
        <PermissionProvider repository={r}>
          <RequirePermission permission="customers.read">
            {children}
          </RequirePermission>
        </PermissionProvider>
      )
    }

    render(
      <Page>
        <span>secret-content</span>
      </Page>,
    )

    expect(screen.getByText('Carregando permissões…')).toBeTruthy()
    expect(screen.queryByText('Sem permissão')).toBeNull()
    expect(screen.queryByText('secret-content')).toBeNull()
  })
})
