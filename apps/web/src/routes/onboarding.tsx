import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { fetchAuthSession } from '#/lib/auth/fetch-auth-session'
import { fetchMembershipGate } from '#/lib/org/fetch-membership-gate'

/** Public acquisition funnel. It intentionally creates no operational tenant. */
export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    const { user } = await fetchAuthSession()
    if (user && (await fetchMembershipGate()).hasActiveMembership) {
      throw redirect({ to: '/app/onboarding' })
    }
  },
  component: OnboardingLayout,
})

/**
 * `/onboarding` is the layout route for the public acquisition flow. Keeping
 * the child outlet here is essential: rendering the account form at this
 * level would mask `/onboarding/perfil`, `/onboarding/empresa`, and the
 * remaining steps after a successful save.
 */
function OnboardingLayout() {
  return <Outlet />
}
