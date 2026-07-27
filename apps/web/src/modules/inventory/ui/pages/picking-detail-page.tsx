import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { formatDateTime } from '#/lib/format'
import {
  pickingOpenQuantity,
  pickingStatusLabel,
  type InventoryPickingDetail,
} from '#/modules/inventory'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission } from '#/platform/permissions'
import {
  useCreateInventoryPacking,
  useInventoryPackings,
} from '../hooks/use-inventory-packings'
import {
  useCancelInventoryPicking,
  useCompleteInventoryPicking,
  useInventoryPicking,
  useStartInventoryPicking,
  useUpdateInventoryPickingItems,
} from '../hooks/use-inventory-pickings'

export function PickingDetailPage({ pickingId }: { pickingId: string }) {
  return (
    <RequirePermission
      permission="picking.read"
      forbiddenDescription="Você não tem permissão para ver esta separação."
    >
      <PickingDetailContent pickingId={pickingId} />
    </RequirePermission>
  )
}

function PickingDetailContent({ pickingId }: { pickingId: string }) {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const picking = useInventoryPicking(organizationId, pickingId)
  const relatedPackings = useInventoryPackings(
    organizationId,
    { q: picking.data?.number, limit: 10 },
    Boolean(organizationId && picking.data?.number),
  )
  const createPacking = useCreateInventoryPacking(organizationId)
  const start = useStartInventoryPicking(organizationId)
  const updateItems = useUpdateInventoryPickingItems(organizationId)
  const complete = useCompleteInventoryPicking(organizationId)
  const cancel = useCancelInventoryPicking(organizationId)
  const [reason, setReason] = useState('')
  const [quantities, setQuantities] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!picking.data) return
    setQuantities(
      Object.fromEntries(
        picking.data.items.map((item) => [item.id, item.quantityPicked]),
      ),
    )
  }, [picking.data])

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }
  if (picking.isLoading) return <PageLoading />
  if (picking.isError || !picking.data) {
    return (
      <PageError
        error={picking.error ?? new Error('picking_not_found')}
        onRetry={() => void picking.refetch()}
      />
    )
  }

  const document = picking.data
  const busy =
    start.isPending ||
    updateItems.isPending ||
    complete.isPending ||
    cancel.isPending ||
    createPacking.isPending
  const canEditItems = ['in_progress', 'partially_picked'].includes(
    document.status,
  )
  const hasPacking = relatedPackings.data?.some(
    (packing) => packing.pickingId === document.id,
  )

  async function startPicking() {
    await start.mutateAsync(document.id)
    await picking.refetch()
  }

  async function saveItems() {
    await updateItems.mutateAsync({
      pickingId: document.id,
      items: document.items.map((item) => ({
        itemId: item.id,
        quantity: quantities[item.id] ?? item.quantityPicked,
      })),
      reason: reason || null,
    })
    setReason('')
    await picking.refetch()
  }

  async function completePicking() {
    await complete.mutateAsync(document.id)
    await picking.refetch()
  }

  async function cancelPicking() {
    await cancel.mutateAsync({
      pickingId: document.id,
      reason: reason || null,
    })
    setReason('')
    await picking.refetch()
  }

  async function createPackingFromPicking() {
    const packingId = await createPacking.mutateAsync({
      pickingId: document.id,
    })
    await navigate({
      to: '/catalog/inventory/packings/$packingId',
      params: { packingId },
    })
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: 'Central', href: '/' },
          { label: 'Estoque', href: '/catalog/inventory/items' },
          { label: 'Separações', href: '/catalog/inventory/pickings' },
          { label: document.number },
        ]}
      />
      <PageHeader
        title={document.number}
        description={`${document.sourceNumber} · ${document.customerName}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={pickingStatusLabel(document.status)} />
            {document.status === 'completed' && !hasPacking ? (
              <FeatureGate permission="packing.create">
                <Button
                  variant="secondary"
                  disabled={busy || relatedPackings.isLoading}
                  onClick={() => void createPackingFromPicking()}
                >
                  Criar Packing
                </Button>
              </FeatureGate>
            ) : null}
            <Actions
              document={document}
              reason={reason}
              setReason={setReason}
              busy={busy}
              onStart={startPicking}
              onSaveItems={saveItems}
              onComplete={completePicking}
              onCancel={cancelPicking}
            />
          </div>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Cliente" value={document.customerName} />
        <Metric label="Pedido" value={document.sourceNumber} />
        <Metric label="Reservado" value={formatQuantity(document.totalQuantityReserved)} />
        <Metric label="Separado" value={formatQuantity(document.totalQuantityPicked)} />
        <Metric label="Status" value={pickingStatusLabel(document.status)} />
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-semibold">Itens para separação</h2>
            <EntityTable
              headers={[
                'Produto',
                'SKU',
                'Unidade',
                'Reservado',
                'Separado',
                'Pendente',
                'Status',
              ]}
            >
              {document.items.map((item) => (
                <EntityRow key={item.id}>
                  <EntityCell>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {item.description ?? 'Snapshot da reserva'}
                    </div>
                  </EntityCell>
                  <EntityCell mono>{item.sku}</EntityCell>
                  <EntityCell>{item.unitCode}</EntityCell>
                  <EntityCell>{formatQuantity(item.quantityReserved)}</EntityCell>
                  <EntityCell>
                    {canEditItems ? (
                      <Input
                        className="w-28"
                        inputMode="decimal"
                        value={quantities[item.id] ?? item.quantityPicked}
                        onChange={(event) =>
                          setQuantities((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        aria-label={`Quantidade separada de ${item.productName}`}
                      />
                    ) : (
                      formatQuantity(item.quantityPicked)
                    )}
                  </EntityCell>
                  <EntityCell>
                    {formatQuantity(
                      String(
                        pickingOpenQuantity(
                          item.quantityReserved,
                          quantities[item.id] ?? item.quantityPicked,
                        ),
                      ),
                    )}
                  </EntityCell>
                  <EntityCell>
                    <StatusBadge status={pickingStatusLabel(item.status)} />
                  </EntityCell>
                </EntityRow>
              ))}
            </EntityTable>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Histórico</h2>
            <ul className="space-y-2">
              {document.history.map((entry) => (
                <li
                  className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3 text-sm"
                  key={entry.id}
                >
                  <strong>{entry.action}</strong> · {formatDateTime(entry.createdAt)}
                  {entry.oldValue || entry.newValue
                    ? ` · ${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}`
                    : ''}
                  {entry.reason ? ` · ${entry.reason}` : ''}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
          <h2 className="font-semibold">Resumo da separação</h2>
          <Info label="Cliente" value={document.customerName} />
          <Info label="Documento" value={document.customerDocument ?? '—'} />
          <Info label="Contato" value={document.customerEmail ?? document.customerPhone ?? '—'} />
          <Info label="Local padrão" value={document.locationId} />
          <Info label="Criada em" value={formatDateTime(document.createdAt)} />
          <Link
            className="text-sm text-[var(--color-primary)] hover:underline"
            to="/catalog/inventory/reservations/$reservationId"
            params={{ reservationId: document.reservationId }}
          >
            Abrir reserva
          </Link>
          <Link
            className="block text-sm text-[var(--color-primary)] hover:underline"
            to="/sales/orders/$orderId"
            params={{ orderId: document.sourceId }}
          >
            Abrir pedido de venda
          </Link>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Separação confirma a operação física de picking. Ela não altera On
            Hand, Reserved, Available, ledger, expedição ou financeiro.
          </p>
        </aside>
      </section>
    </div>
  )
}

function Actions({
  document,
  reason,
  setReason,
  busy,
  onStart,
  onSaveItems,
  onComplete,
  onCancel,
}: {
  document: InventoryPickingDetail
  reason: string
  setReason: (value: string) => void
  busy: boolean
  onStart: () => Promise<void>
  onSaveItems: () => Promise<void>
  onComplete: () => Promise<void>
  onCancel: () => Promise<void>
}) {
  return (
    <>
      {document.status === 'draft' ? (
        <FeatureGate permission="picking.start">
          <Button disabled={busy} onClick={() => void onStart()}>
            Iniciar separação
          </Button>
        </FeatureGate>
      ) : null}
      {['in_progress', 'partially_picked'].includes(document.status) ? (
        <>
          <FeatureGate permission="picking.edit">
            <Input
              className="w-48"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Motivo"
            />
            <Button variant="secondary" disabled={busy} onClick={() => void onSaveItems()}>
              Salvar itens
            </Button>
          </FeatureGate>
          <FeatureGate permission="picking.complete">
            <Button disabled={busy} onClick={() => void onComplete()}>
              Concluir separação
            </Button>
          </FeatureGate>
          <FeatureGate permission="picking.cancel">
            <Button
              variant="secondary"
              disabled={busy || !reason.trim()}
              onClick={() => void onCancel()}
            >
              Cancelar separação
            </Button>
          </FeatureGate>
        </>
      ) : null}
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
      <div className="mt-1 truncate text-lg font-semibold text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
      <div className="break-all text-sm text-[var(--color-ink)]">{value}</div>
    </div>
  )
}

function formatQuantity(value: string) {
  return Number(value).toLocaleString('pt-BR', {
    maximumFractionDigits: 6,
  })
}
