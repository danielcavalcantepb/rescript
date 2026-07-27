import { useMemo, useState } from 'react'
import type { CatalogSearchHitResponse } from '#/modules/catalog/application/dto'
import { EntityPicker, type EntityProvider } from '#/components/entity-picker'
import { useCatalogVariantSearch } from '#/modules/catalog/ui/hooks/use-catalog-variants'

const productProvider: EntityProvider<CatalogSearchHitResponse> = {
  id: 'catalog-variants',
  singularLabel: 'produto ou variante',
  getId: (item) => item.variantId,
  getLabel: (item) => item.productName,
  getDescription: (item) =>
    [item.variantSku ? `SKU ${item.variantSku}` : null, item.status]
      .filter(Boolean)
      .join(' · '),
}

export function SalesProductPicker({
  organizationId,
  value,
  onSelect,
}: {
  organizationId: string | undefined
  value: CatalogSearchHitResponse | null
  onSelect: (item: CatalogSearchHitResponse) => void
}) {
  const [search, setSearch] = useState('')
  const query = useCatalogVariantSearch(organizationId, search)
  const items = useMemo(() => query.data ?? [], [query.data])

  return (
    <EntityPicker
      provider={productProvider}
      value={value}
      items={items}
      isLoading={query.isLoading}
      isError={query.isError}
      errorMessage="Não foi possível buscar o catálogo. Tente novamente."
      placeholder="SKU, código de barras, produto ou variante"
      onSearch={setSearch}
      onSelect={onSelect}
      onCreate={() => undefined}
    />
  )
}
