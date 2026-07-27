import type {
  CatalogProductDetailResponse,
  CreateProductCommand,
  UpdateProductCommand,
} from '#/modules/catalog/application'
import type {
  CreateProductFormValues,
  EditProductFormValues,
  ProductFormValues,
} from '#/modules/catalog/ui/validation/product-form-schema'
import { emptyProductFormValues } from '#/modules/catalog/ui/validation/product-form-schema'

export function detailToFormValues(
  detail: CatalogProductDetailResponse,
): ProductFormValues {
  return {
    name: detail.name,
    sku: detail.defaultSku ?? '',
    barcode: detail.primaryBarcode ?? '',
    unitOfMeasureId: detail.defaultUnitOfMeasureId ?? '',
    brandId: detail.brandId ?? '',
    primaryCategoryId: detail.primaryCategoryId ?? '',
    description: detail.description ?? '',
    tracksInventory:
      detail.variants.find((v) => v.isDefault)?.tracksInventory ?? true,
  }
}

export function formToCreateCommand(
  values: Omit<CreateProductFormValues, 'barcode'> & {
    barcode?: string | null
  },
): CreateProductCommand {
  return {
    name: values.name,
    sku: values.sku,
    barcode: values.barcode
      ? { type: 'internal', value: values.barcode }
      : null,
    unitOfMeasureId: values.unitOfMeasureId,
    brandId: values.brandId ?? null,
    primaryCategoryId: values.primaryCategoryId ?? null,
    description: values.description ?? null,
    tracksInventory: values.tracksInventory,
  }
}

export function formToUpdateCommand(
  productId: string,
  values: EditProductFormValues,
): UpdateProductCommand {
  return {
    productId,
    name: values.name,
    brandId: values.brandId ?? null,
    primaryCategoryId: values.primaryCategoryId ?? null,
    description: values.description ?? null,
  }
}

export function mergeInitialFormValues(
  initial?: Partial<ProductFormValues>,
): ProductFormValues {
  return { ...emptyProductFormValues(), ...initial }
}
