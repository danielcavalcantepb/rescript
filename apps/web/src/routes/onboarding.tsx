import { createFileRoute, redirect } from '@tanstack/react-router'
import { AcquisitionOnboardingPage } from '#/modules/acquisition/ui/acquisition-onboarding-page'
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
  component: AcquisitionOnboardingPage,
})
