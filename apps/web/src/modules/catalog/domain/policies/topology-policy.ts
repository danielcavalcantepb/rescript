import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'
import type { Product, ProductTopology } from '#/modules/catalog/domain/types'

/**
 * ProductTopologyPolicy — simple vs variable rules and historical lock.
 * Operational history is provided by the caller (Inventory/Sales facts),
 * never queried from infra inside the domain.
 */
export type TopologyContext = {
  /** True after first confirmed Sale or InventoryMovement for any variant. */
  hasOperationalHistory: boolean
}

export const ProductTopologyPolicy = {
  inferTopology(product: Pick<Product, 'axes' | 'variants'>): ProductTopology {
    return product.axes.length > 0 ? 'variable' : 'simple'
  },

  assertSimpleInvariants(
    product: Pick<Product, 'axes' | 'variants'>,
  ): DomainResult<true> {
    if (product.axes.length > 0) {
      return err(
        'invariant_violation',
        'Produto simples não pode possuir eixos.',
      )
    }
    if (product.variants.length !== 1) {
      return err(
        'missing_default_variant',
        'Produto simples deve possuir exatamente uma variante.',
      )
    }
    const only = product.variants[0]!
    if (!only.isDefault) {
      return err(
        'missing_default_variant',
        'Produto simples deve possuir default Variant.',
      )
    }
    if (only.attributeValues.length > 0) {
      return err(
        'invariant_violation',
        'Default Variant não possui valores de eixo.',
      )
    }
    return ok(true)
  },

  assertVariableInvariants(
    product: Pick<Product, 'axes' | 'variants'>,
  ): DomainResult<true> {
    if (product.axes.length < 1) {
      return err(
        'invariant_violation',
        'Produto variável deve possuir ao menos um eixo.',
      )
    }
    if (product.variants.some((v) => v.isDefault)) {
      return err(
        'unexpected_default_variant',
        'Produto variável não possui default Variant.',
      )
    }
    if (product.variants.length < 1) {
      return err(
        'invariant_violation',
        'Produto variável deve possuir ao menos uma variante.',
      )
    }
    return ok(true)
  },

  assertInvariants(product: Product): DomainResult<true> {
    if (product.topology === 'simple') {
      return ProductTopologyPolicy.assertSimpleInvariants(product)
    }
    return ProductTopologyPolicy.assertVariableInvariants(product)
  },

  canChangeTopology(context: TopologyContext): DomainResult<true> {
    if (context.hasOperationalHistory) {
      return err(
        'topology_locked',
        'Topologia bloqueada após histórico operacional. Arquive e crie um novo produto.',
      )
    }
    return ok(true)
  },

  canChangeAxes(context: TopologyContext): DomainResult<true> {
    return ProductTopologyPolicy.canChangeTopology(context)
  },

  canChangeCombinationOrUom(context: TopologyContext): DomainResult<true> {
    if (context.hasOperationalHistory) {
      return err(
        'topology_locked',
        'Combinação e UOM são imutáveis após histórico operacional.',
      )
    }
    return ok(true)
  },
} as const
