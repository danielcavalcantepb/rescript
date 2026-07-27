import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import {
  hasResolvedUserName,
  resolveUserDisplayName,
  resolveUserFirstName,
  type AuthUser,
} from '@rescript/auth'
import {
  authService,
  type LoginResult,
  type UpdateProfileNameResult,
} from '#/lib/auth/auth-service'
import { createBrowserSupabaseClient } from '#/lib/supabase/client'
import { getContext } from '#/integrations/tanstack-query/root-provider'
import { clearActiveOrganizationId } from '#/platform/organization/active-organization'

type AppSessionValue = {
  /** Real Supabase Auth identity — null while loading or logged out */
  authUser: AuthUser | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  /** True when a real human name is missing from metadata/profile. */
  needsDisplayName: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  updateDisplayName: (fullName: string) => Promise<UpdateProfileNameResult>
}

const AppSessionContext = createContext<AppSessionValue | null>(null)

export function toAuthUser(user: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}): AuthUser {
  const email = user.email ?? ''
  const source = {
    email,
    userMetadata: user.user_metadata ?? null,
  }
  return {
    id: user.id,
    email,
    displayName: resolveUserDisplayName(source),
    firstName: resolveUserFirstName(source),
  }
}

function needsName(user: User | null | undefined): boolean {
  if (!user) return false
  return !hasResolvedUserName({
    email: user.email,
    userMetadata: user.user_metadata ?? null,
  })
}

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [isAuthLoading, setAuthLoading] = useState(true)
  const [needsDisplayName, setNeedsDisplayName] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const applyUser = useCallback((user: User | null) => {
    setAuthUser(user ? toAuthUser(user) : null)
    setNeedsDisplayName(needsName(user))
  }, [])

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    let active = true

    void supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!active) return
      applyUser(data.session?.user ?? null)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!active) return
        applyUser(session?.user ?? null)
        setAuthLoading(false)
      },
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [applyUser])

  const login = useCallback(async (email: string, password: string) => {
    return authService.login(email, password)
  }, [])

  const logout = useCallback(async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await authService.logout()
      setAuthUser(null)
      setNeedsDisplayName(false)
      clearActiveOrganizationId()
      getContext().queryClient.clear()
    } finally {
      setLoggingOut(false)
    }
  }, [loggingOut])

  const updateDisplayName = useCallback(async (fullName: string) => {
    const result = await authService.updateProfileName(fullName)
    if (result.ok) {
      const supabase = createBrowserSupabaseClient()
      const { data } = await supabase.auth.getUser()
      applyUser(data.user ?? null)
    }
    return result
  }, [applyUser])

  const value = useMemo<AppSessionValue>(
    () => ({
      authUser,
      isAuthenticated: Boolean(authUser),
      isAuthLoading,
      needsDisplayName,
      login,
      logout,
      updateDisplayName,
    }),
    [
      authUser,
      isAuthLoading,
      needsDisplayName,
      login,
      logout,
      updateDisplayName,
    ],
  )

  return (
    <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(AppSessionContext)
  if (!ctx) throw new Error('useSession must be used within AppSessionProvider')
  return ctx
}
