import type { CatalogAppDeps } from '#/modules/catalog/application/deps'
import * as brand from '#/modules/catalog/application/use-cases/brand-use-cases'
import * as category from '#/modules/catalog/application/use-cases/category-use-cases'
import * as list from '#/modules/catalog/application/use-cases/list-use-cases'
import * as price from '#/modules/catalog/application/use-cases/price-use-cases'
import * as product from '#/modules/catalog/application/use-cases/product-use-cases'
import * as search from '#/modules/catalog/application/use-cases/search-use-cases'
import * as variant from '#/modules/catalog/application/use-cases/variant-use-cases'
import * as variantMatrix from '#/modules/catalog/application/use-cases/variant-matrix-use-cases'

/**
 * Thin facade that binds deps once — orchestration only, no domain logic.
 */
export function createCatalogApplicationService(deps: CatalogAppDeps) {
  return {
    createProduct: (cmd: Parameters<typeof product.createProduct>[1]) =>
      product.createProduct(deps, cmd),
    updateProduct: (cmd: Parameters<typeof product.updateProduct>[1]) =>
      product.updateProduct(deps, cmd),
    renameProduct: (cmd: Parameters<typeof product.renameProduct>[1]) =>
      product.renameProduct(deps, cmd),
    archiveProduct: (cmd: Parameters<typeof product.archiveProduct>[1]) =>
      product.archiveProduct(deps, cmd),
    activateProduct: (cmd: Parameters<typeof product.activateProduct>[1]) =>
      product.activateProduct(deps, cmd),
    publishProduct: (cmd: Parameters<typeof product.publishProduct>[1]) =>
      product.publishProduct(deps, cmd),
    deactivateProduct: (cmd: Parameters<typeof product.deactivateProduct>[1]) =>
      product.deactivateProduct(deps, cmd),
    restoreProduct: (cmd: Parameters<typeof product.restoreProduct>[1]) =>
      product.restoreProduct(deps, cmd),
    getLifecycle: (productId: string) => product.getLifecycle(deps, productId),
    getProduct: (productId: string) => product.getProduct(deps, productId),
    getProductDetail: (productId: string) =>
      product.getProductDetail(deps, productId),

    createVariant: (cmd: Parameters<typeof variant.createVariant>[1]) =>
      variant.createVariant(deps, cmd),
    getVariant: (cmd: Parameters<typeof variant.getVariant>[1]) =>
      variant.getVariant(deps, cmd),
    updateVariant: (cmd: Parameters<typeof variant.updateVariant>[1]) =>
      variant.updateVariant(deps, cmd),
    removeVariant: (cmd: Parameters<typeof variant.removeVariant>[1]) =>
      variant.removeVariant(deps, cmd),
    archiveVariant: (cmd: Parameters<typeof variant.archiveVariant>[1]) =>
      variant.archiveVariant(deps, cmd),
    restoreVariant: (cmd: Parameters<typeof variant.restoreVariant>[1]) =>
      variant.restoreVariant(deps, cmd),
    activateVariant: (cmd: Parameters<typeof variant.activateVariant>[1]) =>
      variant.activateVariant(deps, cmd),
    deactivateVariant: (cmd: Parameters<typeof variant.deactivateVariant>[1]) =>
      variant.deactivateVariant(deps, cmd),

    getProductVariants: (
      query: Parameters<typeof variantMatrix.getProductVariants>[1],
    ) => variantMatrix.getProductVariants(deps, query),
    getVariantAxes: (productId: string) =>
      variantMatrix.getVariantAxes(deps, productId),
    previewVariantCombinations: (
      cmd: Parameters<typeof variantMatrix.previewVariantCombinations>[1],
    ) => variantMatrix.previewVariantCombinations(deps, cmd),
    applyVariantCombinations: (
      cmd: Parameters<typeof variantMatrix.applyVariantCombinations>[1],
    ) => variantMatrix.applyVariantCombinations(deps, cmd),
    defineVariantAxes: (
      cmd: Parameters<typeof variantMatrix.defineVariantAxes>[1],
    ) => variantMatrix.defineVariantAxes(deps, cmd),
    addVariantAxis: (cmd: Parameters<typeof variantMatrix.addVariantAxis>[1]) =>
      variantMatrix.addVariantAxis(deps, cmd),
    removeVariantAxis: (
      cmd: Parameters<typeof variantMatrix.removeVariantAxis>[1],
    ) => variantMatrix.removeVariantAxis(deps, cmd),
    addVariantOption: (
      cmd: Parameters<typeof variantMatrix.addVariantOption>[1],
    ) => variantMatrix.addVariantOption(deps, cmd),
    updateVariantOption: (
      cmd: Parameters<typeof variantMatrix.updateVariantOption>[1],
    ) => variantMatrix.updateVariantOption(deps, cmd),
    removeVariantOption: (
      cmd: Parameters<typeof variantMatrix.removeVariantOption>[1],
    ) => variantMatrix.removeVariantOption(deps, cmd),

    createBrand: (cmd: Parameters<typeof brand.createBrand>[1]) =>
      brand.createBrand(deps, cmd),
    updateBrand: (cmd: Parameters<typeof brand.updateBrand>[1]) =>
      brand.updateBrand(deps, cmd),

    createCategory: (cmd: Parameters<typeof category.createCategory>[1]) =>
      category.createCategory(deps, cmd),
    updateCategory: (cmd: Parameters<typeof category.updateCategory>[1]) =>
      category.updateCategory(deps, cmd),
    moveCategory: (cmd: Parameters<typeof category.moveCategory>[1]) =>
      category.moveCategory(deps, cmd),

    createPriceList: (cmd: Parameters<typeof price.createPriceList>[1]) =>
      price.createPriceList(deps, cmd),
    updatePriceList: (cmd: Parameters<typeof price.updatePriceList>[1]) =>
      price.updatePriceList(deps, cmd),
    activatePriceList: (cmd: Parameters<typeof price.activatePriceList>[1]) =>
      price.activatePriceList(deps, cmd),
    deactivatePriceList: (
      cmd: Parameters<typeof price.deactivatePriceList>[1],
    ) => price.deactivatePriceList(deps, cmd),
    archivePriceList: (cmd: Parameters<typeof price.archivePriceList>[1]) =>
      price.archivePriceList(deps, cmd),
    restorePriceList: (cmd: Parameters<typeof price.restorePriceList>[1]) =>
      price.restorePriceList(deps, cmd),
    getPriceList: (priceListId: string) =>
      price.getPriceList(deps, priceListId),
    addPriceEntry: (cmd: Parameters<typeof price.addPriceEntry>[1]) =>
      price.addPriceEntry(deps, cmd),
    updatePriceEntry: (cmd: Parameters<typeof price.updatePriceEntry>[1]) =>
      price.updatePriceEntry(deps, cmd),
    closePriceEntry: (cmd: Parameters<typeof price.closePriceEntry>[1]) =>
      price.closePriceEntry(deps, cmd),
    resolveCurrentPrice: (
      cmd: Parameters<typeof price.resolveCurrentPrice>[1],
    ) => price.resolveCurrentPrice(deps, cmd),
    getResolvedPrice: (cmd: Parameters<typeof price.getResolvedPrice>[1]) =>
      price.getResolvedPrice(deps, cmd),
    listPricesByVariant: (
      query: Parameters<typeof price.listPricesByVariant>[1],
    ) => price.listPricesByVariant(deps, query),
    getVariantPriceSummary: (variantId: string) =>
      price.getVariantPriceSummary(deps, variantId),
    listPriceHistory: (query: Parameters<typeof price.listPriceHistory>[1]) =>
      price.listPriceHistory(deps, query),

    searchCatalog: (query: Parameters<typeof search.searchCatalog>[1]) =>
      search.searchCatalog(deps, query),
    searchVariants: (query: Parameters<typeof search.searchVariants>[1]) =>
      search.searchVariants(deps, query),

    listProducts: (query?: Parameters<typeof list.listProducts>[1]) =>
      list.listProducts(deps, query),
    listBrands: () => list.listBrands(deps),
    listCategories: () => list.listCategories(deps),
    listPriceLists: () => list.listPriceLists(deps),
    listUnitsOfMeasure: () => list.listUnitsOfMeasure(deps),
  }
}

export type CatalogApplicationService = ReturnType<
  typeof createCatalogApplicationService
>
