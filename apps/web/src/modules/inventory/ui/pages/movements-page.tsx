import { useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission } from '#/platform/permissions'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'
import { CatalogEmptyState } from '#/modules/catalog/ui/empty-states/CatalogEmptyState'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { CatalogLoadingState } from '#/modules/catalog/ui/loading/CatalogLoadingState'
import {
  useMovement,
  useMovements,
} from '#/modules/inventory/ui/hooks/use-inventory-foundation'
import type { LedgerMovementType } from '#/modules/inventory/domain/ledger/types'
import type { MovementCreateKind } from '#/modules/inventory/ui/pages/movement-create-page'

const TYPE_FILTERS: Array<{ value: '' | LedgerMovementType; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'entry', label: 'Entrada' },
  { value: 'exit', label: 'Saída' },
  { value: 'adjustment_in', label: 'Ajuste (+)' },
  { value: 'adjustment_out', label: 'Ajuste (−)' },
  { value: 'transfer_in', label: 'Transferência (entrada)' },
  { value: 'transfer_out', label: 'Transferência (saída)' },
  { value: 'reversal', label: 'Estorno' },
]

const TYPE_LABELS: Record<LedgerMovementType, string> = {
  entry: 'Entrada',
  exit: 'Saída',
  adjustment_in: 'Ajuste (+)',
  adjustment_out: 'Ajuste (−)',
  transfer_in: 'Transferência (entrada)',
  transfer_out: 'Transferência (saída)',
  reversal: 'Estorno',
}

const CREATE_KINDS: Array<{ kind: MovementCreateKind; label: string }> = [
  { kind: 'entry', label: 'Entrada' },
  { kind: 'exit', label: 'Saída' },
  { kind: 'adjustment', label: 'Ajuste' },
  { kind: 'transfer', label: 'Transferência' },
]

export function MovementsPage() {
  return (
    <RequirePermission
      permission="inventory.movements.read"
      forbiddenDescription="Você não tem permissão para ver movimentações de estoque."
    >
      <MovementsContent />
    </RequirePermission>
  )
}

