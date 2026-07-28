import { Link, Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { PageHeader } from '#/components/PageHeader'
import { cn } from '#/lib/utils'
import { usePermission } from '#/platform/permissions'

export const Route = createFileRoute('/_app/finance')({
  component: FinancialWorkspace,
})

const areas = [
  { to: '/finance', label: 'Visão geral', permissions: ['receivables.read', 'payable.read', 'payments.read'] },
  { to: '/finance/receivables', label: 'Contas a receber', permissions: ['receivables.read'] },
  { to: '/finance/accounts-payable', label: 'Contas a pagar', permissions: ['payable.read'] },
  { to: '/finance/payments', label: 'Pagamentos', permissions: ['payments.read'] },
  { to: '/finance/cash', label: 'Caixa e fluxo', permissions: ['finance.cash_flow.read'] },
] as const

function FinancialWorkspace() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { canAny } = usePermission()
  const visible = areas.filter((area) => canAny(area.permissions))

  return (
    <div className="space-y-5">
      {pathname === '/finance' ? (
        <PageHeader
          title="Financeiro"
          description="Obrigações, recebíveis e pagamentos em uma única área operacional."
        />
      ) : null}
      <nav
        aria-label="Áreas do Financeiro"
        className="flex gap-2 overflow-x-auto border-b border-[var(--color-border-soft)] pb-2"
      >
        {visible.map((area) => {
          const active = area.to === '/finance'
            ? pathname === '/finance'
            : pathname.startsWith(area.to)
          return (
            <Link
              key={area.to}
              to={area.to}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-sm',
                active
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]',
              )}
            >
              {area.label}
            </Link>
          )
        })}
      </nav>
      <Outlet />
    </div>
  )
}
