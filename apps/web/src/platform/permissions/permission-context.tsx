import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  can as canCheck,
  canAll as canAllCheck,
  canAny as canAnyCheck,
  cannot as cannotCheck,
  type PermissionKey,
} from '@rescript/permissions'
import { useSession } from '#/providers/app-session'
import { useOrganization } from '#/platform/organization/organization-context'
import { supabasePermissionRepository } from '#/platform/permissions/supabase-permission-repository'
import type { PermissionRepository } from '#/platform/permissions/types'

/** Resolved permission load lifecycle for UI gates. */
export type PermissionStatus = 'loading' | 'ready' | 'error'

type PermissionContextValue = {
  grants: readonly PermissionKey[]
  /** True while session, org, membership, or grants are unresolved. */
  isLoading: boolean
  status: PermissionStatus
  error: Error | null
  can: (key: PermissionKey) => boolean
  cannot: (key: PermissionKey) => boolean
  canAny: (keys: readonly PermissionKey[]) => boolean
  canAll: (keys: readonly PermissionKey[]) => boolean
}

const PermissionContext = createContext<PermissionContextValue | null>(null)

export function PermissionProvider({
  children,
  repository = supabasePermissionRepository,
}: {
  children: ReactNode
  repository?: PermissionRepository
}) {
  const { authUser, isAuthenticated, isAuthLoading } = useSession()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const [grants, setGrants] = useState<readonly PermissionKey[]>([])
  const [status, setStatus] = useState<PermissionStatus>('loading')
  const [error, setError] = useState<Error | null>(null)
  /** Org id for which `grants` were last resolved (null = logged out / no org). */
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null | undefined>(
    undefined,
  )

  const activeOrgId =
    currentOrganization?.status === 'active' ? currentOrganization.id : null

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (isAuthLoading || orgLoading) {
        if (!cancelled) {
          setStatus('loading')
          setError(null)
        }
        return
      }

      if (!isAuthenticated || !authUser) {
        if (!cancelled) {
          setGrants([])
          setResolvedOrgId(null)
          setError(null)
          setStatus('ready')
        }
        return
      }

      if (!activeOrgId) {
        if (!cancelled) {
          setGrants([])
          setResolvedOrgId(null)
          setError(null)
          setStatus('ready')
        }
        return
      }

      if (!cancelled) {
        setStatus('loading')
        setError(null)
      }

      try {
        const next = await repository.listForMembership(
          activeOrgId,
          authUser.id,
        )
        if (cancelled) return
        setGrants(next)
        setResolvedOrgId(activeOrgId)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setGrants([])
        setResolvedOrgId(activeOrgId)
        setError(
          err instanceof Error
            ? err
            : new Error('Não foi possível carregar permissões.'),
        )
        setStatus('error')
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [
    activeOrgId,
    authUser,
    isAuthenticated,
    isAuthLoading,
    orgLoading,
    repository,
  ])

  const grantsStaleForOrg =
    activeOrgId != null && resolvedOrgId !== activeOrgId

  const isLoading =
    isAuthLoading ||
    orgLoading ||
    status === 'loading' ||
    grantsStaleForOrg ||
    resolvedOrgId === undefined

  const value = useMemo<PermissionContextValue>(
    () => ({
      grants,
      isLoading,
      status: isLoading ? 'loading' : status,
      error,
      // Deny while unresolved — callers must check isLoading before Forbidden.
      can: (key) => (!isLoading && status === 'ready' ? canCheck(grants, key) : false),
      cannot: (key) =>
        !isLoading && status === 'ready' ? cannotCheck(grants, key) : true,
      canAny: (keys) =>
        !isLoading && status === 'ready' ? canAnyCheck(grants, keys) : false,
      canAll: (keys) =>
        !isLoading && status === 'ready' ? canAllCheck(grants, keys) : false,
    }),
    [error, grants, isLoading, status],
  )

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermission() {
  const ctx = useContext(PermissionContext)
  if (!ctx) {
    throw new Error('usePermission must be used within PermissionProvider')
  }
  return ctx
}
