export type PriceListStatus = 'active' | 'archived'
export type PriceItemStatus = 'active' | 'removed'

export type PriceListSummary = {
  id: string
  name: string
  code: string
  status: PriceListStatus
  currency: string
  validFrom: string
  validTo: string | null
  updatedAt: string
  itemCount: number
}

export type PriceListItem = {
  id: string
  priceListId: string
  priceListName: string
  priceListCode: string
  productId: string
  productName: string
  variantId: string
  variantName: string
  sku: string | null
  amount: string
  minimumAmount: string
  currency: string
  validFrom: string
  validTo: string | null
  status: PriceItemStatus
}

export type PricingVariant = {
  id: string
  productId: string
  productName: string
  name: string
  sku: string | null
}

export type ResolvedPrice = {
  priceListId: string
  priceListName: string
  priceListCode: string
  itemId: string
  variantId: string
  amount: string
  minimumAmount: string
  currency: string
  validFrom: string
  validTo: string | null
}

export type Page<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
