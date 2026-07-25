import { createServerFn } from '@tanstack/react-start'

export type MembershipGateResult = {
  hasActiveMembership: boolean
}

/**
 * Server check: authenticated user has at least one active membership.
 * Used to route between onboarding and the app shell.
 */
export const fetchMembershipGate = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MembershipGateResult> => {
    const { createServerSupabaseClient } = await import(
      '#/lib/supabase/server.server'
    )
    const supabase = createServerSupabaseClient()
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims()

    if (claimsError || !claimsData?.claims?.sub) {
      return { hasActiveMembership: false }
    }

    const { data, error } = await supabase
      .from('membership')
      .select('id')
      .eq('status', 'active')
      .limit(1)

    if (error) {
      // Tables missing / RLS misconfigured — treat as no membership (force setup path)
      return { hasActiveMembership: false }
    }

    return { hasActiveMembership: (data?.length ?? 0) > 0 }
  },
)
