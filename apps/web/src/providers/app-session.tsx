import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import {
  getAuthDisplayName,
  type AuthUser,
} from '@rescript/auth'
import { authService, type LoginResult } from '#/lib/auth/auth-service'
import { createBrowserSupabaseClient } from '#/lib/supabase/client'
import { getContext } from '#/integrations/tanstack-query/root-provider'
import { clearActiveOrganizationId } from '#/platform/organization/active-organization'

type AppSessionValue = {
  /** Real Supabase Auth identity — null while loading or logged out */
  authUser: AuthUser | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
}

const AppSessionContext = createContext<AppSessionValue | null>(null)

function toAuthUser(user: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}): AuthUser {
  const email = user.email ?? ''
  return {
    id: user.id,
    email,
    displayName: getAuthDisplayName({
      email,
      userMetadata: user.user_metadata ?? null,
    }),
  }
}

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [isAuthLoading, setAuthLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    let active = true

    void supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!active) return
      const sessionUser = data.session?.user
      setAuthUser(sessionUser ? toAuthUser(sessionUser) : null)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!active) return
        setAuthUser(session?.user ? toAuthUser(session.user) : null)
        setAuthLoading(false)
      },
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    return authService.login(email, password)
  }, [])

  const logout = useCallback(async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await authService.logout()
      setAuthUser(null)
      clearActiveOrganizationId()
      getContext().queryClient.clear()
    } finally {
      setLoggingOut(false)
    }
  }, [loggingOut])

  const value = useMemo<AppSessionValue>(
    () => ({
      authUser,
      isAuthenticated: Boolean(authUser),
      isAuthLoading,
      login,
      logout,
    }),
    [authUser, isAuthLoading, login, logout],
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
