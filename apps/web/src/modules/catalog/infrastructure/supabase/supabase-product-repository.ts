import '#/modules/catalog/infrastructure/supabase/assert-server-only'
import type { CatalogProductRepository } from '#/modules/catalog/application/ports/repositories'
import type { Product } from '#/modules/catalog/domain/types'
import type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'
import { resolveNowIso } from '#/modules/catalog/infrastructure/supabase/client-options'
import { throwIfSupabaseError } from '#/modules/catalog/infrastructure/supabase/errors'
import {
  mapProductAggregate,
  productToRow,
  variantToRow,
} from '#/modules/catalog/infrastructure/supabase/mappers'
import type {
  ProductRow,
  ProductVariantAxisOptionRow,
  ProductVariantAxisRow,
  ProductVariantAttributeValueRow,
  ProductVariantBarcodeRow,
  ProductVariantRow,
} from '#/modules/catalog/infrastructure/supabase/persistence-types'
import type { CatalogSql } from '#/modules/catalog/infrastructure/supabase/sql.server'
import { withCatalogTransaction } from '#/modules/catalog/infrastructure/supabase/sql.server'
import { SupabaseVariantRepository } from '#/modules/catalog/infrastructure/supabase/supabase-variant-repository'
import { assertEntityOrganization } from '#/modules/catalog/infrastructure/supabase/tenant-context'

export class SupabaseProductRepository implements CatalogProductRepository {
  private readonly variants: SupabaseVariantRepository

  constructor(private readonly options: CatalogSupabaseReposOptions) {
    this.variants = new SupabaseVariantRepository(options)
  }

  async getById(
    organizationId: string,
    productId: string,
  ): Promise<Product | null> {
    this.assertOrg(organizationId)
    const { data: product, error } = await this.options.client
      .from('product')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', productId)
      .not('lifecycle_status', 'is', null)
      .maybeSingle()
    throwIfSupabaseError(error)
    if (!product) return null
    return this.reconstruct(product as ProductRow)
  }

  async listByOrganization(organizationId: string): Promise<Product[]> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('product')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .not('lifecycle_status', 'is', null)
      .order('name', { ascending: true })
    throwIfSupabaseError(error)

