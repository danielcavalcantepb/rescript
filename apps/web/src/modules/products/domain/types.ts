import type { ProductStatus } from '@rescript/database'

/** Application model — never expose raw DB rows to UI. */
export type Product = {
  id: string
  organizationId: string
  name: string
  description: string | null
  sku: string
  category: string | null
  unit: string
  status: ProductStatus
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ProductListItem = Pick<
  Product,
  'id' | 'name' | 'sku' | 'category' | 'unit' | 'status' | 'updatedAt'
>

export type CreateProductInput = {
  name: string
  description?: string | null
  sku: string
  category?: string | null
  unit: string
}

export type UpdateProductInput = Partial<CreateProductInput>

export type ListProductsQuery = {
  q?: string
  status?: ProductStatus | 'all'
  /** cursor = sort value ISO/name + id for stable pagination */
  cursor?: string | null
  limit?: number
  sort?: 'name_asc' | 'updated_desc'
}

export type ListProductsResult = {
  items: ProductListItem[]
  nextCursor: string | null
}

export type ProductRepository = {
  list(
    organizationId: string,
    query: ListProductsQuery,
  ): Promise<ListProductsResult>
  getById(organizationId: string, id: string): Promise<Product | null>
  create(
    organizationId: string,
    userId: string,
    input: CreateProductInput,
  ): Promise<Product>
  update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateProductInput,
  ): Promise<Product>
  archive(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<Product>
  restore(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<Product>
}
