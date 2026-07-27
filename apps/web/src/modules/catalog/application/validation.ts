import type {
  AddPriceEntryCommand,
  CreateBrandCommand,
  CreateCategoryCommand,
  CreatePriceListCommand,
  CreateProductCommand,
  CreateVariantCommand,
  MoveCategoryCommand,
  RenameProductCommand,
  SearchCatalogQuery,
  UpdateBrandCommand,
  UpdateCategoryCommand,
  UpdatePriceEntryCommand,
  UpdateProductCommand,
  UpdateVariantCommand,
} from '#/modules/catalog/application/dto'
import { CatalogValidationError } from '#/modules/catalog/application/errors'

export type FieldErrors = Record<string, string>

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}

export function assertValid(errors: FieldErrors): void {
  if (hasFieldErrors(errors)) throw new CatalogValidationError(errors)
}

const NAME_MAX = 200
const BRAND_MAX = 120

export function validateCreateProduct(cmd: CreateProductCommand): FieldErrors {
  const errors: FieldErrors = {}
  if (!cmd.name?.trim()) errors.name = 'Informe o nome do produto.'
  else if (cmd.name.trim().length > NAME_MAX) {
    errors.name = `Nome deve ter no máximo ${NAME_MAX} caracteres.`
  }
  if (cmd.axes && cmd.axes.length > 0) {
    if (!cmd.unitOfMeasureId?.trim() && !cmd.axes) {
      /* variable uses defaultUnitOfMeasureId from unitOfMeasureId field */
    }
    if (!cmd.unitOfMeasureId?.trim()) {
      errors.unitOfMeasureId = 'Informe a unidade de medida.'
    }
  } else {
    if (!cmd.sku?.trim()) errors.sku = 'Informe o SKU.'
    if (!cmd.unitOfMeasureId?.trim()) {
      errors.unitOfMeasureId = 'Informe a unidade de medida.'
    }
  }
  return errors
}

export function validateUpdateProduct(cmd: UpdateProductCommand): FieldErrors {
  const errors: FieldErrors = {}
  if (!cmd.productId?.trim()) errors.productId = 'Informe o produto.'
  if (cmd.name !== undefined) {
    if (!cmd.name.trim()) errors.name = 'Informe o nome do produto.'
    else if (cmd.name.trim().length > NAME_MAX) {
      errors.name = `Nome deve ter no máximo ${NAME_MAX} caracteres.`
    }
  }
  return errors
}

export function validateRenameProduct(cmd: RenameProductCommand): FieldErrors {
  const errors: FieldErrors = {}
  if (!cmd.productId?.trim()) errors.productId = 'Informe o produto.'
  if (!cmd.name?.trim()) errors.name = 'Informe o nome do produto.'
  else if (cmd.name.trim().length > NAME_MAX) {
    errors.name = `Nome deve ter no máximo ${NAME_MAX} caracteres.`
  }
  return errors
}

export function validateCreateVariant(cmd: CreateVariantCommand): FieldErrors {
  const errors: FieldErrors = {}
  if (!cmd.productId?.trim()) errors.productId = 'Informe o produto.'
  if (!cmd.sku?.trim()) errors.sku = 'Informe o SKU.'
  if (!cmd.unitOfMeasureId?.trim()) {
    errors.unitOfMeasureId = 'Informe a unidade de medida.'
  }
  return errors
}

export function validateUpdateVariant(cmd: UpdateVariantCommand): FieldErrors {
  const errors: FieldErrors = {}
  if (!cmd.productId?.trim()) errors.productId = 'Informe o produto.'
  if (!cmd.variantId?.trim()) errors.variantId = 'Informe a variante.'
  if (cmd.sku !== undefined && !cmd.sku.trim()) {
    errors.sku = 'Informe o SKU.'
  }
  return errors
}

export function validateCreateBrand(cmd: CreateBrandCommand): FieldErrors {
  const errors: FieldErrors = {}
  if (!cmd.name?.trim()) errors.name = 'Informe a marca.'
  else if (cmd.name.trim().length > BRAND_MAX) {
    errors.name = `Nome deve ter no máximo ${BRAND_MAX} caracteres.`
  }
  return errors
}

export function validateUpdateBrand(cmd: UpdateBrandCommand): FieldErrors {
  const errors: FieldErrors = {}
  if (!cmd.brandId?.trim()) errors.brandId = 'Informe a marca.'
  if (!cmd.name?.trim()) errors.name = 'Informe a marca.'
  return errors
}

export function validateCreateCategory(cmd: CreateCategoryCommand): FieldErrors {
  const errors: FieldErrors = {}
  if (!cmd.name?.trim()) errors.name = 'Informe a categoria.'
  return errors
}

export function validateUpdateCategory(cmd: UpdateCategoryCommand): FieldErrors {
  const errors: FieldErrors = {}
  if (!cmd.categoryId?.trim()) errors.categoryId = 'Informe a categoria.'
  if (!cmd.name?.trim()) errors.name = 'Informe a categoria.'
  return errors
}

export function validateMoveCategory(cmd: MoveCategoryCommand): FieldErrors {
  const errors: FieldErrors = {}
  if (!cmd.categoryId?.trim()) errors.categoryId = 'Informe a categoria.'
  return errors
}

export function validateCreatePriceList(cmd: CreatePriceListCommand): FieldErrors {
  const errors: FieldErrors = {}
  if (!cmd.name?.trim()) errors.name = 'Informe o nome da lista.'
  return errors
}

export function validateAddPriceEntry(cmd: AddPriceEntryCommand): FieldErrors {
  const errors: FieldErrors = {}
  if (!cmd.priceListId?.trim()) errors.priceListId = 'Informe a lista.'
  if (!cmd.variantId?.trim()) errors.variantId = 'Informe a variante.'
  if (!cmd.amount?.trim()) errors.amount = 'Informe o preço.'
  if (!cmd.validFrom?.trim()) errors.validFrom = 'Informe a vigência.'
  return errors
}

export function validateUpdatePriceEntry(
  cmd: UpdatePriceEntryCommand,
): FieldErrors {
  const errors: FieldErrors = {}
  if (!cmd.priceListId?.trim()) errors.priceListId = 'Informe a lista.'
  if (!cmd.entryId?.trim()) errors.entryId = 'Informe a entrada.'
  if (!cmd.amount?.trim()) errors.amount = 'Informe o preço.'
  return errors
}

export function validateSearch(query: SearchCatalogQuery): FieldErrors {
  const errors: FieldErrors = {}
  if (query.text === undefined || query.text === null) {
    errors.text = 'Informe o texto de busca.'
  }
  return errors
}
