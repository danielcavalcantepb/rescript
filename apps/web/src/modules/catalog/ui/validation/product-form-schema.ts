import { z } from 'zod'

const optionalId = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional()

/** Create mode — fields supported by CreateProductCommand (simple product). */
export const createProductFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome do produto.')
    .max(200, 'Nome deve ter no máximo 200 caracteres.'),
  sku: z
    .string()
    .trim()
    .min(1, 'Informe o SKU.')
    .max(64, 'SKU deve ter no máximo 64 caracteres.'),
  barcode: z
    .string()
    .trim()
    .max(32, 'Código de barras deve ter no máximo 32 caracteres.')
    .regex(
      /^[A-Za-z0-9._-]*$/,
      'Use apenas letras, números, ponto, hífen ou underscore.',
    )
    .optional()
    .transform((v) => v || null),
  unitOfMeasureId: z.string().trim().min(1, 'Informe a unidade de medida.'),
  brandId: optionalId,
  primaryCategoryId: optionalId,
  description: z
    .string()
    .trim()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres.')
    .optional()
    .transform((v) => v || null),
  tracksInventory: z.boolean(),
})

/** Edit mode — fields supported by UpdateProductCommand (+ read-only display fields). */
export const editProductFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome do produto.')
    .max(200, 'Nome deve ter no máximo 200 caracteres.'),
  brandId: optionalId,
  primaryCategoryId: optionalId,
  description: z
    .string()
    .trim()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres.')
    .optional()
    .transform((v) => v || null),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unitOfMeasureId: z.string().optional(),
  tracksInventory: z.boolean().optional(),
})

export type CreateProductFormValues = z.infer<typeof createProductFormSchema>
export type EditProductFormValues = z.infer<typeof editProductFormSchema>

export type ProductFormValues = {
  name: string
  sku: string
  barcode: string
  unitOfMeasureId: string
  brandId: string
  primaryCategoryId: string
  description: string
  tracksInventory: boolean
}

export const emptyProductFormValues = (): ProductFormValues => ({
  name: '',
  sku: '',
  barcode: '',
  unitOfMeasureId: '',
  brandId: '',
  primaryCategoryId: '',
  description: '',
  tracksInventory: true,
})
