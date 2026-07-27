import { TableLoading } from '#/platform/loading'

export function CatalogLoadingState({
  label = 'Carregando catálogo…',
}: {
  label?: string
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <TableLoading />
    </div>
  )
}
