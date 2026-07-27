import type {
  CategoryResponse,
  CategoryIdCommand,
  CreateCategoryCommand,
  MoveCategoryCommand,
  UpdateCategoryCommand,
} from '#/modules/catalog/application/dto'
import {
  CatalogNotFoundError,
  CatalogPermissionError,
  throwIfDomainError,
} from '#/modules/catalog/application/errors'
import {
  requireCategoryWrite,
  type CatalogAppDeps,
} from '#/modules/catalog/application/deps'
import { toCategoryResponse } from '#/modules/catalog/application/mappers'
import {
  assertValid,
  validateCreateCategory,
  validateMoveCategory,
  validateUpdateCategory,
} from '#/modules/catalog/application/validation'
import {
  assertCategoryDepth,
  assertNoCategoryCycle,
} from '#/modules/catalog/domain/category-rules'
import { createCategory as createCategoryDomain } from '#/modules/catalog/domain/factories/taxonomy-factory'
import { createCatalogSlug } from '#/modules/catalog/domain/factories/taxonomy-factory'
import { CatalogConflictError } from '#/modules/catalog/application/errors'
import { createNamedLabel } from '#/modules/catalog/domain/value-objects/normalized-name'

export async function createCategory(
  deps: CatalogAppDeps,
  command: CreateCategoryCommand,
): Promise<CategoryResponse> {
  if (!requireCategoryWrite(deps.can)) throw new CatalogPermissionError()
  assertValid(validateCreateCategory(command))
  let parent = null
  if (command.parentId) {
    parent = await deps.categories.getById(
      deps.organizationId,
      command.parentId,
    )
    if (!parent) throw new CatalogNotFoundError('parent_category_not_found')
  }
  const category = throwIfDomainError(
    createCategoryDomain(
      deps.organizationId,
      command.name,
      parent,
      () => deps.ids.next(),
    ),
  )
  category.description = command.description?.trim() || null
  category.sortOrder = command.sortOrder ?? 0
  await deps.categories.save(category)
  deps.events.append([
    {
      type: 'CategoryChanged',
      organizationId: deps.organizationId,
      categoryId: category.id,
    },
  ])
  return toCategoryResponse(category)
}

export async function updateCategory(
  deps: CatalogAppDeps,
  command: UpdateCategoryCommand,
): Promise<CategoryResponse> {
  if (!requireCategoryWrite(deps.can)) throw new CatalogPermissionError()
  assertValid(validateUpdateCategory(command))
  const category = await deps.categories.getById(
    deps.organizationId,
    command.categoryId,
  )
  if (!category) throw new CatalogNotFoundError('category_not_found')
  const label = throwIfDomainError(
    createNamedLabel(command.name, { max: 120 }, 'Informe a categoria.'),
  )
  const next = {
    ...category,
    name: label.name,
    normalizedName: label.normalizedName,
    slug: createCatalogSlug(label.name),
    description:
      command.description === undefined
        ? category.description
        : command.description?.trim() || null,
    sortOrder: command.sortOrder ?? category.sortOrder,
  }
  await deps.categories.save(next)
  deps.events.append([
    {
      type: 'CategoryChanged',
      organizationId: deps.organizationId,
      categoryId: next.id,
    },
  ])
  return toCategoryResponse(next)
}

export async function moveCategory(
  deps: CatalogAppDeps,
  command: MoveCategoryCommand,
): Promise<CategoryResponse> {
  if (!requireCategoryWrite(deps.can)) throw new CatalogPermissionError()
  assertValid(validateMoveCategory(command))
  const category = await deps.categories.getById(
    deps.organizationId,
    command.categoryId,
  )
  if (!category) throw new CatalogNotFoundError('category_not_found')

  let parent = null
  if (command.newParentId) {
    parent = await deps.categories.getById(
      deps.organizationId,
      command.newParentId,
    )
    if (!parent) throw new CatalogNotFoundError('parent_category_not_found')
  }

  const all = await deps.categories.listByOrganization(deps.organizationId)
  throwIfDomainError(
    assertNoCategoryCycle(all, category.id, command.newParentId),
  )
  const depth = throwIfDomainError(assertCategoryDepth(parent))
  const next = {
    ...category,
    parentId: command.newParentId,
    depth,
  }
  await deps.categories.save(next)
  deps.events.append([
    {
      type: 'CategoryChanged',
      organizationId: deps.organizationId,
      categoryId: next.id,
    },
  ])
  return toCategoryResponse(next)
}

export async function archiveCategory(
  deps: CatalogAppDeps,
  command: CategoryIdCommand,
): Promise<CategoryResponse> {
  if (!requireCategoryWrite(deps.can)) throw new CatalogPermissionError()
  const category = await deps.categories.getById(
    deps.organizationId,
    command.categoryId,
  )
  if (!category) throw new CatalogNotFoundError('category_not_found')
  const [categories, products] = await Promise.all([
    deps.categories.listByOrganization(deps.organizationId),
    deps.products.listByOrganization(deps.organizationId),
  ])
  if (
    categories.some(
      (candidate) =>
        candidate.parentId === category.id && candidate.status === 'active',
    ) ||
    products.some(
      (product) =>
        product.primaryCategoryId === category.id &&
        product.status !== 'archived',
    )
  ) {
    throw new CatalogConflictError('category_in_use')
  }
  const next = { ...category, status: 'archived' as const }
  await deps.categories.save(next)
  deps.events.append([
    {
      type: 'CategoryChanged',
      organizationId: deps.organizationId,
      categoryId: next.id,
    },
  ])
  return toCategoryResponse(next)
}