function MovementsContent() {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const orgActive = currentOrganization?.status === 'active'
  const [typeFilter, setTypeFilter] = useState<'' | LedgerMovementType>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const query = useMovements(
    organizationId,
    typeFilter ? { type: typeFilter } : undefined,
    Boolean(organizationId) && orgActive,
  )
  const detail = useMovement(organizationId, selectedId ?? undefined)

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  return (
    <CatalogShell
      title="Movimentações"
      description="Ledger de estoque — entradas, saídas, ajustes e transferências."
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Estoque', href: '/estoque' },
        { label: 'Estoque', href: '/catalog/inventory' },
        { label: 'Movimentações' },
      ]}
      actions={
        <FeatureGate permission="inventory.movements.create">
          <div className="flex flex-wrap gap-2">
            {CREATE_KINDS.map(({ kind, label }) => (
              <Button
                key={kind}
                type="button"
                size="sm"
                variant={kind === 'entry' ? 'primary' : 'secondary'}
                onClick={() =>
                  void navigate({
                    to: '/catalog/inventory/movements/new',
                    search: { kind },
                  })
                }
              >
                {label}
              </Button>
            ))}
          </div>
        </FeatureGate>
      }
    >
      <CatalogToolbar
        title="Ledger"
        description="Saldo projetado a partir dos movimentos registrados."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {TYPE_FILTERS.map((filter) => (
          <Button
            key={filter.value || 'all'}
            type="button"
            size="sm"
            variant={typeFilter === filter.value ? 'primary' : 'secondary'}
            onClick={() => setTypeFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {query.isLoading ? (
        <CatalogLoadingState label="Carregando movimentações…" />
      ) : null}
      {query.isError ? (
        <CatalogErrorState onRetry={() => void query.refetch()} />
      ) : null}
      {query.data && query.data.length === 0 ? (
        <CatalogEmptyState
          title="Nenhuma movimentação"
          description="Registre uma entrada para iniciar o saldo da variante no local."
          action={
            <FeatureGate permission="inventory.movements.create">
              <Button
                type="button"
                onClick={() =>
                  void navigate({
                    to: '/catalog/inventory/movements/new',
                    search: { kind: 'entry' },
                  })
                }
              >
                Registrar entrada
              </Button>
            </FeatureGate>
          }
        />
      ) : null}
      {query.data && query.data.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-soft)]">
          <table className="w-full min-w-[800px] text-left text-[13px]">
            <thead className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Data</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Variante</th>
                <th className="px-3 py-2 font-medium">Local</th>
                <th className="px-3 py-2 font-medium">Qtd</th>
                <th className="px-3 py-2 font-medium">Delta</th>
                <th className="px-3 py-2 font-medium">Motivo</th>
                <th className="px-3 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((movement) => (
                <tr
                  key={movement.id}
                  className="border-b border-[var(--color-border-soft)] last:border-0"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatOccurredAt(movement.occurredAt)}
                  </td>
                  <td className="px-3 py-2">
                    {TYPE_LABELS[movement.type] ?? movement.type}
                  </td>
                  <td className="px-3 py-2 font-mono text-[12px]">
                    {shortId(movement.variantId)}
                  </td>
                  <td className="px-3 py-2 font-mono text-[12px]">
                    {shortId(movement.locationId)}
                  </td>
                  <td className="px-3 py-2">{movement.quantity}</td>
                  <td className="px-3 py-2">{formatDelta(movement.signedDelta)}</td>
                  <td className="px-3 py-2">{movement.reason || '—'}</td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedId(movement.id)}
                    >
                      Detalhes
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {selectedId ? (
        <div
          className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] p-4"
          role="region"
          aria-label="Detalhes do movimento"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[14px] font-medium text-[var(--color-ink)]">
              Detalhes do movimento
            </h3>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setSelectedId(null)}
            >
              Fechar
            </Button>
          </div>
          {detail.isLoading ? (
            <CatalogLoadingState label="Carregando detalhes…" />
          ) : null}
          {detail.isError ? (
            <CatalogErrorState onRetry={() => void detail.refetch()} />
          ) : null}
          {detail.data ? (
            <dl className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
              <Detail term="ID" mono>
                {detail.data.id}
              </Detail>
              <Detail term="Tipo">
                {TYPE_LABELS[detail.data.type] ?? detail.data.type}
              </Detail>
              <Detail term="Variante" mono>
                {detail.data.variantId}
              </Detail>
              <Detail term="Local" mono>
                {detail.data.locationId}
              </Detail>
              <Detail term="Quantidade">{detail.data.quantity}</Detail>
              <Detail term="Delta">{formatDelta(detail.data.signedDelta)}</Detail>
              <Detail term="Antes">{detail.data.beforeQuantity}</Detail>
              <Detail term="Depois">{detail.data.afterQuantity}</Detail>
              <Detail term="Motivo">{detail.data.reason || '—'}</Detail>
              <Detail term="Notas">{detail.data.notes || '—'}</Detail>
              <Detail term="Ocorrido em">
                {formatOccurredAt(detail.data.occurredAt)}
              </Detail>
              {detail.data.reversesMovementId ? (
                <Detail term="Estorna" mono>
                  {detail.data.reversesMovementId}
                </Detail>
              ) : null}
            </dl>
          ) : null}
        </div>
      ) : null}
    </CatalogShell>
  )
}

function Detail({
  term,
  children,
  mono,
}: {
  term: string
  children: ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-[var(--color-text-secondary)]">{term}</dt>
      <dd className={`mt-1 ${mono ? 'font-mono text-[12px] break-all' : ''}`}>
        {children}
      </dd>
    </div>
  )
}

function shortId(id: string) {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id
}

function formatDelta(delta: number) {
  return delta > 0 ? `+${delta}` : String(delta)
}

function formatOccurredAt(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR')
  } catch {
    return iso
  }
}
