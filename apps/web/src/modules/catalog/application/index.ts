export * from '#/modules/catalog/application/dto'
export * from '#/modules/catalog/application/errors'
export * from '#/modules/catalog/application/deps'
export * from '#/modules/catalog/application/validation'
export * from '#/modules/catalog/application/mappers'
export * from '#/modules/catalog/application/product-creation-contract'
export * from '#/modules/catalog/application/ports/repositories'
export * from '#/modules/catalog/application/ports/event-collector'
export * from '#/modules/catalog/application/ports/lifecycle-audit'
export * from '#/modules/catalog/application/ports/price-history'
export {
  createCatalogApplicationService,
  type CatalogApplicationService,
} from '#/modules/catalog/application/catalog-application-service'

/** Use-case modules — import paths avoid clashing with domain factory names. */
export * as CatalogProductUseCases from '#/modules/catalog/application/use-cases/product-use-cases'
export * as CatalogVariantUseCases from '#/modules/catalog/application/use-cases/variant-use-cases'
export * as CatalogVariantMatrixUseCases from '#/modules/catalog/application/use-cases/variant-matrix-use-cases'
export * as CatalogBrandUseCases from '#/modules/catalog/application/use-cases/brand-use-cases'
export * as CatalogCategoryUseCases from '#/modules/catalog/application/use-cases/category-use-cases'
export * as CatalogPriceUseCases from '#/modules/catalog/application/use-cases/price-use-cases'
export * as CatalogSearchUseCases from '#/modules/catalog/application/use-cases/search-use-cases'
export * as CatalogListUseCases from '#/modules/catalog/application/use-cases/list-use-cases'
