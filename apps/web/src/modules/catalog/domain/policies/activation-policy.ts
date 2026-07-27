import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'
import { ProductTopologyPolicy } from '#/modules/catalog/domain/policies/topology-policy'
import { VariantCombinationPolicy } from '#/modules/catalog/domain/policies/combination-policy'
import type { Product, ProductVariant } from '#/modules/catalog/domain/types'

export type ActivationPriceContext = {
  /** variantId → has effective price on default price list */
  hasEffectivePriceByVariantId: ReadonlyMap<string, boolean>
}

export type ActivationIssue = {
  code:
    | 'activation_blocked'
    | 'price_required'
    | 'sku_required'
    | 'uom_required'
    | 'invariant_violation'
  message: string
  variantId?: string
}

/**
 * CatalogActivationService / ActivationPolicy —
 * Product + Variants may activate only when invariants and price hold.
 */
export const CatalogActivationPolicy = {
  evaluateVariant(
    variant: ProductVariant,
    prices: ActivationPriceContext,
  ): ActivationIssue[] {
    const issues: ActivationIssue[] = []
    if (!variant.sku) {
      issues.push({
        code: 'sku_required',
        message: 'Variante ativa exige SKU.',
        variantId: variant.id,
      })
    }
    if (!variant.unitOfMeasureId) {
      issues.push({
        code: 'uom_required',
        message: 'Variante ativa exige unidade de medida.',
        variantId: variant.id,
      })
    }
    if (prices.hasEffectivePriceByVariantId.get(variant.id) !== true) {
      issues.push({
        code: 'price_required',
        message: 'Variante ativa exige preço efetivo na Price List padrão.',
        variantId: variant.id,
      })
    }
    return issues
  },

  evaluateProduct(
    product: Product,
    prices: ActivationPriceContext,
  ): DomainResult<{ issues: ActivationIssue[] }> {
    const topology = ProductTopologyPolicy.assertInvariants(product)
    if (!topology.ok) {
      return err(topology.error.code, topology.error.message)
    }

    if (product.name.trim().length < 1) {
      return err('activation_blocked', 'Produto ativo exige nome.')
    }

    const hashes = product.variants.map((v) => v.combinationHash)
    const unique = VariantCombinationPolicy.assertUniqueHashes(hashes)
    if (!unique.ok) return unique

    for (const variant of product.variants) {
      const match = VariantCombinationPolicy.assertValuesMatchAxes(
        product.axes,
        variant.attributeValues,
      )
      if (!match.ok) return match
    }

    const issues: ActivationIssue[] = []
    for (const variant of product.variants) {
      issues.push(...CatalogActivationPolicy.evaluateVariant(variant, prices))
    }

    if (issues.length > 0) {
      return ok({ issues })
    }

    return ok({ issues: [] })
  },

  /** Activate only when evaluateProduct returns zero issues. */
  canActivate(
    product: Product,
    prices: ActivationPriceContext,
  ): DomainResult<true> {
    const evaluated = CatalogActivationPolicy.evaluateProduct(product, prices)
    if (!evaluated.ok) return evaluated
    if (evaluated.value.issues.length > 0) {
      const first = evaluated.value.issues[0]!
      return err(first.code, first.message)
    }
    return ok(true)
  },
} as const
