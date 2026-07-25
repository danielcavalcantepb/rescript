import type { ProductRow, ProductStatus, Tables } from '@rescript/database'
import type { Product, ProductListItem } from '#/modules/products/domain/types'

/** Narrow CLI-generated string columns to domain CHECK unions. */
export function asProductRow(row: Tables<'product'>): ProductRow {
  return row as ProductRow
}

export function mapProduct(row: Tables<'product'> | ProductRow): Product {
  const r = asProductRow(row)
  return {
    id: r.id,
    organizationId: r.organization_id,
    name: r.name,
    description: r.description,
    sku: r.sku,
    category: r.category,
    unit: r.unit,
    status: r.status as ProductStatus,
    archivedAt: r.archived_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function mapProductListItem(row: ProductRow): ProductListItem {
  const p = mapProduct(row)
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    unit: p.unit,
    status: p.status,
    updatedAt: p.updatedAt,
  }
}
