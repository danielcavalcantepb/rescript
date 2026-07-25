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

type PermissionContextValue = {
  grants: readonly PermissionKey[]
  isLoading: boolean
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
  const { authUser, isAuthenticated } = useSession()
  const { currentOrganization } = useOrganization()
  const [grants, setGrants] = useState<readonly PermissionKey[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (
        !isAuthenticated ||
        !authUser ||
        !currentOrganization ||
        currentOrganization.status !== 'active'
      ) {
        if (!cancelled) {
          setGrants([])
          setIsLoading(false)
        }
        return
      }
      setIsLoading(true)
      try {
        const next = await repository.listForMembership(
          currentOrganization.id,
          authUser.id,
        )
        if (cancelled) return
        setGrants(next)
      } catch {
        if (!cancelled) setGrants([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [authUser, currentOrganization, isAuthenticated, repository])

  const value = useMemo<PermissionContextValue>(
    () => ({
      grants,
      isLoading,
      can: (key) => canCheck(grants, key),
      cannot: (key) => cannotCheck(grants, key),
      canAny: (keys) => canAnyCheck(grants, keys),
      canAll: (keys) => canAllCheck(grants, keys),
    }),
    [grants, isLoading],
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
