import { describe, expect, it } from 'vitest'
import {
  asMoney,
  asQuantity,
  asSku,
  brandToRow,
  inferTopology,
  legacyProductStatus,
  mapBrand,
  mapProductAggregate,
  mapPriceList,
  numericToDecimalString,
  productToRow,
  sanitizeSearchTerm,
} from '#/modules/catalog/infrastructure/supabase/mappers'
import type {
  BrandRow,
  PriceListEntryRow,
  PriceListRow,
  ProductRow,
  ProductVariantRow,
} from '#/modules/catalog/infrastructure/supabase/persistence-types'
import type { Brand, Product } from '#/modules/catalog/domain/types'

describe('catalog persistence mappers', () => {
  it('normalizes numeric strings and quantities', () => {
    expect(numericToDecimalString('10.500000')).toBe('10.5')
    expect(numericToDecimalString(3)).toBe('3')
    expect(asQuantity('1.250').amount).toBe('1.25')
    expect(asQuantity('1.250').precision).toBe(2)
    expect(asSku('ABC-1')).toEqual({ value: 'ABC-1' })
    expect(asSku(null)).toBeNull()
    expect(asMoney('19.99').amount).toBe('19.99')
    expect(() => numericToDecimalString('not-a-number')).toThrow()
    expect(() => asMoney('10', 'USD')).toThrow()
  })

  it('infers topology and legacy status without domain rules', () => {
    expect(inferTopology(0)).toBe('simple')
    expect(inferTopology(2)).toBe('variable')
    expect(legacyProductStatus('draft')).toBe('active')
    expect(legacyProductStatus('archived')).toBe('inactive')
  })

  it('maps brand row ↔ domain', () => {
    const row: BrandRow = {
      id: 'b1',
      organization_id: 'o1',
      name: 'Acme',
      normalized_name: 'acme',
      status: 'active',
      archived_at: null,
      archived_by: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      created_by: 'u1',
      updated_by: 'u1',
    }
    const brand = mapBrand(row)
    expect(brand).toEqual({
      id: 'b1',
      organizationId: 'o1',
      name: 'Acme',
      normalizedName: 'acme',
      status: 'active',
    })
    const written = brandToRow(
      brand,
      { actorUserId: 'u2', nowIso: '2026-02-01T00:00:00.000Z' },
      row,
    )
    expect(written.updated_by).toBe('u2')
    expect(written.created_by).toBe('u1')
  })

  it('reconstructs product aggregate from rows', () => {
    const product: ProductRow = {
      id: 'p1',
      organization_id: 'o1',
      name: 'Shirt',
      description: null,
      sku: 'SHIRT-1',
      category: null,
      unit: 'un',
      status: 'active',
      brand_id: null,
      primary_category_id: null,
      lifecycle_status: 'draft',
      archived_at: null,
      archived_by: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      created_by: 'u1',
      updated_by: 'u1',
    }
    const variant: ProductVariantRow = {
      id: 'v1',
      organization_id: 'o1',
      product_id: 'p1',
      sku: 'SHIRT-1',
      unit_of_measure_id: 'uom1',
      combination_hash: 'default',
      is_default: true,
      tracks_inventory: true,
      min_sale_qty: 1,
      sale_multiple: 1,
      status: 'draft',
      archived_at: null,
      archived_by: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      created_by: 'u1',
      updated_by: 'u1',
    }

    const aggregate = mapProductAggregate({
      product,
      variants: [variant],
      axes: [],
      axisOptions: [],
      barcodes: [],
      attributeValues: [],
    })

    expect(aggregate.topology).toBe('simple')
    expect(aggregate.status).toBe('draft')
    expect(aggregate.defaultUnitOfMeasureId).toBe('uom1')
    expect(aggregate.variants[0]?.sku).toEqual({ value: 'SHIRT-1' })
  })

  it('maps product domain → legacy-compatible row', () => {
    const product: Product = {
      id: 'p1',
      organizationId: 'o1',
      name: 'Shirt',
      description: null,
      brandId: null,
      primaryCategoryId: null,
      defaultUnitOfMeasureId: 'uom1',
      topology: 'simple',
      status: 'active',
      axes: [],
      variants: [
        {
          id: 'v1',
          productId: 'p1',
          organizationId: 'o1',
          sku: { value: 'SHIRT-1' },
          barcodes: [],
          unitOfMeasureId: 'uom1',
          attributeValues: [],
          combinationHash: 'default',
          isDefault: true,
          tracksInventory: true,
          minSaleQty: { amount: '1', precision: 0 },
          saleMultiple: { amount: '1', precision: 0 },
          status: 'active',
        },
      ],
    }
    const row = productToRow(
      product,
      { actorUserId: 'u1', nowIso: '2026-01-01T00:00:00.000Z' },
      null,
    )
    expect(row.lifecycle_status).toBe('active')
    expect(row.status).toBe('active')
    expect(row.sku).toBe('SHIRT-1')
    expect(row.unit).toBe('un')
  })

  it('maps price list aggregate', () => {
    const list = {
      id: 'pl1',
      organization_id: 'o1',
      name: 'Padrão',
      description: null,
      currency: 'BRL',
      is_default: true,
      priority: 100,
      status: 'active',
      archived_at: null,
      archived_by: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      created_by: 'u1',
      updated_by: 'u1',
    } as PriceListRow
    const entry: PriceListEntryRow = {
      id: 'e1',
      organization_id: 'o1',
      price_list_id: 'pl1',
      variant_id: 'v1',
      amount: 10.5,
      currency: 'BRL',
      valid_from: '2026-01-01T00:00:00.000Z',
      valid_to: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      created_by: 'u1',
      updated_by: 'u1',
    }
    const mapped = mapPriceList({ list, entries: [entry] })
    expect(mapped.entries[0]?.amount.amount).toBe('10.5')
    expect(mapped.isDefault).toBe(true)
  })

  it('sanitizes search terms for PostgREST/SQL patterns', () => {
    expect(sanitizeSearchTerm(`a,b(c)%_"'`)).toBe('a b c')
  })

  it('does not import domain factories (reconstruction is structural)', () => {
    const brand: Brand = mapBrand({
      id: 'b1',
      organization_id: 'o1',
      name: 'X',
      normalized_name: 'x',
      status: 'archived',
      archived_at: '2026-01-01T00:00:00.000Z',
      archived_by: 'u1',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      created_by: 'u1',
      updated_by: 'u1',
    })
    expect(brand.status).toBe('archived')
  })
})
