import type {
  OrganizationId,
  ProductId,
  VariantId,
  BrandId,
  CategoryId,
  PriceListId,
} from '#/modules/catalog/domain/types'

/** Domain events — payloads only; outbox/infra is out of Phase 1. */
export type CatalogDomainEvent =
  | {
      type: 'ProductCreated'
      organizationId: OrganizationId
      productId: ProductId
    }
  | {
      type: 'ProductUpdated'
      organizationId: OrganizationId
      productId: ProductId
    }
  | {
      type: 'ProductActivated'
      organizationId: OrganizationId
      productId: ProductId
    }
  | {
      type: 'ProductArchived'
      organizationId: OrganizationId
      productId: ProductId
    }
  | {
      type: 'ProductRestored'
      organizationId: OrganizationId
      productId: ProductId
    }
  | {
      type: 'VariantCreated'
      organizationId: OrganizationId
      productId: ProductId
      variantId: VariantId
    }
  | {
      type: 'VariantActivated'
      organizationId: OrganizationId
      productId: ProductId
      variantId: VariantId
    }
  | {
      type: 'VariantArchived'
      organizationId: OrganizationId
      productId: ProductId
      variantId: VariantId
    }
  | {
      type: 'VariantSkuChanged'
      organizationId: OrganizationId
      variantId: VariantId
      previousSku: string | null
      sku: string
    }
  | {
      type: 'VariantBarcodeChanged'
      organizationId: OrganizationId
      variantId: VariantId
    }
  | {
      type: 'BrandChanged'
      organizationId: OrganizationId
      brandId: BrandId
    }
  | {
      type: 'CategoryChanged'
      organizationId: OrganizationId
      categoryId: CategoryId
    }
  | {
      type: 'PriceListCreated'
      organizationId: OrganizationId
      priceListId: PriceListId
    }
  | {
      type: 'PriceListArchived'
      organizationId: OrganizationId
      priceListId: PriceListId
    }
  | {
      type: 'PriceListActivated'
      organizationId: OrganizationId
      priceListId: PriceListId
    }
  | {
      type: 'PriceChanged'
      organizationId: OrganizationId
      priceListId: PriceListId
      variantId: VariantId
    }
  | {
      type: 'PriceEntryCreated'
      organizationId: OrganizationId
      priceListId: PriceListId
      variantId: VariantId
      entryId: string
    }
  | {
      type: 'CatalogItemReindexRequested'
      organizationId: OrganizationId
      variantId: VariantId
    }
