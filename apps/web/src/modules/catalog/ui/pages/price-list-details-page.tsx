import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/components/ui/dialog'
import { PageLoading } from '#/platform/loading'
import { dialogs } from '#/platform/dialogs'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission, usePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { CatalogStatusBadge } from '#/modules/catalog/ui/components/CatalogStatusBadge'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'
import { CatalogEmptyState } from '#/modules/catalog/ui/empty-states/CatalogEmptyState'
import { catalogErrorMessage } from '#/modules/catalog/ui/errors/catalog-rpc-errors'
import { getCatalogRpcError } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import {
  useAddPriceEntry,
  useArchivePriceList,
  usePriceList,
  useRestorePriceList,
  useUpdatePriceList,
} from '#/modules/catalog/ui/hooks/use-catalog-pricing'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { CatalogLoadingState } from '#/modules/catalog/ui/loading/CatalogLoadingState'
import { formatMoneyDisplay } from '#/modules/catalog/domain/value-objects/money'
import type { MoneyCurrency } from '#/modules/catalog/domain/value-objects/money'

export function PriceListDetailsPage({ priceListId }: { priceListId: string }) {
  return (
    <RequirePermission
      permission="prices.read"
      forbiddenDescription="Você não tem permissão para ver listas de preço."
    >
      <PriceListDetailsContent priceListId={priceListId} />
    </RequirePermission>
  )
}

