import { Link, createFileRoute } from '@tanstack/react-router'
import { usePermission } from '#/platform/permissions'

export const Route = createFileRoute('/_app/finance/')({
  component: FinanceOverview,
})

function FinanceOverview() {
  const { can } = usePermission()
  const areas = [
    { to: '/finance/receivables', label: 'Contas a receber', description: 'Acompanhe obrigações de clientes, vencimentos e saldos.', permission: 'receivables.read' },
    { to: '/finance/accounts-payable', label: 'Contas a pagar', description: 'Controle compromissos, parcelas e vencimentos com fornecedores.', permission: 'payable.read' },
    { to: '/finance/payments', label: 'Pagamentos', description: 'Registre e acompanhe pagamentos efetuados.', permission: 'payments.read' },
  ] as const
  const visible = areas.filter((area) => can(area.permission))

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {visible.map((area) => (
        <Link
          key={area.to}
          to={area.to}
          className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] hover:bg-[var(--color-hover)]"
        >
          <h2 className="font-medium text-[var(--color-ink)]">{area.label}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{area.description}</p>
        </Link>
      ))}
      {!visible.length ? (
        <p className="text-sm text-[var(--color-muted)]">Nenhuma área financeira disponível para seu acesso.</p>
      ) : null}
    </section>
  )
}
