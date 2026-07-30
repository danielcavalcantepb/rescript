import type { CatalogSearchHitResponse } from '#/modules/catalog/application/dto'
import type { SalesItemInput } from '#/modules/sales'

export type SalesScannerLine = SalesItemInput & {
  productId: string
  productName?: string
  variantSku?: string | null
  priceSourceLabel?: string
}

export function emptyScannableLine(): SalesScannerLine {
  return {
    productId: '',
    productName: '',
    variantId: '',
    variantSku: '',
    quantity: '1',
    unitPrice: '0',
    discount: '0',
    description: '',
    priceListId: null,
    priceSourceLabel: 'Manual',
  }
}

/** Adds one scanned unit, reusing the existing order line when present. */
export function addScannedVariantToLines(
  current: SalesScannerLine[],
  selected: CatalogSearchHitResponse,
): SalesScannerLine[] {
  const existingIndex = current.findIndex(
    (line) => line.variantId === selected.variantId,
  )
  if (existingIndex >= 0) {
    return current.map((line, index) => {
      if (index !== existingIndex) return line
      const quantity = Number(line.quantity.replace(',', '.'))
      return {
        ...line,
        quantity: String((Number.isFinite(quantity) ? quantity : 0) + 1),
      }
    })
  }

  const scannedLine: SalesScannerLine = {
    ...emptyScannableLine(),
    productId: selected.productId,
    productName: selected.productName,
    variantId: selected.variantId,
    variantSku: selected.variantSku,
    priceSourceLabel: 'Buscando preço…',
  }
  const emptyIndex = current.findIndex((line) => !line.variantId)
  return emptyIndex >= 0
    ? current.map((line, index) => (index === emptyIndex ? scannedLine : line))
    : [...current, scannedLine]
}
