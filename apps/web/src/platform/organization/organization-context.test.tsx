import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  OrganizationProvider,
  useOrganization,
} from '#/platform/organization/organization-context'
import type { OrganizationRepository } from '#/platform/organization/types'
import {
  readActiveOrganizationId,
  writeActiveOrganizationId,
} from '#/platform/organization/active-organization'

vi.mock('#/providers/app-session', () => ({
  useSession: () => ({
    authUser: { id: 'user_1', email: 'a@b.com', displayName: 'A', firstName: 'A' },
    isAuthenticated: true,
    isAuthLoading: false,
  }),
}))

vi.mock('#/integrations/tanstack-query/root-provider', () => ({
  getContext: () => ({
    queryClient: {
      invalidateQueries: vi.fn(),
      clear: vi.fn(),
    },
  }),
}))

const repo: OrganizationRepository = {
  async listForUser() {
    return [
      { id: 'org_a', name: 'Alpha', slug: 'alpha', status: 'active' },
      { id: 'org_b', name: 'Beta', slug: 'beta', status: 'active' },
    ]
  },
  async getCurrent() {
    return { id: 'org_a', name: 'Alpha', slug: 'alpha', status: 'active' }
  },
  async setCurrent(_userId, organizationId) {
    return {
      id: organizationId,
      name: organizationId === 'org_b' ? 'Beta' : 'Alpha',
      slug: organizationId === 'org_b' ? 'beta' : 'alpha',
      status: 'active',
    }
  },
  async createOrganization(name) {
    return {
      organization: {
        id: 'org_new',
        name,
        slug: 'new',
        status: 'active',
      },
      membership: {
        id: 'mem_1',
        organizationId: 'org_new',
        userId: 'user_1',
        role: 'owner',
        status: 'active',
        isOwner: true,
      },
    }
  },
  async listMemberships() {
    return [
      {
        id: 'mem_a',
        organizationId: 'org_a',
        userId: 'user_1',
        role: 'owner' as const,
        status: 'active' as const,
        isOwner: true,
      },
    ]
  },
}

function Probe() {
  const { currentOrganization, organizations, isLoading } = useOrganization()
  if (isLoading) return <div>loading</div>
  return (
    <div>
      <span data-testid="current">{currentOrganization?.name}</span>
      <span data-testid="count">{organizations.length}</span>
    </div>
  )
}

function wrap(ui: ReactNode) {
  return (
    <OrganizationProvider repository={repo}>{ui}</OrganizationProvider>
  )
}

describe('OrganizationContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('loads current organization from repository', async () => {
    render(wrap(<Probe />))
    await waitFor(() => {
      expect(screen.getByTestId('current').textContent).toBe('Alpha')
    })
    expect(screen.getByTestId('count').textContent).toBe('2')
  })
})

describe('active organization preference', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reads and writes preference key', () => {
    writeActiveOrganizationId('org_x')
    expect(readActiveOrganizationId()).toBe('org_x')
  })
})
