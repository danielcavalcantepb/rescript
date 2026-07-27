import type {
  BrandResponse,
  BrandIdCommand,
  CreateBrandCommand,
  UpdateBrandCommand,
} from '#/modules/catalog/application/dto'
import {
  CatalogConflictError,
  CatalogNotFoundError,
  CatalogPermissionError,
  throwIfDomainError,
} from '#/modules/catalog/application/errors'
import {
  requireBrandWrite,
  type CatalogAppDeps,
} from '#/modules/catalog/application/deps'
import { toBrandResponse } from '#/modules/catalog/application/mappers'
import {
  assertValid,
  validateCreateBrand,
  validateUpdateBrand,
} from '#/modules/catalog/application/validation'
import { createBrand as createBrandDomain } from '#/modules/catalog/domain/factories/taxonomy-factory'
import { createCatalogSlug } from '#/modules/catalog/domain/factories/taxonomy-factory'
import { createNamedLabel } from '#/modules/catalog/domain/value-objects/normalized-name'

export async function createBrand(
  deps: CatalogAppDeps,
  command: CreateBrandCommand,
): Promise<BrandResponse> {
  if (!requireBrandWrite(deps.can)) throw new CatalogPermissionError()
  assertValid(validateCreateBrand(command))
  const brand = throwIfDomainError(
    createBrandDomain(deps.organizationId, command.name, () =>
      deps.ids.next(),
    ),
  )
  const existing = await deps.brands.findByNormalizedName(
    deps.organizationId,
    brand.normalizedName,
  )
  if (existing) throw new CatalogConflictError('brand_name_conflict')
  brand.description = command.description?.trim() || null
  brand.sortOrder = command.sortOrder ?? 0
  await deps.brands.save(brand)
  deps.events.append([
    {
      type: 'BrandChanged',
      organizationId: deps.organizationId,
      brandId: brand.id,
    },
  ])
  return toBrandResponse(brand)
}

export async function updateBrand(
  deps: CatalogAppDeps,
  command: UpdateBrandCommand,
): Promise<BrandResponse> {
  if (!requireBrandWrite(deps.can)) throw new CatalogPermissionError()
  assertValid(validateUpdateBrand(command))
  const brand = await deps.brands.getById(
    deps.organizationId,
    command.brandId,
  )
  if (!brand) throw new CatalogNotFoundError('brand_not_found')
  const label = throwIfDomainError(
    createNamedLabel(command.name, { max: 120 }, 'Informe a marca.'),
  )
  const clash = await deps.brands.findByNormalizedName(
    deps.organizationId,
    label.normalizedName,
  )
  if (clash && clash.id !== brand.id) {
    throw new CatalogConflictError('brand_name_conflict')
  }
  const next = {
    ...brand,
    name: label.name,
    normalizedName: label.normalizedName,
    slug: createCatalogSlug(label.name),
    description:
      command.description === undefined
        ? brand.description
        : command.description?.trim() || null,
    sortOrder: command.sortOrder ?? brand.sortOrder,
  }
  await deps.brands.save(next)
  deps.events.append([
    {
      type: 'BrandChanged',
      organizationId: deps.organizationId,
      brandId: next.id,
    },
  ])
  return toBrandResponse(next)
}

export async function archiveBrand(
  deps: CatalogAppDeps,
  command: BrandIdCommand,
): Promise<BrandResponse> {
  if (!requireBrandWrite(deps.can)) throw new CatalogPermissionError()
  const brand = await deps.brands.getById(deps.organizationId, command.brandId)
  if (!brand) throw new CatalogNotFoundError('brand_not_found')
  const products = await deps.products.listByOrganization(deps.organizationId)
  if (
    products.some(
      (product) =>
        product.brandId === brand.id && product.status !== 'archived',
    )
  ) {
    throw new CatalogConflictError('brand_in_use')
  }
  const next = { ...brand, status: 'archived' as const }
  await deps.brands.save(next)
  deps.events.append([
    {
      type: 'BrandChanged',
      organizationId: deps.organizationId,
      brandId: next.id,
    },
  ])
  return toBrandResponse(next)
}
