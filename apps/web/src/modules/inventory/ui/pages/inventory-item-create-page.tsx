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
  useCreateInventoryItem,
  useLocations,
} from '#/modules/inventory/ui/hooks/use-inventory-foundation'

export function InventoryItemCreatePage() {
  return (
    <RequirePermission
      permission="inventory.create"
      forbiddenDescription="Você não tem permissão para criar itens de estoque."
    >
      <InventoryItemCreateContent />
    </RequirePermission>
  )
}

function InventoryItemCreateContent() {
  const navigate = useNavigate()
  const { currentOrganization, isLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const create = useCreateInventoryItem(organizationId)
  const locations = useLocations(organizationId)
  const [variantId, setVariantId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  const activeLocations =
    locations.data?.filter((l) => l.status !== 'archived') ?? []

  return (
    <CatalogShell
      title="Novo item de estoque"
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Estoque', href: '/catalog/inventory' },
        { label: 'Itens', href: '/catalog/inventory/items' },
        { label: 'Novo' },
      ]}
    >
      <form
        className="max-w-lg space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (create.isPending) return
          setError(null)
          void create
            .mutateAsync({
              variantId: variantId.trim(),
              locationId:
                locationId ||
                activeLocations.find((l) => l.isDefault)?.id ||
                activeLocations[0]?.id ||
                '',
              quantityOnHand: 0,
              reason: reason.trim() || null,
            })
            .then((item) => {
              notificationService.success('Item criado')
              void navigate({
                to: '/catalog/inventory/items/$inventoryItemId',
                params: { inventoryItemId: item.id },
              })
            })
            .catch((err: Error) => {
              setError(err.message || 'Não foi possível criar o item.')
            })
        }}
      >
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          O item nasce com quantidade 0. O estoque vem das movimentações do
          ledger (entrada, saída, ajuste ou transferência).
        </p>
        <label className="block space-y-1 text-[13px]">
          <span>Variant ID</span>
          <Input
            value={variantId}
            required
            disabled={create.isPending}
            onChange={(e) => setVariantId(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-[13px]">
          <span>Local</span>
          <select
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2"
            value={locationId}
            required
            disabled={create.isPending || locations.isLoading}
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
        <label className="block space-y-1 text-[13px]">
          <span>Motivo (opcional)</span>
          <Input
            value={reason}
            disabled={create.isPending}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        {error ? (
          <p className="text-[13px] text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Salvando…' : 'Criar item'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={create.isPending}
            onClick={() => void navigate({ to: '/catalog/inventory/items' })}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </CatalogShell>
  )
}
