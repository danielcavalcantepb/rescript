import { SearchBar } from '#/components/SearchBar'

export function CatalogSearchInput({
  value,
  onChange,
  placeholder = 'Buscar por nome, SKU ou código…',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder={placeholder} />
  )
}
