import { useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type {
  CatalogProductDetailResponse,
  ProductLifecycleResponse,
} from '#/modules/catalog/application'
import { Button } from '#/components/ui/button'
import { CatalogStatusBadge } from '#/modules/catalog/ui/components/CatalogStatusBadge'
import { ProductLifecycleActions } from '#/modules/catalog/ui/components/ProductLifecycleActions'
import { ProductVariantsSection } from '#/modules/catalog/ui/components/variants/ProductVariantsSection'
import { VariantPriceSummary } from '#/modules/catalog/ui/components/VariantPriceSummary'
import { usePricesByVariant } from '#/modules/catalog/ui/hooks/use-catalog-pricing'
import {
  formatMoneyDisplay,
  type MoneyCurrency,
} from '#/modules/catalog/domain/value-objects/money'
import { VariantInventorySummary } from '#/modules/inventory/ui/components/VariantInventorySummary'
import { useVariantInventorySummary } from '#/modules/inventory/ui/hooks/use-inventory-foundation'
import { FeatureGate } from '#/platform/permissions'
import { cn } from '#/lib/utils'

type WorkspaceTab =
  | 'general'
  | 'inventory'
  | 'prices'
  | 'variants'
  | 'history'

const TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'general', label: 'Geral' },
  { id: 'inventory', label: 'Estoque' },
  { id: 'prices', label: 'Preços' },
  { id: 'variants', label: 'Variantes' },
  { id: 'history', label: 'Histórico' },
]

