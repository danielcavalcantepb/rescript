import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import {
  useCreateAdjustment,
  useCreateEntry,
  useCreateExit,
  useCreateTransfer,
  useLocations,
} from '#/modules/inventory/ui/hooks/use-inventory-foundation'

export type MovementCreateKind =
  | 'entry'
  | 'exit'
  | 'adjustment'
  | 'transfer'

const KIND_LABELS: Record<MovementCreateKind, string> = {
  entry: 'Entrada',
  exit: 'Saída',
  adjustment: 'Ajuste',
  transfer: 'Transferência',
}

export function MovementCreatePage({
  kind = 'entry',
}: {
  kind?: MovementCreateKind
}) {
  return (
    <RequirePermission
      permission="inventory.movements.create"
      forbiddenDescription="Você não tem permissão para registrar movimentações."
    >
      <MovementCreateContent kind={kind} />
    </RequirePermission>
  )
}

function MovementCreateContent({ kind }: { kind: MovementCreateKind }) {
  const navigate = useNavigate()
  const { currentOrganization, isLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const locations = useLocations(organizationId)
  const createEntry = useCreateEntry(organizationId)
  const createExit = useCreateExit(organizationId)
  const createAdjustment = useCreateAdjustment(organizationId)
  const createTransfer = useCreateTransfer(organizationId)

  const [variantId, setVariantId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [fromLocationId, setFromLocationId] = useState('')
  const [toLocationId, setToLocationId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const pending =
    createEntry.isPending ||
    createExit.isPending ||
    createAdjustment.isPending ||
    createTransfer.isPending

  if (isLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  const activeLocations =
    locations.data?.filter((l) => l.status !== 'archived') ?? []
  const defaultLocationId =
    activeLocations.find((l) => l.isDefault)?.id ||
    activeLocations[0]?.id ||
    ''

  const title = `Nova ${KIND_LABELS[kind].toLowerCase()}`

  return (
    <CatalogShell
      title={title}
      description="Registra um movimento no ledger. O saldo é projetado a partir dos movimentos."
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Estoque', href: '/estoque' },
        { label: 'Movimentações', href: '/catalog/inventory/movements' },
        { label: 'Novo' },
      ]}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          ['entry', 'exit', 'adjustment', 'transfer'] as MovementCreateKind[]
        ).map((k) => (
          <Button
            key={k}
            type="button"
            size="sm"
            variant={kind === k ? 'primary' : 'secondary'}
            disabled={pending}
            onClick={() =>
              void navigate({
                to: '/catalog/inventory/movements/new',
                search: { kind: k },
              })
            }
          >
            {KIND_LABELS[k]}
          </Button>
        ))}
      </div>

      <form
        className="max-w-lg space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (pending) return
          setError(null)
          const idempotencyKey = crypto.randomUUID()
          const qty = Number(quantity)
          const resolvedLocation = locationId || defaultLocationId
          const baseNotes = notes.trim() || null
          const baseReason = reason.trim()

          const goList = () => {
            notificationService.success('Movimento registrado')
            void navigate({ to: '/catalog/inventory/movements' })
          }
          const onFail = (err: Error) => {
            setError(err.message || 'Não foi possível registrar o movimento.')
          }

          if (kind === 'entry') {
            void createEntry
              .mutateAsync({
                variantId: variantId.trim(),
                locationId: resolvedLocation,
                quantity: qty,
                reason: baseReason,
                notes: baseNotes,
                idempotencyKey,
              })
              .then(goList)
              .catch(onFail)
            return
          }
          if (kind === 'exit') {
            void createExit
              .mutateAsync({
                variantId: variantId.trim(),
                locationId: resolvedLocation,
                quantity: qty,
                reason: baseReason,
                notes: baseNotes,
                idempotencyKey,
              })
              .then(goList)
              .catch(onFail)
            return
          }
          if (kind === 'adjustment') {
            void createAdjustment
              .mutateAsync({
                variantId: variantId.trim(),
                locationId: resolvedLocation,
                quantity: qty,
                direction,
                reason: baseReason,
                notes: baseNotes,
                idempotencyKey,
              })
              .then(goList)
              .catch(onFail)
            return
          }
          void createTransfer
            .mutateAsync({
              variantId: variantId.trim(),
              fromLocationId: fromLocationId || defaultLocationId,
              toLocationId: toLocationId,
              quantity: qty,
              reason: baseReason,
              notes: baseNotes,
              idempotencyKey,
            })
            .then(goList)
            .catch(onFail)
        }}
      >
        <label className="block space-y-1 text-[13px]">
          <span>Código da variante</span>
          <Input
            value={variantId}
            required
            disabled={pending}
            onChange={(e) => setVariantId(e.target.value)}
          />
        </label>

        {kind === 'transfer' ? (
          <>
            <label className="block space-y-1 text-[13px]">
              <span>Local de origem</span>
              <select
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2"
                value={fromLocationId}
                required
                disabled={pending || locations.isLoading}
                onChange={(e) => setFromLocationId(e.target.value)}
              >
                <option value="">Selecione…</option>
                {activeLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.name}
                    {l.isDefault ? ' (padrão)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-[13px]">
              <span>Local de destino</span>
              <select
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2"
                value={toLocationId}
                required
                disabled={pending || locations.isLoading}
                onChange={(e) => setToLocationId(e.target.value)}
              >
                <option value="">Selecione…</option>
                {activeLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.name}
                    {l.isDefault ? ' (padrão)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <label className="block space-y-1 text-[13px]">
            <span>Local</span>
            <select
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2"
              value={locationId}
              required
              disabled={pending || locations.isLoading}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">Selecione…</option>
              {activeLocations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} — {l.name}
                  {l.isDefault ? ' (padrão)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        {kind === 'adjustment' ? (
          <label className="block space-y-1 text-[13px]">
            <span>Direção</span>
            <select
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2"
              value={direction}
              disabled={pending}
              onChange={(e) =>
                setDirection(e.target.value === 'out' ? 'out' : 'in')
              }
            >
              <option value="in">Entrada (+)</option>
              <option value="out">Saída (−)</option>
            </select>
          </label>
        ) : null}

        <label className="block space-y-1 text-[13px]">
          <span>Quantidade</span>
          <Input
            type="number"
            min={0}
            step="any"
            value={quantity}
            required
            disabled={pending}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>

        <label className="block space-y-1 text-[13px]">
          <span>Motivo</span>
          <Input
            value={reason}
            required
            disabled={pending}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>

        <label className="block space-y-1 text-[13px]">
          <span>Notas (opcional)</span>
          <Input
            value={notes}
            disabled={pending}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {error ? (
          <p className="text-[13px] text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando…' : 'Registrar movimento'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              void navigate({ to: '/catalog/inventory/movements' })
            }
          >
            Cancelar
          </Button>
        </div>
      </form>
    </CatalogShell>
  )
}

export function parseMovementCreateKind(
  value: unknown,
): MovementCreateKind {
  if (
    value === 'entry' ||
    value === 'exit' ||
    value === 'adjustment' ||
    value === 'transfer'
  ) {
    return value
  }
  return 'entry'
}
