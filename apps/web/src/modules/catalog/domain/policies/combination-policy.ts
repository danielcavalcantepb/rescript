import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'
import type {
  ProductVariantAxis,
  VariantAttributeValue,
} from '#/modules/catalog/domain/types'

/** Policy limits — entitlements may tighten later; model stays stable (ADR-0022). */
export const COMBINATION_LIMITS = {
  maxAxes: 3,
  maxActiveVariantsPerProduct: 500,
  maxCombinationsPerProduct: 10_000,
} as const

/**
 * Canonical combination hash from sorted attributeDefinitionId=optionId pairs.
 * Deterministic string identity for uniqueness within a Product.
 */
export function combinationHash(values: readonly VariantAttributeValue[]): string {
  if (values.length === 0) return 'default'
  return [...values]
    .map((v) => ({
      attributeDefinitionId: v.attributeDefinitionId,
      optionId: v.optionId,
    }))
    .sort((a, b) => {
      const byAttr = a.attributeDefinitionId.localeCompare(b.attributeDefinitionId)
      if (byAttr !== 0) return byAttr
      return a.optionId.localeCompare(b.optionId)
    })
    .map((v) => `${v.attributeDefinitionId}=${v.optionId}`)
    .join('|')
}

export const VariantCombinationPolicy = {
  hash: combinationHash,

  assertAxisCount(axisCount: number): DomainResult<true> {
    if (axisCount > COMBINATION_LIMITS.maxAxes) {
      return err(
        'axis_limit_exceeded',
        `Máximo de ${COMBINATION_LIMITS.maxAxes} eixos por produto.`,
      )
    }
    return ok(true)
  },

  assertCombinationCount(count: number): DomainResult<true> {
    if (count > COMBINATION_LIMITS.maxCombinationsPerProduct) {
      return err(
        'combination_limit_exceeded',
        `Máximo de ${COMBINATION_LIMITS.maxCombinationsPerProduct} combinações por produto.`,
      )
    }
    return ok(true)
  },

  assertActiveVariantCount(count: number): DomainResult<true> {
    if (count > COMBINATION_LIMITS.maxActiveVariantsPerProduct) {
      return err(
        'variant_limit_exceeded',
        `Máximo de ${COMBINATION_LIMITS.maxActiveVariantsPerProduct} variantes ativas por produto.`,
      )
    }
    return ok(true)
  },

  /**
   * Variable variant must have exactly one value per active axis,
   * and each value must be in the axis allow-list.
   */
  assertValuesMatchAxes(
    axes: readonly ProductVariantAxis[],
    values: readonly VariantAttributeValue[],
  ): DomainResult<true> {
    if (axes.length === 0) {
      if (values.length > 0) {
        return err(
          'incomplete_combination',
          'Produto simples não possui valores de eixo.',
        )
      }
      return ok(true)
    }

    if (values.length !== axes.length) {
      return err(
        'incomplete_combination',
        'Variante variável deve ter exatamente um valor por eixo.',
      )
    }

    const byAttr = new Map(
      values.map((v) => [v.attributeDefinitionId, v.optionId] as const),
    )
    if (byAttr.size !== values.length) {
      return err(
        'incomplete_combination',
        'Combinação possui eixos duplicados.',
      )
    }

    for (const axis of axes) {
      const optionId = byAttr.get(axis.attributeDefinitionId)
      if (!optionId) {
        return err(
          'incomplete_combination',
          'Combinação incompleta para os eixos do produto.',
        )
      }
      if (!axis.allowedOptionIds.includes(optionId)) {
        return err(
          'incomplete_combination',
          'Opção não permitida para o eixo do produto.',
        )
      }
    }

    return ok(true)
  },

  assertUniqueHashes(hashes: readonly string[]): DomainResult<true> {
    const seen = new Set<string>()
    for (const hash of hashes) {
      if (seen.has(hash)) {
        return err(
          'duplicate_combination',
          'Combinação de atributos duplicada no produto.',
        )
      }
      seen.add(hash)
    }
    return ok(true)
  },

  cartesianOptionSets(
    axes: readonly ProductVariantAxis[],
  ): DomainResult<VariantAttributeValue[][]> {
    const axisCheck = VariantCombinationPolicy.assertAxisCount(axes.length)
    if (!axisCheck.ok) return axisCheck

    if (axes.length === 0) {
      return ok([[]])
    }

    for (const axis of axes) {
      if (axis.allowedOptionIds.length < 1) {
        return err(
          'incomplete_combination',
          'Cada eixo deve ter ao menos uma opção permitida.',
        )
      }
    }

    let combinations: VariantAttributeValue[][] = [[]]
    const ordered = [...axes].sort((a, b) => a.sortOrder - b.sortOrder)

    for (const axis of ordered) {
      const next: VariantAttributeValue[][] = []
      for (const prefix of combinations) {
        for (const optionId of axis.allowedOptionIds) {
          next.push([
            ...prefix,
            {
              attributeDefinitionId: axis.attributeDefinitionId,
              optionId,
            },
          ])
        }
      }
      combinations = next
      const countCheck =
        VariantCombinationPolicy.assertCombinationCount(combinations.length)
      if (!countCheck.ok) return countCheck
    }

    return ok(combinations)
  },
} as const
