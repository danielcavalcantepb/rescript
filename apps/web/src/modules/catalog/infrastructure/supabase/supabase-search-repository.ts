import '#/modules/catalog/infrastructure/supabase/assert-server-only'
import type {
  CatalogSearchHitV1,
  CatalogSearchPort,
  CatalogSearchQuery,
} from '#/modules/catalog/domain/ports'
import type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'
import { sanitizeSearchTerm } from '#/modules/catalog/infrastructure/supabase/mappers'
import { getCatalogSql } from '#/modules/catalog/infrastructure/supabase/sql.server'
import { mapSupabaseError } from '#/modules/catalog/infrastructure/supabase/errors'
import { assertEntityOrganization } from '#/modules/catalog/infrastructure/supabase/tenant-context'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

type HitRow = {
  variant_id: string
  product_id: string
  product_name: string
  variant_sku: string | null
  brand_name: string | null
  category_name: string | null
  score: number
}

/**
 * Persistence search adapter (domain CatalogSearchPort).
 * Bound parameters only — no string concatenation of user input into SQL.
 * Organization is forced to the membership-verified tenant on options.
 */
export class SupabaseSearchRepository implements CatalogSearchPort {
  constructor(private readonly options: CatalogSupabaseReposOptions) {}

  async search(query: CatalogSearchQuery): Promise<CatalogSearchHitV1[]> {
    assertEntityOrganization(
      query.organizationId,
      this.options.organizationId,
    )

    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    )
    const offset = Math.max(query.offset ?? 0, 0)
    const text = sanitizeSearchTerm(query.text)
    const pattern = text.length > 0 ? `%${text}%` : null
    const orgId = this.options.organizationId
    const sql = getCatalogSql(this.options.databaseUrl)

    try {
      const rows = await sql<HitRow[]>`
        select
          v.id as variant_id,
          p.id as product_id,
          p.name as product_name,
          v.sku as variant_sku,
          b.name as brand_name,
          c.name as category_name,
          case
            when ${pattern}::text is null then 1
            when upper(v.sku) = upper(${text}) then 100
            when exists (
              select 1 from public.product_variant_barcode bc
              where bc.variant_id = v.id
                and bc.organization_id = ${orgId}::uuid
                and upper(bc.barcode) = upper(${text})
            ) then 95
            when v.sku ilike ${pattern} then 80
            when p.name ilike ${pattern} then 70
            when exists (
              select 1 from public.product_variant_barcode bc
              where bc.variant_id = v.id
                and bc.organization_id = ${orgId}::uuid
                and bc.barcode ilike ${pattern}
                and bc.barcode_type = 'internal'
            ) then 90
            when exists (
              select 1 from public.product_variant_barcode bc
              where bc.variant_id = v.id
                and bc.organization_id = ${orgId}::uuid
                and bc.barcode ilike ${pattern}
            ) then 40
            else 10
          end::float8 as score
        from public.product_variant v
        inner join public.product p
          on p.id = v.product_id
         and p.organization_id = v.organization_id
        left join public.brand b
          on b.id = p.brand_id
         and b.organization_id = ${orgId}::uuid
        left join public.category c
          on c.id = p.primary_category_id
         and c.organization_id = ${orgId}::uuid
        where v.organization_id = ${orgId}::uuid
          and p.organization_id = ${orgId}::uuid
          and p.lifecycle_status is not null
          and (
            ${pattern}::text is null
            or v.sku ilike ${pattern}
            or p.name ilike ${pattern}
            or exists (
              select 1 from public.product_variant_barcode bc
              where bc.variant_id = v.id
                and bc.organization_id = ${orgId}::uuid
                and bc.barcode ilike ${pattern}
            )
          )
          and (
            ${query.brandId ?? null}::uuid is null
            or p.brand_id = ${query.brandId ?? null}::uuid
          )
          and (
            ${query.categoryId ?? null}::uuid is null
            or p.primary_category_id = ${query.categoryId ?? null}::uuid
          )
        order by score desc, p.name asc, v.sku asc nulls last
        limit ${limit}
        offset ${offset}
      `

      return rows.map((row) => ({
        variantId: row.variant_id,
        productId: row.product_id,
        productDisplayName: row.product_name,
        variantDisplayName: row.variant_sku ?? row.product_name,
        sku: row.variant_sku,
        brandName: row.brand_name,
        categoryPath: row.category_name,
        score: Number(row.score),
      }))
    } catch (error) {
      mapSupabaseError(error)
    }
  }
}
