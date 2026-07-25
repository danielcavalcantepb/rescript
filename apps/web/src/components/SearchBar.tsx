import { Input } from '#/components/ui/input'
import { icons } from '#/platform/icons/catalog'

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar…',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const Search = icons.search
  return (
    <div className="relative max-w-md">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--color-muted)]"
        strokeWidth={1.5}
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-9 text-[13px]"
      />
    </div>
  )
}
