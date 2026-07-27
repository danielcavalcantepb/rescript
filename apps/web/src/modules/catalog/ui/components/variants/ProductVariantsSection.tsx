import { useMemo, useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/components/ui/dialog'
import { FeatureGate, usePermission } from '#/platform/permissions'
import { dialogs } from '#/platform/dialogs'
import { notificationService } from '#/platform/services'
import type { VariantAxisDraft, VariantResponse } from '#/modules/catalog/application'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'
import { VariantAxisEditor } from '#/modules/catalog/ui/components/variants/VariantAxisEditor'
import { VariantCombinationPreview } from '#/modules/catalog/ui/components/variants/VariantCombinationPreview'
import { VariantForm } from '#/modules/catalog/ui/components/variants/VariantForm'
import { VariantTable } from '#/modules/catalog/ui/components/variants/VariantTable'
import { VariantPriceSummary } from '#/modules/catalog/ui/components/VariantPriceSummary'
import { VariantInventorySummary } from '#/modules/inventory/ui/components/VariantInventorySummary'
import {
  VariantEmptyState,
  VariantErrorState,
  VariantLoadingState,
} from '#/modules/catalog/ui/components/variants/variant-ui-primitives'
import { catalogErrorMessage } from '#/modules/catalog/ui/errors/catalog-rpc-errors'
import { getCatalogRpcError } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import {
  useApplyVariantCombinations,
  useArchiveVariant,
  usePreviewVariantCombinations,
  useProductVariants,
  useRestoreVariant,
  useUpdateVariant,
} from '#/modules/catalog/ui/hooks/use-catalog-variants'

function draftsReady(axes: VariantAxisDraft[]) {
  return (
    axes.length > 0 &&
    axes.every(
      (a) =>
        a.name.trim().length > 0 &&
        a.options.some((o) => o.trim().length > 0) &&
        a.options.filter((o) => o.trim()).length ===
          new Set(a.options.map((o) => o.trim().toLowerCase()).filter(Boolean))
            .size,
    )
  )
}

export function ProductVariantsSection({
  organizationId,
  productId,
  productStatus,
}: {
  organizationId: string
  productId: string
  productStatus: string
}) {
  const { can } = usePermission()
  const canConfigure =
    can('products.variants.configure') || can('products.write')
  const canEdit = can('products.variants.edit') || can('products.write')
  const canArchive =
    can('products.variants.archive') || can('products.write')
  const canRestore =
    can('products.variants.restore') || can('products.write')
  const productMutable = productStatus !== 'archived'

  const [statusFilter, setStatusFilter] = useState<
    'all' | 'draft' | 'active' | 'archived'
  >('all')
  const variantsQuery = useProductVariants(organizationId, {
    productId,
    status: statusFilter,
  })

  const [editorOpen, setEditorOpen] = useState(false)
  const [axes, setAxes] = useState<VariantAxisDraft[]>([
    { name: 'Cor', options: ['Preto', 'Branco'] },
  ])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [skuPrefix, setSkuPrefix] = useState('VAR')
  const [applyError, setApplyError] = useState<string | null>(null)
  const [editing, setEditing] = useState<VariantResponse | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [busyVariantId, setBusyVariantId] = useState<string | null>(null)

  const axesForPreview = useMemo(() => {
    if (!draftsReady(axes)) return undefined
    return axes.map((a) => ({
      name: a.name.trim(),
      options: a.options.map((o) => o.trim()).filter(Boolean),
    }))
  }, [axes])

  const previewQuery = usePreviewVariantCombinations(
    organizationId,
    productId,
    axesForPreview,
    editorOpen && Boolean(axesForPreview),
  )
  const apply = useApplyVariantCombinations(organizationId)
  const updateVariant = useUpdateVariant(organizationId)
  const archiveVariant = useArchiveVariant(organizationId)
  const restoreVariant = useRestoreVariant(organizationId)

  function openEditor() {
    const current = variantsQuery.data?.axes
    if (current?.length) {
      setAxes(
        current.map((axis) => ({
          name: axis.name,
          options: axis.options.map((o) => o.label),
        })),
      )
    } else {
      setAxes([{ name: '', options: [''] }])
    }
    setSelectedKeys(new Set())
    setApplyError(null)
    setEditorOpen(true)
  }

  async function confirmApply() {
    if (!axesForPreview) return
    const preview = previewQuery.data
    if (!preview) return

    if (preview.requiresConfirmation) {
      const confirmed = await dialogs.confirm({
        title: 'Criar muitas combinações?',
        description: `Serão consideradas ${preview.totalCombinations} combinações (${selectedKeys.size} novas selecionadas). Continuar?`,
        confirmLabel: 'Confirmar criação',
      })
      if (!confirmed.confirmed) return
    }

    setApplyError(null)
    try {
      const result = await apply.mutateAsync({
        productId,
        axes: axesForPreview,
        createAllNew: false,
        createSelectionKeys: [...selectedKeys],
        skuPrefix: skuPrefix.trim() || 'VAR',
      })
      notificationService.success(
        result.createdVariantIds.length
          ? `${result.createdVariantIds.length} variante(s) criada(s)`
          : 'Matriz de eixos atualizada',
      )
      setEditorOpen(false)
    } catch (err) {
      const rpc = getCatalogRpcError(err)
      setApplyError(
        rpc ? catalogErrorMessage(rpc) : 'Não foi possível aplicar combinações.',
      )
    }
  }

  async function onArchive(variant: VariantResponse) {
    const confirmed = await dialogs.confirm({
      title: 'Arquivar variante?',
      description:
        'A variante permanecerá no histórico e poderá ser restaurada.',
      confirmLabel: 'Arquivar',
      tone: 'danger',
    })
    if (!confirmed.confirmed) return
    setBusyVariantId(variant.id)
    try {
      await archiveVariant.mutateAsync({
        productId,
        variantId: variant.id,
      })
      notificationService.success('Variante arquivada')
    } catch (err) {
      const rpc = getCatalogRpcError(err)
      notificationService.error(
        rpc ? catalogErrorMessage(rpc) : 'Falha ao arquivar variante.',
      )
    } finally {
      setBusyVariantId(null)
    }
  }

  async function onRestore(variant: VariantResponse) {
    const confirmed = await dialogs.confirm({
      title: 'Restaurar variante?',
      description: 'A variante voltará para rascunho.',
      confirmLabel: 'Restaurar',
    })
    if (!confirmed.confirmed) return
    setBusyVariantId(variant.id)
    try {
      await restoreVariant.mutateAsync({
        productId,
        variantId: variant.id,
      })
      notificationService.success('Variante restaurada')
    } catch (err) {
      const rpc = getCatalogRpcError(err)
      notificationService.error(
        rpc ? catalogErrorMessage(rpc) : 'Falha ao restaurar variante.',
      )
    } finally {
      setBusyVariantId(null)
    }
  }

  return (
    <section className="mt-8" aria-labelledby="product-variants-heading">
      <CatalogToolbar
        title="Variantes"
        actions={
          productMutable ? (
            <FeatureGate permission="products.variants.configure">
              <Button
                type="button"
                disabled={!canConfigure}
                onClick={openEditor}
              >
                Configurar eixos
              </Button>
            </FeatureGate>
          ) : null
        }
      />
      <h2 id="product-variants-heading" className="sr-only">
        Variantes do produto
      </h2>

      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filtro de status">
        {(
          [
            ['all', 'Todas'],
            ['active', 'Ativas'],
            ['draft', 'Rascunhos'],
            ['archived', 'Arquivadas'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={statusFilter === value ? 'primary' : 'secondary'}
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {variantsQuery.isLoading ? <VariantLoadingState /> : null}
      {variantsQuery.isError ? (
        <VariantErrorState onRetry={() => void variantsQuery.refetch()} />
      ) : null}
      {variantsQuery.data && variantsQuery.data.items.length === 0 ? (
        <VariantEmptyState
          action={
            productMutable && canConfigure ? (
              <Button type="button" onClick={openEditor}>
                Configurar variantes
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {variantsQuery.data && variantsQuery.data.items.length > 0 ? (
        <>
          <VariantTable
            items={variantsQuery.data.items}
            canEdit={canEdit && productMutable}
            canArchive={canArchive && productMutable}
            canRestore={canRestore && productMutable}
            onEditSku={setEditing}
            onArchive={(v) => void onArchive(v)}
            onRestore={(v) => void onRestore(v)}
            busyVariantId={busyVariantId}
          />
          <div className="mt-4 grid max-w-3xl gap-4 lg:grid-cols-2">
            <VariantPriceSummary
              organizationId={organizationId}
              variantId={variantsQuery.data.items[0]!.id}
            />
            <VariantInventorySummary
              organizationId={organizationId}
              variantId={variantsQuery.data.items[0]!.id}
            />
          </div>
        </>
      ) : null}

      {variantsQuery.data?.axes.length ? (
        <div className="mt-4 text-[13px] text-[var(--color-text-secondary)]">
          Eixos:{' '}
          {variantsQuery.data.axes
            .map(
              (a) =>
                `${a.name} (${a.options.map((o) => o.label).join(', ')})`,
            )
            .join(' · ')}
        </div>
      ) : null}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent size="lg" aria-describedby="variant-editor-desc">
          <DialogTitle>Configurar variantes</DialogTitle>
          <DialogDescription id="variant-editor-desc">
            Defina eixos e opções livres (sem enums fixos de categoria). A
            geração de combinações é validada no servidor.
          </DialogDescription>

          <div className="mt-4 space-y-4">
            <VariantAxisEditor
              axes={axes}
              onChange={setAxes}
              disabled={apply.isPending}
            />

            <div>
              <label
                htmlFor="sku-prefix"
                className="mb-1 block text-[12px] text-[var(--color-text-secondary)]"
              >
                Prefixo de SKU (geração)
              </label>
              <input
                id="sku-prefix"
                className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[14px]"
                value={skuPrefix}
                disabled={apply.isPending}
                onChange={(e) => setSkuPrefix(e.target.value)}
              />
            </div>

            {previewQuery.isLoading ? (
              <VariantLoadingState label="Calculando combinações…" />
            ) : null}
            {previewQuery.isError ? (
              <VariantErrorState onRetry={() => void previewQuery.refetch()} />
            ) : null}
            {previewQuery.data ? (
              <VariantCombinationPreview
                preview={previewQuery.data}
                selectedKeys={selectedKeys}
                onToggle={(key) => {
                  setSelectedKeys((prev) => {
                    const next = new Set(prev)
                    if (next.has(key)) next.delete(key)
                    else next.add(key)
                    return next
                  })
                }}
                onSelectAllNew={() => {
                  setSelectedKeys(
                    new Set(
                      previewQuery.data!.items
                        .filter((i) => i.state === 'new')
                        .map((i) => i.selectionKey),
                    ),
                  )
                }}
                onClearNew={() => setSelectedKeys(new Set())}
              />
            ) : null}

            {applyError ? (
              <p role="alert" className="text-[13px] text-[var(--color-danger)]">
                {applyError}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={apply.isPending}
                onClick={() => setEditorOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={
                  apply.isPending ||
                  !axesForPreview ||
                  !previewQuery.data ||
                  (selectedKeys.size === 0 &&
                    (previewQuery.data?.newCount ?? 0) > 0 &&
                    (variantsQuery.data?.topology === 'simple' ||
                      (previewQuery.data?.existingCount ?? 0) === 0))
                }
                onClick={() => void confirmApply()}
              >
                {apply.isPending ? 'Aplicando…' : 'Aplicar combinações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent size="sm">
          <DialogTitle>Editar variante</DialogTitle>
          <DialogDescription>
            Altere o SKU. Combinação e preço/estoque não são editáveis aqui.
          </DialogDescription>
          {editing ? (
            <div className="mt-4">
              <VariantForm
                variant={editing}
                busy={updateVariant.isPending}
                error={editError}
                onCancel={() => setEditing(null)}
                onSubmit={async (sku) => {
                  setEditError(null)
                  try {
                    await updateVariant.mutateAsync({
                      productId,
                      variantId: editing.id,
                      sku,
                    })
                    notificationService.success('SKU atualizado')
                    setEditing(null)
                  } catch (err) {
                    const rpc = getCatalogRpcError(err)
                    setEditError(
                      rpc
                        ? catalogErrorMessage(rpc)
                        : 'Não foi possível salvar o SKU.',
                    )
                  }
                }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}
