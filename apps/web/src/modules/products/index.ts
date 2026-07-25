export type {
  Product,
  ProductListItem,
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
  ListProductsResult,
  ProductRepository,
} from '#/modules/products/domain/types'
export {
  validateCreateProduct,
  validateUpdateProduct,
  normalizeSku,
} from '#/modules/products/domain/validation'
export { createProduct } from '#/modules/products/application/create-product'
export { updateProduct } from '#/modules/products/application/update-product'
export { archiveProduct } from '#/modules/products/application/archive-product'
export { restoreProduct } from '#/modules/products/application/restore-product'
export { getProduct } from '#/modules/products/application/get-product'
export {
  listProducts,
  searchProducts,
} from '#/modules/products/application/list-products'
export {
  ProductValidationError,
  ProductPermissionError,
  ProductNotFoundError,
  ProductConflictError,
  ProductArchivedError,
  productErrorMessage,
} from '#/modules/products/application/errors'
export {
  SupabaseProductRepository,
  supabaseProductRepository,
} from '#/modules/products/infrastructure/supabase-product-repository'
