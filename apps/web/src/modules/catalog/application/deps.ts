import type { PermissionKey } from '@rescript/permissions'
import type { CatalogEventCollector } from '#/modules/catalog/application/ports/event-collector'
import type { CatalogLifecycleAuditPort } from '#/modules/catalog/application/ports/lifecycle-audit'
import type { CatalogPriceHistoryPort } from '#/modules/catalog/application/ports/price-history'
import type {
  AttributeDefinitionRepository,
  BrandRepository,
  CatalogProductRepository,
  CategoryRepository,
  ClockPort,
  IdGeneratorPort,
  PriceListRepository,
  UnitOfMeasureRepository,
} from '#/modules/catalog/application/ports/repositories'

export type Can = (key: PermissionKey) => boolean

export type CatalogAppDeps = {
  organizationId: string
  userId: string
  can: Can
  ids: IdGeneratorPort
  clock: ClockPort
  events: CatalogEventCollector
  products: CatalogProductRepository
  brands: BrandRepository
  categories: CategoryRepository
  priceLists: PriceListRepository
  attributes: AttributeDefinitionRepository
  units: UnitOfMeasureRepository
  lifecycleAudit: CatalogLifecycleAuditPort
  priceHistory: CatalogPriceHistoryPort
}

export function requireProductWrite(can: Can) {
  return (
    can('catalog.products.write') ||
    can('products.create') ||
    can('products.edit') ||
    can('products.write')
  )
}

export function requireProductEdit(can: Can) {
  return (
    can('catalog.products.write') ||
    can('products.edit') ||
    can('products.write')
  )
}

export function requireProductRead(can: Can) {
  return (
    can('catalog.products.read') ||
    can('catalog.products.write') ||
    can('products.read') ||
    can('products.create') ||
    can('products.edit') ||
    can('products.write')
  )
}

export function requireProductPublish(can: Can) {
  return can('products.publish') || can('products.write')
}

export function requireProductArchive(can: Can) {
  return can('products.archive') || can('products.write')
}

export function requireProductRestore(can: Can) {
  return can('products.restore') || can('products.write')
}

export function requireVariantRead(can: Can) {
  return (
    can('catalog.variants.read') ||
    can('catalog.variants.write') ||
    can('products.variants.read') ||
    can('products.read') ||
    can('products.write')
  )
}

export function requireVariantCreate(can: Can) {
  return (
    can('catalog.variants.write') ||
    can('products.variants.create') ||
    can('products.write')
  )
}

export function requireVariantEdit(can: Can) {
  return (
    can('catalog.variants.write') ||
    can('products.variants.edit') ||
    can('products.write')
  )
}

export function requireVariantArchive(can: Can) {
  return (
    can('catalog.variants.write') ||
    can('products.variants.archive') ||
    can('products.write')
  )
}

export function requireVariantRestore(can: Can) {
  return (
    can('catalog.variants.write') ||
    can('products.variants.restore') ||
    can('products.write')
  )
}

export function requireVariantConfigure(can: Can) {
  return (
    can('catalog.variants.write') ||
    can('products.variants.configure') ||
    can('products.write')
  )
}

export function requireCategoryRead(can: Can) {
  return (
    can('catalog.categories.read') ||
    can('catalog.categories.write') ||
    requireProductRead(can)
  )
}

export function requireCategoryWrite(can: Can) {
  return can('catalog.categories.write') || requireProductWrite(can)
}

export function requireBrandRead(can: Can) {
  return (
    can('catalog.brands.read') ||
    can('catalog.brands.write') ||
    requireProductRead(can)
  )
}

export function requireBrandWrite(can: Can) {
  return can('catalog.brands.write') || requireProductWrite(can)
}

export function requireAttributeRead(can: Can) {
  return (
    can('catalog.attributes.read') ||
    can('catalog.attributes.write') ||
    requireVariantRead(can)
  )
}

export function requireAttributeWrite(can: Can) {
  return can('catalog.attributes.write') || requireVariantConfigure(can)
}

export function requirePricesRead(can: Can) {
  return (
    can('prices.read') ||
    can('prices.resolve') ||
    can('products.read') ||
    can('products.write')
  )
}

export function requirePricesCreate(can: Can) {
  return can('prices.create') || can('products.write')
}

export function requirePricesEdit(can: Can) {
  return can('prices.edit') || can('products.write')
}

export function requirePricesArchive(can: Can) {
  return can('prices.archive') || can('products.write')
}

export function requirePricesRestore(can: Can) {
  return can('prices.restore') || can('products.write')
}

export function requirePricesActivate(can: Can) {
  return can('prices.activate') || can('products.write')
}

export function requirePricesResolve(can: Can) {
  return (
    can('prices.resolve') ||
    can('prices.read') ||
    can('products.read') ||
    can('products.write')
  )
}
