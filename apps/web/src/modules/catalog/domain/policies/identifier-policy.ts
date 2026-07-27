import { createBarcode } from '#/modules/catalog/domain/value-objects/barcode'
import { createSku } from '#/modules/catalog/domain/value-objects/sku'
import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'
import type { BarcodeType } from '#/modules/catalog/domain/value-objects/barcode'
import type { Barcode } from '#/modules/catalog/domain/value-objects/barcode'
import type { Sku } from '#/modules/catalog/domain/value-objects/sku'

/**
 * IdentifierPolicy — normalize and validate SKU/barcode.
 * Uniqueness against org inventory of codes is checked with a provided set
 * (persistence will supply the set; domain stays pure).
 */
export const IdentifierPolicy = {
  parseSku(raw: string): DomainResult<Sku> {
    return createSku(raw)
  },

  parseBarcode(type: BarcodeType, raw: string): DomainResult<Barcode> {
    return createBarcode(type, raw)
  },

  assertSkuUnique(
    sku: Sku,
    existingNormalizedSkus: ReadonlySet<string>,
  ): DomainResult<true> {
    if (existingNormalizedSkus.has(sku.value)) {
      return err('duplicate_sku', 'SKU já utilizado nesta organização.')
    }
    return ok(true)
  },

  assertBarcodeUnique(
    barcode: Barcode,
    existingNormalizedBarcodes: ReadonlySet<string>,
  ): DomainResult<true> {
    const key = barcode.value.toUpperCase()
    if (existingNormalizedBarcodes.has(key)) {
      return err(
        'duplicate_barcode',
        'Código de barras já utilizado nesta organização.',
      )
    }
    return ok(true)
  },
} as const
