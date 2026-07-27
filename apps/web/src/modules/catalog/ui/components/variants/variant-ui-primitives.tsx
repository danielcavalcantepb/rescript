import type { ReactNode } from 'react'
import { CatalogStatusBadge } from '#/modules/catalog/ui/components/CatalogStatusBadge'
import { CatalogEmptyState } from '#/modules/catalog/ui/empty-states/CatalogEmptyState'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { CatalogLoadingState } from '#/modules/catalog/ui/loading/CatalogLoadingState'

export function VariantStatusBadge({ status }: { status: string }) {
  return <CatalogStatusBadge status={status} />
}

export function VariantCombinationLabel({
  label,
  isDefault,
}: {
  label?: string | null
  isDefault?: boolean
}) {
  if (isDefault) return <span>Padrão</span>
  return <span>{label?.trim() ? label : '—'}</span>
}

export function VariantEmptyState({
  title = 'Nenhuma variante',
  description = 'Configure eixos e gere combinações para criar variantes deste produto.',
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <CatalogEmptyState title={title} description={description} action={action} />
  )
}

export function VariantLoadingState({
  label = 'Carregando variantes…',
}: {
  label?: string
}) {
  return <CatalogLoadingState label={label} />
}

export function VariantErrorState({ onRetry }: { onRetry?: () => void }) {
  return <CatalogErrorState onRetry={onRetry} />
}
