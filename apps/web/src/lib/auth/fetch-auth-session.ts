import { createServerFn } from '@tanstack/react-start'
import {
  resolveUserDisplayName,
  resolveUserFirstName,
  type AuthUser,
} from '@rescript/auth'

export type AuthClaimsResult = {
  user: AuthUser | null
}

/**
 * Validates JWT via getClaims() on the server (RPC).
 * Safe to import from route files — client receives an RPC stub.
 */
export const fetchAuthSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthClaimsResult> => {
    const { createServerSupabaseClient } = await import(
      '#/lib/supabase/server.server'
    )
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.getClaims()

    if (error || !data?.claims) {
      return { user: null }
    }

    const claims = data.claims as {
      sub?: string
      email?: string
      user_metadata?: Record<string, unknown>
    }

    const id = claims.sub
    if (!id) return { user: null }

    const email = typeof claims.email === 'string' ? claims.email : ''
    const source = {
      email,
      userMetadata: claims.user_metadata ?? null,
    }

    return {
      user: {
        id,
        email,
        displayName: resolveUserDisplayName(source),
        firstName: resolveUserFirstName(source),
      },
    }
  },
)
