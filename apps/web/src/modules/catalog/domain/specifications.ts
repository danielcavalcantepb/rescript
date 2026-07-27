import type { Product, ProductVariant } from '#/modules/catalog/domain/types'
import { ProductTopologyPolicy } from '#/modules/catalog/domain/policies/topology-policy'
import {
  CatalogActivationPolicy,
  type ActivationPriceContext,
} from '#/modules/catalog/domain/policies/activation-policy'

/** Specification pattern — boolean questions over aggregates. */
export const CatalogSpecifications = {
  hasAtLeastOneVariant(product: Product): boolean {
    return product.variants.length >= 1
  },

  isSimpleWithDefaultVariant(product: Product): boolean {
    return ProductTopologyPolicy.assertSimpleInvariants(product).ok
  },

  isVariableWithoutDefault(product: Product): boolean {
    return ProductTopologyPolicy.assertVariableInvariants(product).ok
  },

  everyVariantBelongsToProduct(product: Product): boolean {
    return product.variants.every((v) => v.productId === product.id)
  },

  variantHasSku(variant: ProductVariant): boolean {
    return variant.sku !== null
  },

  variantHasUom(variant: ProductVariant): boolean {
    return variant.unitOfMeasureId !== null
  },

  isReadyToActivate(
    product: Product,
    prices: ActivationPriceContext,
  ): boolean {
    return CatalogActivationPolicy.canActivate(product, prices).ok
  },

  hasSinglePrimaryBarcode(variant: ProductVariant): boolean {
    const primaries = variant.barcodes.filter((b) => b.isPrimary)
    return primaries.length <= 1
  },
} as const
