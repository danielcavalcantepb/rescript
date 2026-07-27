import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'
import type { CatalogDomainEvent } from '#/modules/catalog/domain/events'
import { createMoney } from '#/modules/catalog/domain/value-objects/money'
import type {
  IdGenerator,
  OrganizationId,
  PriceList,
  PriceListEntry,
  VariantId,
} from '#/modules/catalog/domain/types'
import type { Money } from '#/modules/catalog/domain/value-objects/money'

export type DefaultPriceListFactoryResult = {
  priceList: PriceList
  events: CatalogDomainEvent[]
}

/** DefaultPriceListFactory — one default list per organization (ADR-0021). */
export function createDefaultPriceList(
  organizationId: OrganizationId,
  ids: IdGenerator,
  name = 'Padrão',
): DomainResult<DefaultPriceListFactoryResult> {
  const priceListId = ids()
  const priceList: PriceList = {
    id: priceListId,
    organizationId,
    name,
    description: null,
    currency: 'BRL',
    isDefault: true,
    priority: 100,
    status: 'active',
    entries: [],
  }
  return ok({
    priceList,
    events: [
      {
        type: 'PriceListCreated',
        organizationId,
        priceListId,
      },
    ],
  })
}

export function setVariantPrice(
  priceList: PriceList,
  variantId: VariantId,
  amountRaw: string | number,
  validFrom: string,
  ids: IdGenerator,
): DomainResult<{ priceList: PriceList; entry: PriceListEntry; events: CatalogDomainEvent[] }> {
  if (!priceList.isDefault && priceList.status !== 'active') {
    return err('price_required', 'Price List inválida para precificação.')
  }

  const amount = createMoney(amountRaw, priceList.currency)
  if (!amount.ok) return amount

  const entryId = ids()
  const entry: PriceListEntry = {
    id: entryId,
    priceListId: priceList.id,
    variantId,
    amount: amount.value,
    validFrom,
    validTo: null,
  }

  /** Close previous open-ended entry for the same variant. */
  const entries = priceList.entries.map((e) => {
    if (e.variantId === variantId && e.validTo === null) {
      return { ...e, validTo: validFrom }
    }
    return e
  })

  const next: PriceList = {
    ...priceList,
    entries: [...entries, entry],
  }

  return ok({
    priceList: next,
    entry,
    events: [
      {
        type: 'PriceChanged',
        organizationId: priceList.organizationId,
        priceListId: priceList.id,
        variantId,
      },
    ],
  })
}

export type { Money }
