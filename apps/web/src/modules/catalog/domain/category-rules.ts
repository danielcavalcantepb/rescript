import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'
import type { Category, CategoryId } from '#/modules/catalog/domain/types'
import { CATEGORY_MAX_DEPTH } from '#/modules/catalog/domain/factories/taxonomy-factory'

/** Pure category tree rules. */
export function assertNoCategoryCycle(
  categories: readonly Category[],
  categoryId: CategoryId,
  newParentId: CategoryId | null,
): DomainResult<true> {
  if (newParentId === null) return ok(true)
  if (newParentId === categoryId) {
    return err('category_cycle', 'Categoria não pode ser pai de si mesma.')
  }

  const byId = new Map(categories.map((c) => [c.id, c] as const))
  let current: CategoryId | null = newParentId
  const seen = new Set<CategoryId>([categoryId])

  while (current) {
    if (seen.has(current)) {
      return err('category_cycle', 'Hierarquia de categoria cíclica.')
    }
    seen.add(current)
    current = byId.get(current)?.parentId ?? null
  }

  return ok(true)
}

export function assertCategoryDepth(
  parent: Category | null,
): DomainResult<number> {
  const depth = parent ? parent.depth + 1 : 0
  if (depth > CATEGORY_MAX_DEPTH) {
    return err(
      'category_depth_exceeded',
      `Profundidade máxima de categoria é ${CATEGORY_MAX_DEPTH}.`,
    )
  }
  return ok(depth)
}