export function ProductWorkspace({
  organizationId,
  product,
  lifecycle,
  lifecycleLoading,
  canEdit,
}: {
  organizationId: string
  product: CatalogProductDetailResponse
  lifecycle?: ProductLifecycleResponse
  lifecycleLoading: boolean
  canEdit: boolean
}) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('general')
  const defaultVariant =
    product.variants.find((variant) => variant.isDefault) ?? product.variants[0]
  const inventorySummary = useVariantInventorySummary(
    organizationId,
    defaultVariant?.id,
  )
  const priceSummary = usePricesByVariant(
    organizationId,
    defaultVariant?.id,
  )
  const resolvedPrice = priceSummary.data?.resolved

  const edit = () =>
    void navigate({
      to: '/catalog/products/$productId/edit',
      params: { productId: product.id },
    })

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)]/95 p-4 shadow-[var(--shadow-sm)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold text-[var(--color-ink)]">
                {product.name}
              </h2>
              <CatalogStatusBadge status={product.status} />
            </div>
            <p className="mt-1 font-mono text-[13px] text-[var(--color-text-secondary)]">
              {product.defaultSku ?? 'SKU não informado'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[13px] sm:grid-cols-4">
            <SummaryItem label="Categoria" value={product.categoryName ?? '—'} />
            <SummaryItem
              label="Estoque"
              value={
                defaultVariant?.tracksInventory
                  ? String(
                      inventorySummary.data?.availability?.quantityAvailable ??
                        inventorySummary.data?.item?.quantityAvailable ??
                        0,
                    )
                  : 'Não controlado'
              }
            />
            <SummaryItem
              label="Preço"
              value={
                resolvedPrice
                  ? formatMoneyDisplay({
                      amount: resolvedPrice.amount,
                      currency: resolvedPrice.currency as MoneyCurrency,
                    })
                  : '—'
              }
            />
            <SummaryItem
              label="Última alteração"
              value={
                product.updatedAt
                  ? new Date(product.updatedAt).toLocaleDateString('pt-BR')
                  : '—'
              }
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-b border-[var(--color-border-soft)]">
        <div
          className="flex min-w-max gap-1"
          role="tablist"
          aria-label="Áreas do produto"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`product-panel-${tab.id}`}
              className={cn(
                'border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-ink)]',
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        id={`product-panel-${activeTab}`}
        role="tabpanel"
        className="min-h-[360px]"
      >
        {activeTab === 'general' ? (
          <GeneralPanel product={product} canEdit={canEdit} onEdit={edit} />
        ) : null}
        {activeTab === 'inventory' ? (
          <InventoryPanel
            organizationId={organizationId}
            variantId={defaultVariant?.id}
          />
        ) : null}
        {activeTab === 'prices' ? (
          <PricesPanel
            organizationId={organizationId}
            variantId={defaultVariant?.id}
          />
        ) : null}
        {activeTab === 'variants' ? (
          <ProductVariantsSection
            organizationId={organizationId}
            productId={product.id}
            productStatus={product.status}
          />
        ) : null}
        {activeTab === 'history' ? (
          <HistoryPanel
            organizationId={organizationId}
            product={product}
            lifecycle={lifecycle}
            loading={lifecycleLoading}
          />
        ) : null}
      </div>
    </div>
  )
}

function GeneralPanel({
  product,
  canEdit,
  onEdit,
}: {
  product: CatalogProductDetailResponse
  canEdit: boolean
  onEdit: () => void
}) {
  return (
    <WorkspaceSection
      title="Dados gerais"
      description="Identificação comercial e classificação do produto."
      action={
        canEdit && product.status !== 'archived' ? (
          <FeatureGate permission="products.edit">
            <Button type="button" size="sm" onClick={onEdit}>
              Editar dados gerais
            </Button>
          </FeatureGate>
        ) : undefined
      }
    >
      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nome" value={product.name} className="sm:col-span-2" />
        <Field label="SKU" value={product.defaultSku ?? '—'} mono />
        <Field label="Código de barras" value={product.primaryBarcode ?? '—'} mono />
        <Field label="Tipo" value={topologyLabel(product.topology)} />
        <Field label="Categoria" value={product.categoryName ?? '—'} />
        <Field label="Marca" value={product.brandName ?? '—'} />
        <Field
          label="Unidade"
          value={
            product.defaultUnitOfMeasureCode
              ? `${product.defaultUnitOfMeasureCode} — ${product.defaultUnitOfMeasureName ?? ''}`
              : '—'
          }
        />
        <Field
          label="Status"
          value={<CatalogStatusBadge status={product.status} />}
        />
        <Field
          label="Descrição completa"
          value={product.description ?? '—'}
          className="sm:col-span-2 lg:col-span-4"
        />
      </dl>
    </WorkspaceSection>
  )
}

function InventoryPanel({
  organizationId,
  variantId,
}: {
  organizationId: string
  variantId?: string
}) {
  if (!variantId) {
    return <WorkspaceEmpty title="Sem variante para consultar estoque" />
  }
  return (
    <div className="space-y-4">
      <WorkspaceSection
        title="Posição de estoque"
        description="Saldos calculados pela projeção do Inventory Ledger."
      >
        <VariantInventorySummary
          organizationId={organizationId}
          variantId={variantId}
        />
      </WorkspaceSection>
    </div>
  )
}

function PricesPanel({
  organizationId,
  variantId,
}: {
  organizationId: string
  variantId?: string
}) {
  if (!variantId) {
    return <WorkspaceEmpty title="Sem variante para consultar preços" />
  }
  return (
    <div className="space-y-4">
      <WorkspaceSection
        title="Precificação"
        description="Preço efetivo e tabelas resolvidos pelo Price Engine."
      >
        <VariantPriceSummary organizationId={organizationId} variantId={variantId} />
      </WorkspaceSection>
    </div>
  )
}

function HistoryPanel({
  organizationId,
  product,
  lifecycle,
  loading,
}: {
  organizationId: string
  product: CatalogProductDetailResponse
  lifecycle?: ProductLifecycleResponse
  loading: boolean
}) {
  return (
    <div className="space-y-4">
      <WorkspaceSection
        title="Ciclo de vida"
        description="Transições auditadas pelo aggregate de Produto."
      >
        {lifecycle ? (
          <ProductLifecycleActions
            organizationId={organizationId}
            productId={product.id}
            availableActions={lifecycle.availableActions}
          />
        ) : null}
      </WorkspaceSection>
      <WorkspaceSection title="Linha do tempo">
        {loading ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Carregando histórico…
          </p>
        ) : !lifecycle?.history.length ? (
          <WorkspaceEmpty title="Nenhuma transição registrada" />
        ) : (
          <ol className="relative ml-2 border-l border-[var(--color-border)] pl-5">
            {lifecycle.history.map((item) => (
              <li key={item.id} className="relative pb-5 last:pb-0">
                <span className="absolute -left-[25px] top-1 size-2 rounded-full bg-[var(--color-primary)]" />
                <p className="text-[13px] font-medium text-[var(--color-ink)]">
                  {actionLabel(item.action)} · {item.fromStatus} → {item.toStatus}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
                  {new Date(item.occurredAt).toLocaleString('pt-BR')}
                  {item.reason ? ` · ${item.reason}` : ''}
                </p>
              </li>
            ))}
          </ol>
        )}
      </WorkspaceSection>
    </div>
  )
}

function WorkspaceSection({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--color-ink)]">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value: ReactNode
  mono?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-[12px] text-[var(--color-text-secondary)]">{label}</dt>
      <dd
        className={cn(
          'mt-1 text-[14px] text-[var(--color-ink)]',
          mono && 'font-mono',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-[var(--color-text-secondary)]">{label}</div>
      <div className="mt-0.5 truncate font-medium text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  )
}

function WorkspaceEmpty({ title }: { title: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-[13px] text-[var(--color-text-secondary)]">
      {title}
    </div>
  )
}

function topologyLabel(topology: string) {
  return topology === 'variable' ? 'Com variantes' : 'Simples'
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    publish: 'Publicação',
    archive: 'Arquivamento',
    deactivate: 'Desativação',
    restore: 'Restauração',
  }
  return labels[action] ?? action
}
