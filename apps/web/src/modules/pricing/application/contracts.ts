export type PriceListFilters = {
  organizationId: string
  search?: string
  status?: string
  page?: number
  pageSize?: number
}

export type PriceItemFilters = PriceListFilters & {
  priceListId?: string
  productId?: string
  variantId?: string
}

export type CreatePriceListCommand = {
  organizationId: string
  name: string
  code: string
  currency: string
  validFrom: string
  validTo?: string | null
}

export type CreatePriceItemCommand = {
  organizationId: string
  priceListId: string
  variantId: string
  amount: string
  minimumAmount: string
  validFrom: string
  validTo?: string | null
}

export type ResolvePriceQuery = {
  organizationId: string
  priceListId: string
  variantId: string
  at: string
}
