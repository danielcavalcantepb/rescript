import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'
import type { Money, MoneyCurrency } from '#/modules/catalog/domain/value-objects/money'
import type { PriceList, VariantId } from '#/modules/catalog/domain/types'

export type ResolvedPrice = {
  variantId: VariantId
  priceListId: string
  priceListName: string
  amount: Money
  currency: Money['currency']
  validFrom: string
  validTo: string | null
  entryId: string
  priority: number
}

export type PriceContext = {
  /** ISO-8601 instant used for validity window. */
  at: string
  /** When set, resolve only this list. */
  priceListId?: string
  /** Optional currency filter (must match list currency). */
  currency?: MoneyCurrency
}

export type PriceValidityState = 'current' | 'future' | 'expired' | 'unbounded'

/**
 * PriceResolutionPolicy — pure resolution over PriceList aggregates.
 * Never touches persistence. Channel/customer context reserved for later.
 */
export const PriceResolutionPolicy = {
  classifyEntryValidity(
    validFrom: string,
    validTo: string | null,
    atInstant: string,
  ): PriceValidityState {
    if (validFrom > atInstant) return 'future'
    if (validTo !== null && validTo <= atInstant) return 'expired'
    if (validTo === null) return 'unbounded'
    return 'current'
  },

  isEntryEffective(
    validFrom: string,
    validTo: string | null,
    atInstant: string,
  ): boolean {
    if (validFrom > atInstant) return false
    if (validTo !== null && validTo <= atInstant) return false
    return true
  },

  resolve(
    priceList: PriceList,
    variantId: VariantId,
    atInstant: string,
  ): DomainResult<ResolvedPrice> {
    if (priceList.status !== 'active') {
      return err('price_required', 'Lista de preço arquivada ou inativa.')
    }

    const candidates = priceList.entries
      .filter((e) => e.variantId === variantId)
      .filter((e) =>
        PriceResolutionPolicy.isEntryEffective(
          e.validFrom,
          e.validTo,
          atInstant,
        ),
      )
      .sort((a, b) => b.validFrom.localeCompare(a.validFrom))

    const entry = candidates[0]
    if (!entry) {
      return err(
        'price_required',
        'Não há preço efetivo para a variante na lista.',
      )
    }

    return ok({
      variantId,
      priceListId: priceList.id,
      priceListName: priceList.name,
      amount: entry.amount,
      currency: priceList.currency,
      validFrom: entry.validFrom,
      validTo: entry.validTo,
      entryId: entry.id,
      priority: priceList.priority,
    })
  },

  /**
   * Resolve across candidate lists:
   * 1) active only
   * 2) optional currency filter
   * 3) highest priority
   * 4) default list tie-break
   * 5) latest validFrom
   */
  resolveFromLists(
    priceLists: readonly PriceList[],
    variantId: VariantId,
    context: PriceContext,
  ): DomainResult<ResolvedPrice> {
    const scoped = context.priceListId
      ? priceLists.filter((l) => l.id === context.priceListId)
      : priceLists

    if (context.priceListId && scoped.length === 0) {
      return err('price_required', 'Lista de preço não encontrada.')
    }

    const active = scoped.filter((l) => l.status === 'active')
    const currencyFiltered = context.currency
      ? active.filter((l) => l.currency === context.currency)
      : active

    const resolved: ResolvedPrice[] = []
    for (const list of currencyFiltered) {
      const result = PriceResolutionPolicy.resolve(
        list,
        variantId,
        context.at,
      )
      if (result.ok) resolved.push(result.value)
    }

    if (resolved.length === 0) {
      return err(
        'price_required',
        'Não há preço efetivo para a variante no contexto informado.',
      )
    }

    resolved.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      const aDefault = currencyFiltered.find((l) => l.id === a.priceListId)
        ?.isDefault
        ? 1
        : 0
      const bDefault = currencyFiltered.find((l) => l.id === b.priceListId)
        ?.isDefault
        ? 1
        : 0
      if (bDefault !== aDefault) return bDefault - aDefault
      return b.validFrom.localeCompare(a.validFrom)
    })

    return ok(resolved[0]!)
  },

  hasEffectivePrice(
    priceList: PriceList,
    variantId: VariantId,
    atInstant: string,
  ): boolean {
    return PriceResolutionPolicy.resolve(priceList, variantId, atInstant).ok
  },
} as const
