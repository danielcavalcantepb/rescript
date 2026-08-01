import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { RescriptLogo } from '#/components/brand/RescriptLogo'
import { Button } from '#/components/ui/button'
import { AppLayout } from '#/components/layout/AppLayout'
import { fetchAuthSession } from '#/lib/auth/fetch-auth-session'
import { fetchMembershipGate } from '#/lib/org/fetch-membership-gate'

/**
 * Operational onboarding is deliberately separate from the public acquisition
 * funnel. Accounts reach this route only after a tenant/membership exists.
 */
export const Route = createFileRoute('/app/onboarding')({
  beforeLoad: async () => {
    const { user } = await fetchAuthSession()
    if (!user) throw redirect({ to: '/login' })
    if (!(await fetchMembershipGate()).hasActiveMembership) {
      throw redirect({ to: '/onboarding' })
    }
  },
  component: OperationalOnboarding,
})

function OperationalOnboarding() {
  return (
    <AppLayout>
      <main className="mx-auto max-w-4xl p-6">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-7">
          <RescriptLogo variant="auth" />
          <p className="mt-7 text-sm text-[var(--color-text-secondary)]">Onboarding operacional</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-ink)]">Sua empresa está pronta para configurar.</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Cadastre clientes, produtos e estoque inicial para iniciar a operação.</p>
          <div className="mt-6 flex gap-3">
            <Button asChild><Link to="/app">Ir para a Central</Link></Button>
            <Button asChild variant="secondary"><Link to="/crm/customers/new">Cadastrar cliente</Link></Button>
          </div>
        </section>
      </main>
    </AppLayout>
  )
}