    const productRows = (data ?? []) as ProductRow[]
    if (productRows.length === 0) return []
    return this.reconstructMany(productRows)
  }

  async listSkus(organizationId: string): Promise<string[]> {
    this.assertOrg(organizationId)
    return this.variants.listSkus(this.options.organizationId)
  }

  async listBarcodes(organizationId: string): Promise<string[]> {
    this.assertOrg(organizationId)
    return this.variants.listBarcodes(this.options.organizationId)
  }

  async save(product: Product): Promise<void> {
    assertEntityOrganization(product.organizationId, this.options.organizationId)
    for (const variant of product.variants) {
      assertEntityOrganization(
        variant.organizationId,
        this.options.organizationId,
      )
      if (variant.productId !== product.id) {
        throwIfSupabaseError({
          code: '23503',
          message: 'variant_product_mismatch',
        })
      }
    }

    const ctx = {
      actorUserId: this.options.actorUserId,
      nowIso: resolveNowIso(this.options),
    }
    const orgId = this.options.organizationId

    await withCatalogTransaction(
      this.options.databaseUrl,
      orgId,
      this.options.actorUserId,
      async ({ sql }) => {
        const existingProduct = await sql<ProductRow[]>`
          select * from public.product
          where id = ${product.id}::uuid
            and organization_id = ${orgId}::uuid
        `
        const productRow = productToRow(
          product,
          ctx,
          existingProduct[0] ?? null,
        )

        await sql`
          insert into public.product ${sql(productRow)}
          on conflict (id) do update set
            name = excluded.name,
            description = excluded.description,
            sku = excluded.sku,
            unit = excluded.unit,
            status = excluded.status,
            brand_id = excluded.brand_id,
            primary_category_id = excluded.primary_category_id,
            lifecycle_status = excluded.lifecycle_status,
            archived_at = excluded.archived_at,
            archived_by = excluded.archived_by,
            updated_at = excluded.updated_at,
            updated_by = excluded.updated_by
          where public.product.organization_id = ${orgId}::uuid
        `

        const existingVariants = await sql<ProductVariantRow[]>`
          select * from public.product_variant
          where product_id = ${product.id}::uuid
            and organization_id = ${orgId}::uuid
        `
        const existingById = new Map(existingVariants.map((v) => [v.id, v]))
        const keepVariantIds = new Set(product.variants.map((v) => v.id))
        const removeVariantIds = existingVariants
          .filter((v) => !keepVariantIds.has(v.id))
          .map((v) => v.id)

        if (removeVariantIds.length > 0) {
          await sql`
            delete from public.product_variant
            where organization_id = ${orgId}::uuid
              and id = any(${removeVariantIds}::uuid[])
          `
        }

        for (const variant of product.variants) {
          const variantRow = variantToRow(
            variant,
            ctx,
            existingById.get(variant.id) ?? null,
          )
          await sql`
            insert into public.product_variant ${sql(variantRow)}
            on conflict (id) do update set
              sku = excluded.sku,
              unit_of_measure_id = excluded.unit_of_measure_id,
              combination_hash = excluded.combination_hash,
              is_default = excluded.is_default,
              tracks_inventory = excluded.tracks_inventory,
              min_sale_qty = excluded.min_sale_qty,
              sale_multiple = excluded.sale_multiple,
              status = excluded.status,
              archived_at = excluded.archived_at,
              archived_by = excluded.archived_by,
              updated_at = excluded.updated_at,
              updated_by = excluded.updated_by
            where public.product_variant.organization_id = ${orgId}::uuid
          `

          await this.replaceVariantChildren(sql, variant, ctx, orgId)
        }

        await this.replaceAxes(sql, product, ctx, orgId)
      },
    )
  }

  private async reconstruct(product: ProductRow): Promise<Product> {
    const [mapped] = await this.reconstructMany([product])
    return mapped!
  }

  private async reconstructMany(products: ProductRow[]): Promise<Product[]> {
    const orgId = this.options.organizationId
    const productIds = products.map((p) => p.id)
    const variantRows = await this.variants.listByProductIds(orgId, productIds)
    const variantIds = variantRows.map((v) => v.id)

    const { data: axes, error: axesError } = await this.options.client
      .from('product_variant_axis')
      .select('*')
      .eq('organization_id', orgId)
      .in('product_id', productIds)
      .order('sort_order', { ascending: true })
    throwIfSupabaseError(axesError)

    const axisRows = (axes ?? []) as ProductVariantAxisRow[]
    const axisIds = axisRows.map((a) => a.id)
    let axisOptions: ProductVariantAxisOptionRow[] = []
    if (axisIds.length > 0) {
      const { data, error } = await this.options.client
        .from('product_variant_axis_option')
        .select('axis_id, option_id')
        .in('axis_id', axisIds)
      throwIfSupabaseError(error)
      axisOptions = (data ?? []) as ProductVariantAxisOptionRow[]
    }

    let barcodes: ProductVariantBarcodeRow[] = []
    let attributeValues: ProductVariantAttributeValueRow[] = []
    if (variantIds.length > 0) {
      const { data: barcodeRows, error: barcodeError } =
        await this.options.client
          .from('product_variant_barcode')
          .select('*')
          .eq('organization_id', orgId)
          .in('variant_id', variantIds)
      throwIfSupabaseError(barcodeError)
      barcodes = (barcodeRows ?? []) as ProductVariantBarcodeRow[]

      const { data: attrRows, error: attrError } = await this.options.client
        .from('product_variant_attribute_value')
        .select('*')
        .in('variant_id', variantIds)
      throwIfSupabaseError(attrError)
      attributeValues = (attrRows ?? []) as ProductVariantAttributeValueRow[]
    }

    const variantsByProduct = new Map<string, ProductVariantRow[]>()
    for (const variant of variantRows) {
      const list = variantsByProduct.get(variant.product_id) ?? []
      list.push(variant)
      variantsByProduct.set(variant.product_id, list)
    }

    const axesByProduct = new Map<string, ProductVariantAxisRow[]>()
    for (const axis of axisRows) {
      const list = axesByProduct.get(axis.product_id) ?? []
      list.push(axis)
      axesByProduct.set(axis.product_id, list)
    }

    return products.map((product) => {
      const productAxes = axesByProduct.get(product.id) ?? []
      const productAxisIds = new Set(productAxes.map((a) => a.id))
      const productVariants = variantsByProduct.get(product.id) ?? []
      const productVariantIds = new Set(productVariants.map((v) => v.id))
      return mapProductAggregate({
        product,
        variants: productVariants,
        axes: productAxes,
        axisOptions: axisOptions.filter((o) => productAxisIds.has(o.axis_id)),
        barcodes: barcodes.filter((b) => productVariantIds.has(b.variant_id)),
        attributeValues: attributeValues.filter((a) =>
          productVariantIds.has(a.variant_id),
        ),
      })
    })
  }

  private async replaceVariantChildren(
    sql: CatalogSql,
    variant: Product['variants'][number],
    ctx: { actorUserId: string; nowIso: string },
    orgId: string,
  ): Promise<void> {
    await sql`
      delete from public.product_variant_barcode
      where variant_id = ${variant.id}::uuid
        and organization_id = ${orgId}::uuid
    `
    await sql`
      delete from public.product_variant_attribute_value vav
      using public.product_variant v
      where vav.variant_id = v.id
        and v.id = ${variant.id}::uuid
        and v.organization_id = ${orgId}::uuid
    `

    for (const barcode of variant.barcodes) {
      await sql`
        insert into public.product_variant_barcode (
          id, organization_id, variant_id, barcode_type, barcode, is_primary,
          created_at, updated_at, created_by, updated_by
        ) values (
          ${barcode.id}::uuid,
          ${orgId}::uuid,
          ${variant.id}::uuid,
          ${barcode.barcode.type},
          ${barcode.barcode.value},
          ${barcode.isPrimary},
          ${ctx.nowIso}::timestamptz,
          ${ctx.nowIso}::timestamptz,
          ${ctx.actorUserId}::uuid,
          ${ctx.actorUserId}::uuid
        )
      `
    }

    for (const value of variant.attributeValues) {
      await sql`
        insert into public.product_variant_attribute_value (
          variant_id, attribute_definition_id, option_id,
          organization_id, created_at, created_by
        ) values (
          ${variant.id}::uuid,
          ${value.attributeDefinitionId}::uuid,
          ${value.optionId}::uuid,
          ${orgId}::uuid,
          ${ctx.nowIso}::timestamptz,
          ${ctx.actorUserId}::uuid
        )
      `
    }
  }

  private async replaceAxes(
    sql: CatalogSql,
    product: Product,
    ctx: { actorUserId: string; nowIso: string },
    orgId: string,
  ): Promise<void> {
    const existingAxes = await sql<{ id: string }[]>`
      select id from public.product_variant_axis
      where product_id = ${product.id}::uuid
        and organization_id = ${orgId}::uuid
    `
    const existingAxisIds = existingAxes.map((a) => a.id)
    if (existingAxisIds.length > 0) {
      await sql`
        delete from public.product_variant_axis_option
        where axis_id = any(${existingAxisIds}::uuid[])
      `
      await sql`
        delete from public.product_variant_axis
        where product_id = ${product.id}::uuid
          and organization_id = ${orgId}::uuid
      `
    }

    for (const axis of product.axes) {
      const axisId = crypto.randomUUID()
      await sql`
        insert into public.product_variant_axis (
          id, organization_id, product_id, attribute_definition_id, sort_order,
          created_at, updated_at, created_by, updated_by
        ) values (
          ${axisId}::uuid,
          ${orgId}::uuid,
          ${product.id}::uuid,
          ${axis.attributeDefinitionId}::uuid,
          ${axis.sortOrder},
          ${ctx.nowIso}::timestamptz,
          ${ctx.nowIso}::timestamptz,
          ${ctx.actorUserId}::uuid,
          ${ctx.actorUserId}::uuid
        )
      `
      for (const optionId of axis.allowedOptionIds) {
        await sql`
          insert into public.product_variant_axis_option (axis_id, option_id)
          values (${axisId}::uuid, ${optionId}::uuid)
        `
      }
    }
  }

  private assertOrg(organizationId: string): void {
    assertEntityOrganization(organizationId, this.options.organizationId)
  }
}
