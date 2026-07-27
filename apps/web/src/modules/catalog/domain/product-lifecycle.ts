import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'
import type { CatalogDomainEvent } from '#/modules/catalog/domain/events'
import {
  CatalogActivationPolicy,
  type ActivationPriceContext,
} from '#/modules/catalog/domain/policies/activation-policy'
import { assertLifecycleTransition } from '#/modules/catalog/domain/status'
import type { Product } from '#/modules/catalog/domain/types'

export type LifecycleResult = {
  product: Product
  events: CatalogDomainEvent[]
}

export function activateProduct(
  product: Product,
  prices: ActivationPriceContext,
): DomainResult<LifecycleResult> {
  const transition = assertLifecycleTransition(product.status, 'active')
  if (transition) {
    return err('invalid_status_transition', transition)
  }

  const can = CatalogActivationPolicy.canActivate(product, prices)
  if (!can.ok) return can

  const variants = product.variants.map((v) => {
    if (v.status === 'archived') return v
    return { ...v, status: 'active' as const }
  })

  const next: Product = {
    ...product,
    status: 'active',
    variants,
  }

  const events: CatalogDomainEvent[] = [
    {
      type: 'ProductActivated',
      organizationId: product.organizationId,
      productId: product.id,
    },
    ...variants
      .filter((v) => v.status === 'active')
      .map(
        (v): CatalogDomainEvent => ({
          type: 'VariantActivated',
          organizationId: product.organizationId,
          productId: product.id,
          variantId: v.id,
        }),
      ),
  ]

  return ok({ product: next, events })
}

export function archiveProduct(product: Product): DomainResult<LifecycleResult> {
  const transition = assertLifecycleTransition(product.status, 'archived')
  if (transition) {
    return err('invalid_status_transition', transition)
  }

  const variants = product.variants.map((v) => ({
    ...v,
    status: 'archived' as const,
  }))

  const next: Product = {
    ...product,
    status: 'archived',
    variants,
  }

  return ok({
    product: next,
    events: [
      {
        type: 'ProductArchived',
        organizationId: product.organizationId,
        productId: product.id,
      },
      ...variants.map(
        (v): CatalogDomainEvent => ({
          type: 'VariantArchived',
          organizationId: product.organizationId,
          productId: product.id,
          variantId: v.id,
        }),
      ),
    ],
  })
}

/** Restore returns Product (and variants) to draft — re-activation required. */
export function restoreProduct(product: Product): DomainResult<LifecycleResult> {
  const transition = assertLifecycleTransition(product.status, 'draft')
  if (transition) {
    return err('invalid_status_transition', transition)
  }

  const variants = product.variants.map((v) => ({
    ...v,
    status: 'draft' as const,
  }))

  return ok({
    product: {
      ...product,
      status: 'draft',
      variants,
    },
    events: [
      {
        type: 'ProductRestored',
        organizationId: product.organizationId,
        productId: product.id,
      },
    ],
  })
}
