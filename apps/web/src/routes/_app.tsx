import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '#/components/layout/AppLayout'
import { GlobalLoading } from '#/components/GlobalLoading'
import { fetchAuthSession } from '#/lib/auth/fetch-auth-session'
import { fetchMembershipGate } from '#/lib/org/fetch-membership-gate'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const { user } = await fetchAuthSession()
    if (!user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: `${location.pathname}${location.searchStr}`,
        },
      })
    }

    const { hasActiveMembership } = await fetchMembershipGate()
    if (!hasActiveMembership) {
      throw redirect({ to: '/onboarding' })
    }

    return { authUser: user }
  },
  pendingComponent: GlobalLoading,
  component: AppShell,
})

function AppShell() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
