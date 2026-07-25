import { Link, createFileRoute } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { formatBRL, formatDate } from '#/lib/format'
import { getCustomer, salesForCustomer } from '#/mocks/data'

export const Route = createFileRoute('/_app/clientes/$customerId')({
  component: CustomerDetailPage,
})

function CustomerDetailPage() {
  const { customerId } = Route.useParams()
  const customer = getCustomer(customerId)
  const history = customer ? salesForCustomer(customer.id) : []

  if (!customer) {
    return (
      <div>
        <PageHeader title="Cliente não encontrado" />
        <Button asChild variant="secondary">
          <Link to="/clientes">Voltar</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <AppBreadcrumb
        items={[
          { label: 'Clientes', href: '/clientes' },
          { label: customer.name },
        ]}
      />
      <PageHeader
        title={customer.name}
        description={`${customer.personType} · ${customer.document}`}
        actions={
          <>
            <StatusBadge status={customer.status} />
            <Button asChild>
              <Link to="/vendas">Nova venda</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h2 className="text-sm font-medium text-[var(--color-ink-muted)] uppercase">
            Dados
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="E-mail" value={customer.email} />
            <Row label="Telefone" value={customer.phone} />
            <Row label="Cidade" value={customer.city} />
            <Row label="Observações" value={customer.notes ?? '—'} />
          </dl>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)] uppercase">
            Histórico de vendas
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">Nenhuma venda ainda.</p>
          ) : (
            <EntityTable headers={['Número', 'Status', 'Total', 'Atualizado']}>
              {history.map((sale) => (
                <EntityRow key={sale.id}>
                  <EntityCell>
                    <Link
                      to="/vendas/$saleId"
                      params={{ saleId: sale.id }}
                      className="font-mono text-[var(--color-accent)] hover:underline"
                    >
                      {sale.number}
                    </Link>
                  </EntityCell>
                  <EntityCell>
                    <StatusBadge status={sale.status} />
                  </EntityCell>
                  <EntityCell mono>{formatBRL(sale.total)}</EntityCell>
                  <EntityCell>{formatDate(sale.updatedAt)}</EntityCell>
                </EntityRow>
              ))}
            </EntityTable>
          )}
        </section>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--color-ink-muted)]">{label}</dt>
      <dd className="mt-0.5 text-[var(--color-ink)]">{value}</dd>
    </div>
  )
}
