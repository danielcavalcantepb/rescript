import type { ReactNode } from 'react'
import { EmptyState } from '#/components/EmptyState'

export function CatalogEmptyState({
  title = 'Nenhum produto encontrado',
  description = 'Ajuste a busca ou os filtros para ver itens do catálogo.',
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <EmptyState
      icon="product"
      title={title}
      description={description}
      action={action}
    />
  )
}
