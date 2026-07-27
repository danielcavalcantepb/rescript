import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useSession } from '#/providers/app-session'
import { supabaseOrganizationRepository } from '#/platform/organization/supabase-organization-repository'
import type {
  CreateOrganizationResult,
  CurrentOrganization,
  Membership,
  Organization,
  OrganizationRepository,
} from '#/platform/organization/types'
import { getContext } from '#/integrations/tanstack-query/root-provider'
import {
  invalidateOrganizationScope,
  queryKeys,
} from '#/platform/cache/query-keys'
import { logger } from '#/platform/services/logger'

type OrganizationContextValue = {
  organizations: Organization[]
  currentOrganization: CurrentOrganization
  /** Active membership for the current organization (role / cargo). */
  currentMembership: Membership | null
  isLoading: boolean
  error: string | null
  switchOrganization: (organizationId: string) => Promise<void>
  createOrganization: (name: string) => Promise<CreateOrganizationResult>
  reload: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null)

export function OrganizationProvider({
  children,
  repository = supabaseOrganizationRepository,
}: {
  children: ReactNode
  repository?: OrganizationRepository
}) {
  const { authUser, isAuthenticated } = useSession()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] =
    useState<CurrentOrganization>(null)
  const [currentMembership, setCurrentMembership] = useState<Membership | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!isAuthenticated || !authUser) {
      setOrganizations([])
      setCurrentOrganization(null)
      setCurrentMembership(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const [list, current, memberships] = await Promise.all([
        repository.listForUser(authUser.id),
        repository.getCurrent(authUser.id),
        repository.listMemberships(authUser.id),
      ])
      setOrganizations(list)
      setCurrentOrganization(current)
      setCurrentMembership(
        current
          ? (memberships.find((m) => m.organizationId === current.id) ?? null)
          : null,
      )
    } catch (err) {
      logger.error('Failed to load organizations', {
        message: err instanceof Error ? err.message : String(err),
      })
      setError('Não foi possível carregar suas organizações.')
      setOrganizations([])
      setCurrentOrganization(null)
      setCurrentMembership(null)
    } finally {
      setIsLoading(false)
    }
  }, [authUser, isAuthenticated, repository])

  useEffect(() => {
    void reload()
  }, [reload])

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      if (!authUser) return
      const previousId = currentOrganization?.id
      const next = await repository.setCurrent(authUser.id, organizationId)
      setCurrentOrganization(next)
      const memberships = await repository.listMemberships(authUser.id)
      setCurrentMembership(
        memberships.find((m) => m.organizationId === next.id) ?? null,
      )

      const { queryClient } = getContext()
      if (previousId) {
        invalidateOrganizationScope(
          (key) => void queryClient.invalidateQueries({ queryKey: [...key] }),
          previousId,
        )
      }
      invalidateOrganizationScope(
        (key) => void queryClient.invalidateQueries({ queryKey: [...key] }),
        next.id,
      )
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organization.all(),
      })
    },
    [authUser, currentOrganization?.id, repository],
  )

  const createOrganization = useCallback(
    async (name: string) => {
      const result = await repository.createOrganization(name)
      await reload()
      return result
    },
    [reload, repository],
  )

  const value = useMemo(
    () => ({
      organizations,
      currentOrganization,
      currentMembership,
      isLoading,
      error,
      switchOrganization,
      createOrganization,
      reload,
    }),
    [
      organizations,
      currentOrganization,
      currentMembership,
      isLoading,
      error,
      switchOrganization,
      createOrganization,
      reload,
    ],
  )

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext)
  if (!ctx) {
    throw new Error('useOrganization must be used within OrganizationProvider')
  }
  return ctx
}
