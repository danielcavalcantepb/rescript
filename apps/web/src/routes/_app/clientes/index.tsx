import { useMemo, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { EmptyState } from '#/components/EmptyState'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { SearchBar } from '#/components/SearchBar'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { formatDate } from '#/lib/format'
import { customers } from '#/mocks/data'

export const Route = createFileRoute('/_app/clientes/')({
  component: CustomersListPage,
})

function CustomersListPage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const rows = useMemo(
    () =>
      customers.filter((c) => {
        const q = query.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          c.document.includes(query) ||
          c.city.toLowerCase().includes(q)
        )
      }),
    [query],
  )

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Cadastro comercial — dados mockados."
        actions={<Button disabled>Novo cliente</Button>}
      />
      <div className="mb-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar cliente…" />
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon="customer"
          title="Nenhum cliente encontrado"
          description="Tente outro termo ou limpe a busca."
          action={
            <Button variant="secondary" onClick={() => setQuery('')}>
              Limpar busca
            </Button>
          }
        />
      ) : (
        <EntityTable headers={['Cliente', 'Documento', 'Cidade', 'Status', 'Última compra']}>
          {rows.map((customer) => (
            <EntityRow
              key={customer.id}
              onClick={() =>
                void navigate({
                  to: '/clientes/$customerId',
                  params: { customerId: customer.id },
                })
              }
            >
              <EntityCell>
                <Link
                  to="/clientes/$customerId"
                  params={{ customerId: customer.id }}
                  className="font-medium hover:text-[var(--color-accent)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {customer.name}
                </Link>
                {customer.tradeName ? (
                  <span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">
                    {customer.tradeName}
                  </span>
                ) : null}
              </EntityCell>
              <EntityCell mono>{customer.document}</EntityCell>
              <EntityCell>{customer.city}</EntityCell>
              <EntityCell>
                <StatusBadge status={customer.status} />
              </EntityCell>
              <EntityCell>
                {customer.lastPurchaseAt ? formatDate(customer.lastPurchaseAt) : '—'}
              </EntityCell>
            </EntityRow>
          ))}
        </EntityTable>
      )}
    </div>
  )
}
