import { StatusBadge } from '#/components/StatusBadge'

const LABELS: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  inactive: 'Inativo',
  archived: 'Arquivado',
}

/** Catalog lifecycle badge — reuses shared StatusBadge visuals. */
export function CatalogStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={LABELS[status] ?? status} />
}