function PriceListDetailsContent({ priceListId }: { priceListId: string }) {
  const navigate = useNavigate()
  const { can } = usePermission()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const query = usePriceList(
    organizationId,
    priceListId,
    Boolean(organizationId),
  )
  const archive = useArchivePriceList(organizationId)
  const restore = useRestorePriceList(organizationId)
  const update = useUpdatePriceList(organizationId)
  const addEntry = useAddPriceEntry(organizationId)

  const [entryOpen, setEntryOpen] = useState(false)
  const [variantId, setVariantId] = useState('')
  const [amount, setAmount] = useState('')
  const [entryError, setEntryError] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState<string | null>(null)

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  if (query.isLoading) {
    return (
      <CatalogShell title="Lista de preço">
        <CatalogLoadingState label="Carregando lista…" />
      </CatalogShell>
    )
  }

  if (query.isError || !query.data) {
    return (
      <CatalogShell title="Lista de preço">
        <CatalogErrorState onRetry={() => void query.refetch()} />
      </CatalogShell>
    )
  }

  const list = query.data
  const canEdit = can('prices.edit') || can('products.write')
  const mutable = list.status !== 'archived'

  return (
    <CatalogShell
      title={list.name}
      description={list.description ?? 'Detalhes da lista de preço.'}
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Listas de preço', href: '/catalog/price-lists' },
        { label: list.name },
      ]}
      actions={
        <div className="flex flex-wrap gap-2">
          {mutable && !list.isDefault ? (
            <FeatureGate permission="prices.archive">
              <Button
                type="button"
                variant="secondary"
                disabled={archive.isPending}
                onClick={() => {
                  void dialogs
                    .confirm({
                      title: 'Arquivar lista?',
                      description:
                        'A lista deixará de participar da resolução de preços.',
                      confirmLabel: 'Arquivar',
                      tone: 'danger',
                    })
                    .then((r) => {
                      if (!r.confirmed) return
                      return archive.mutateAsync({ priceListId: list.id })
                    })
                    .then((result) => {
                      if (result) notificationService.success('Lista arquivada')
                    })
                    .catch((err) => {
                      const rpc = getCatalogRpcError(err)
                      notificationService.error(
                        rpc
                          ? catalogErrorMessage(rpc)
                          : 'Falha ao arquivar lista.',
                      )
                    })
                }}
              >
                Arquivar
              </Button>
            </FeatureGate>
          ) : null}
          {!mutable ? (
            <FeatureGate permission="prices.restore">
              <Button
                type="button"
                variant="secondary"
                disabled={restore.isPending}
                onClick={() => {
                  void restore
                    .mutateAsync({ priceListId: list.id })
                    .then(() => notificationService.success('Lista restaurada'))
                    .catch((err) => {
                      const rpc = getCatalogRpcError(err)
                      notificationService.error(
                        rpc
                          ? catalogErrorMessage(rpc)
                          : 'Falha ao restaurar lista.',
                      )
                    })
                }}
              >
                Restaurar
              </Button>
            </FeatureGate>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => void navigate({ to: '/catalog/price-lists' })}
          >
            Voltar
          </Button>
        </div>
      }
    >
      <dl className="mb-6 grid max-w-2xl gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-[12px] text-[var(--color-text-secondary)]">Status</dt>
          <dd className="mt-0.5">
            <CatalogStatusBadge status={list.status} />
          </dd>
        </div>
        <div>
          <dt className="text-[12px] text-[var(--color-text-secondary)]">Moeda</dt>
          <dd className="mt-0.5 font-mono text-[14px]">{list.currency}</dd>
        </div>
        <div>
          <dt className="text-[12px] text-[var(--color-text-secondary)]">
            Prioridade
          </dt>
          <dd className="mt-0.5 font-mono text-[14px]">{list.priority}</dd>
        </div>
        <div>
          <dt className="text-[12px] text-[var(--color-text-secondary)]">Padrão</dt>
          <dd className="mt-0.5 text-[14px]">{list.isDefault ? 'Sim' : 'Não'}</dd>
        </div>
      </dl>

      {mutable && canEdit ? (
        <div className="mb-6 flex max-w-lg gap-2">
          <Input
            value={nameDraft ?? list.name}
            aria-label="Nome da lista"
            onChange={(e) => setNameDraft(e.target.value)}
          />
          <Button
            type="button"
            disabled={update.isPending}
            onClick={() => {
              const name = (nameDraft ?? list.name).trim()
              if (!name) return
              void update
                .mutateAsync({ priceListId: list.id, name })
                .then(() => {
                  setNameDraft(null)
                  notificationService.success('Lista atualizada')
                })
            }}
          >
            Salvar nome
          </Button>
        </div>
      ) : null}

      <CatalogToolbar
        title="Entradas de preço"
        actions={
          mutable ? (
            <FeatureGate permission="prices.edit">
              <Button type="button" onClick={() => setEntryOpen(true)}>
                Adicionar preço
              </Button>
            </FeatureGate>
          ) : null
        }
      />

      {list.entries.length === 0 ? (
        <CatalogEmptyState
          title="Nenhuma entrada"
          description="Adicione preços por variante nesta lista. O preço nunca fica na Variant."
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-soft)]">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Variant</th>
                <th className="px-3 py-2 font-medium">Valor</th>
                <th className="px-3 py-2 font-medium">Vigência</th>
                <th className="px-3 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-[var(--color-border-soft)] last:border-0"
                >
                  <td className="px-3 py-2 font-mono">{entry.variantId}</td>
                  <td className="px-3 py-2">
                    {formatMoneyDisplay({
                      currency: entry.currency as MoneyCurrency,
                      amount: entry.amount,
                    })}
                  </td>
                  <td className="px-3 py-2 text-[12px]">
                    {new Date(entry.validFrom).toLocaleString('pt-BR')}
                    {entry.validTo
                      ? ` → ${new Date(entry.validTo).toLocaleString('pt-BR')}`
                      : ' → aberto'}
                  </td>
                  <td className="px-3 py-2">{entry.validityState ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent size="sm">
          <DialogTitle>Adicionar preço</DialogTitle>
          <DialogDescription>
            Informe o ID da variante e o valor. Vigência inicia agora (servidor
            usa o instante enviado).
          </DialogDescription>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (addEntry.isPending) return
              setEntryError(null)
              void addEntry
                .mutateAsync({
                  priceListId: list.id,
                  variantId: variantId.trim(),
                  amount: amount.trim(),
                  validFrom: new Date().toISOString(),
                })
                .then(() => {
                  notificationService.success('Preço adicionado')
                  setEntryOpen(false)
                  setVariantId('')
                  setAmount('')
                })
                .catch((err) => {
                  const rpc = getCatalogRpcError(err)
                  setEntryError(
                    rpc
                      ? catalogErrorMessage(rpc)
                      : 'Não foi possível adicionar o preço.',
                  )
                })
            }}
          >
            <div>
              <label
                htmlFor="entry-variant"
                className="mb-1 block text-[12px] text-[var(--color-text-secondary)]"
              >
                Variant ID
              </label>
              <Input
                id="entry-variant"
                value={variantId}
                required
                disabled={addEntry.isPending}
                onChange={(e) => setVariantId(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="entry-amount"
                className="mb-1 block text-[12px] text-[var(--color-text-secondary)]"
              >
                Valor ({list.currency})
              </label>
              <Input
                id="entry-amount"
                value={amount}
                required
                placeholder="120.00"
                disabled={addEntry.isPending}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {entryError ? (
              <p role="alert" className="text-[13px] text-[var(--color-danger)]">
                {entryError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={addEntry.isPending}
                onClick={() => setEntryOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={addEntry.isPending}>
                {addEntry.isPending ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CatalogShell>
  )
}
