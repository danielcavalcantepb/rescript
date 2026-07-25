import type {
  CreateProductInput,
  UpdateProductInput,
} from '#/modules/products/domain/types'

export type FieldErrors = Record<string, string>

export const PRODUCT_LIMITS = {
  name: 200,
  description: 2000,
  sku: 64,
  category: 120,
  unit: 32,
} as const

/** Trim + uppercase for stable uniqueness per org. */
export function normalizeSku(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase()
}

function validateOptionalLengths(
  input: Partial<CreateProductInput>,
  errors: FieldErrors,
) {
  if (input.name !== undefined && input.name.trim().length > PRODUCT_LIMITS.name) {
    errors.name = `Nome deve ter no máximo ${PRODUCT_LIMITS.name} caracteres.`
  }
  if (
    input.description !== undefined &&
    input.description &&
    input.description.trim().length > PRODUCT_LIMITS.description
  ) {
    errors.description = `Descrição deve ter no máximo ${PRODUCT_LIMITS.description} caracteres.`
  }
  if (input.sku !== undefined) {
    const sku = normalizeSku(input.sku)
    if (sku.length > PRODUCT_LIMITS.sku) {
      errors.sku = `SKU deve ter no máximo ${PRODUCT_LIMITS.sku} caracteres.`
    }
  }
  if (
    input.category !== undefined &&
    input.category &&
    input.category.trim().length > PRODUCT_LIMITS.category
  ) {
    errors.category = `Categoria deve ter no máximo ${PRODUCT_LIMITS.category} caracteres.`
  }
  if (
    input.unit !== undefined &&
    input.unit.trim().length > PRODUCT_LIMITS.unit
  ) {
    errors.unit = `Unidade deve ter no máximo ${PRODUCT_LIMITS.unit} caracteres.`
  }
}

export function validateCreateProduct(input: CreateProductInput): FieldErrors {
  const errors: FieldErrors = {}
  const name = input.name?.trim() ?? ''
  if (name.length < 1) errors.name = 'Informe o nome do produto.'

  const sku = normalizeSku(input.sku)
  if (sku.length < 1) errors.sku = 'Informe o SKU.'

  const unit = input.unit?.trim() ?? ''
  if (unit.length < 1) errors.unit = 'Informe a unidade.'

  validateOptionalLengths(input, errors)
  return errors
}

export function validateUpdateProduct(input: UpdateProductInput): FieldErrors {
  const errors: FieldErrors = {}
  if (input.name !== undefined && input.name.trim().length < 1) {
    errors.name = 'Informe o nome do produto.'
  }
  if (input.sku !== undefined && normalizeSku(input.sku).length < 1) {
    errors.sku = 'Informe o SKU.'
  }
  if (input.unit !== undefined && input.unit.trim().length < 1) {
    errors.unit = 'Informe a unidade.'
  }
  validateOptionalLengths(input, errors)
  return errors
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}
