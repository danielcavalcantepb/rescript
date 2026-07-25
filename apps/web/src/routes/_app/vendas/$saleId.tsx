import { Link, createFileRoute } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { StatusBadge } from '#/components/StatusBadge'
import { Timeline } from '#/components/Timeline'
import { Button } from '#/components/ui/button'
import { formatBRL, formatDateTime } from '#/lib/format'
import { getSale } from '#/mocks/data'

export const Route = createFileRoute('/_app/vendas/$saleId')({
  component: SaleDetailPage,
})

function SaleDetailPage() {
  const { saleId } = Route.useParams()
  const sale = getSale(saleId)

  if (!sale) {
    return (
      <div>
        <PageHeader title="Venda não encontrada" />
        <Button asChild variant="secondary">
          <Link to="/vendas">Voltar</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <AppBreadcrumb
        items={[
          { label: 'Vendas', href: '/vendas' },
          { label: sale.number },
        ]}
      />
      <PageHeader
        title={`Venda ${sale.number}`}
        description={`${sale.customerName} · ${sale.sellerName}`}
        actions={
          <>
            <StatusBadge status={sale.status} />
            {sale.status === 'Pedido' ? (
              <Button disabled title="Mock — lógica na Sprint 1">
                Confirmar venda
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <EntityTable headers={['Item', 'SKU', 'Qtd', 'Preço', 'Total']}>
            {sale.items.map((item) => (
              <EntityRow key={`${item.sku}-${item.quantity}`}>
                <EntityCell>{item.productName}</EntityCell>
                <EntityCell mono>{item.sku}</EntityCell>
                <EntityCell mono>
                  {item.quantity} {item.unit}
                </EntityCell>
                <EntityCell mono>{formatBRL(item.unitPrice)}</EntityCell>
                <EntityCell mono>{formatBRL(item.lineTotal)}</EntityCell>
              </EntityRow>
            ))}
          </EntityTable>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h2 className="text-sm font-medium text-[var(--color-ink-muted)] uppercase">
              Totais
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-muted)]">Subtotal</dt>
                <dd className="font-mono">{formatBRL(sale.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-muted)]">Desconto</dt>
                <dd className="font-mono">{formatBRL(sale.discountTotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-[var(--color-line)] pt-2 font-medium">
                <dt>Total</dt>
                <dd className="font-mono">{formatBRL(sale.total)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h2 className="text-sm font-medium text-[var(--color-ink-muted)] uppercase">
              Contexto
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[var(--color-ink-muted)]">Cliente</dt>
                <dd className="mt-0.5">
                  {sale.customerId ? (
                    <Link
                      to="/clientes/$customerId"
                      params={{ customerId: sale.customerId }}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      {sale.customerName}
                    </Link>
                  ) : (
                    sale.customerName
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-ink-muted)]">Atualizado</dt>
                <dd className="mt-0.5">{formatDateTime(sale.updatedAt)}</dd>
              </div>
              {sale.confirmedAt ? (
                <div>
                  <dt className="text-[var(--color-ink-muted)]">Confirmada em</dt>
                  <dd className="mt-0.5">{formatDateTime(sale.confirmedAt)}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h2 className="mb-4 text-sm font-medium text-[var(--color-ink-muted)] uppercase">
              Timeline
            </h2>
            <Timeline items={sale.timeline} />
          </section>
        </div>
      </div>
    </div>
  )
}
