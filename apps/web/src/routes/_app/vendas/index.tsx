import { useMemo, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { EmptyState } from '#/components/EmptyState'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { SearchBar } from '#/components/SearchBar'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { formatBRL, formatDate } from '#/lib/format'
import { sales } from '#/mocks/data'
import { cn } from '#/lib/utils'

const presets = ['Todas', 'Abertas', 'Confirmadas'] as const

export const Route = createFileRoute('/_app/vendas/')({
  component: SalesListPage,
})

function SalesListPage() {
  const [query, setQuery] = useState('')
  const [preset, setPreset] = useState<(typeof presets)[number]>('Todas')
  const navigate = useNavigate()

  const rows = useMemo(() => {
    return sales.filter((sale) => {
      const q = query.toLowerCase()
      const matchesQuery =
        sale.number.includes(query) ||
        sale.customerName.toLowerCase().includes(q) ||
        sale.status.toLowerCase().includes(q)
      const matchesPreset =
        preset === 'Todas' ||
        (preset === 'Confirmadas' && sale.status === 'Confirmada') ||
        (preset === 'Abertas' &&
          ['Rascunho', 'Orçamento', 'Pedido'].includes(sale.status))
      return matchesQuery && matchesPreset
    })
  }, [preset, query])

  return (
    <div>
      <PageHeader
        title="Vendas"
        description="Ciclo único Sale — rascunho até confirmada."
        actions={<Button disabled>Nova venda</Button>}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar venda…" />
        <div className="flex flex-wrap gap-2">
          {presets.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPreset(item)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition',
                preset === item
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-ink-muted)] border border-[var(--color-line)]',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon="sale"
          title="Nenhuma venda neste filtro"
          description="Limpe os filtros para ver tudo."
        />
      ) : (
        <EntityTable headers={['Número', 'Cliente', 'Status', 'Total', 'Atualizado']}>
          {rows.map((sale) => (
            <EntityRow
              key={sale.id}
              onClick={() =>
                void navigate({
                  to: '/vendas/$saleId',
                  params: { saleId: sale.id },
                })
              }
            >
              <EntityCell>
                <Link
                  to="/vendas/$saleId"
                  params={{ saleId: sale.id }}
                  className="font-mono text-[var(--color-accent)] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {sale.number}
                </Link>
              </EntityCell>
              <EntityCell>{sale.customerName}</EntityCell>
              <EntityCell>
                <StatusBadge status={sale.status} />
              </EntityCell>
              <EntityCell mono>{formatBRL(sale.total)}</EntityCell>
              <EntityCell>{formatDate(sale.updatedAt)}</EntityCell>
            </EntityRow>
          ))}
        </EntityTable>
      )}
    </div>
  )
}
