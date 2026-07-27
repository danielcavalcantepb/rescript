/** Lifecycle for Product and Variant (CatalogDomainStrategy). */
export const CATALOG_LIFECYCLE_STATUSES = ['draft', 'active', 'archived'] as const
export type CatalogLifecycleStatus = (typeof CATALOG_LIFECYCLE_STATUSES)[number]

/** Brand (and similar taxonomies without draft). */
export const ARCHIVEABLE_STATUSES = ['active', 'archived'] as const
export type ArchiveableStatus = (typeof ARCHIVEABLE_STATUSES)[number]

const LIFECYCLE_TRANSITIONS: Record<
  CatalogLifecycleStatus,
  readonly CatalogLifecycleStatus[]
> = {
  draft: ['active', 'archived'],
  active: ['archived'],
  /** Restore returns to draft and requires re-activation. */
  archived: ['draft'],
}

export function canTransitionLifecycle(
  from: CatalogLifecycleStatus,
  to: CatalogLifecycleStatus,
): boolean {
  if (from === to) return true
  return LIFECYCLE_TRANSITIONS[from].includes(to)
}

export function assertLifecycleTransition(
  from: CatalogLifecycleStatus,
  to: CatalogLifecycleStatus,
): string | null {
  if (canTransitionLifecycle(from, to)) return null
  return `Transição de status inválida: ${from} → ${to}.`
}
