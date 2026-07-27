import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'

export type EntityProvider<TEntity> = {
  id: string
  singularLabel: string
  getId: (entity: TEntity) => string
  getLabel: (entity: TEntity) => string
  getDescription?: (entity: TEntity) => string | null
}

export type EntityPickerProps<TEntity> = {
  provider: EntityProvider<TEntity>
  value: TEntity | null
  items: readonly TEntity[]
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  disabled?: boolean
  canCreate?: boolean
  minQueryLength?: number
  debounceMs?: number
  placeholder?: string
  createLabel?: string
  onSearch: (query: string) => void
  onInputChange?: (query: string) => void
  onLoadMore?: () => void
  onSelect: (entity: TEntity) => void
  onCreate: (query: string) => void
}

export function EntityPicker<TEntity>({
  provider,
  value,
  items,
  isLoading,
  isError,
  errorMessage,
  isFetchingNextPage,
  hasNextPage,
  disabled,
  canCreate,
  minQueryLength = 2,
  debounceMs = 300,
  placeholder,
  createLabel,
  onSearch,
  onInputChange,
  onLoadMore,
  onSelect,
  onCreate,
}: EntityPickerProps<TEntity>) {
  const listboxId = useId()
  const [query, setQuery] = useState(() =>
    value ? provider.getLabel(value) : '',
  )
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const selectedId = value ? provider.getId(value) : null
  const searchRef = useRef(onSearch)
  searchRef.current = onSearch

  useEffect(() => {
    if (value) setQuery(provider.getLabel(value))
  }, [provider, value])

  useEffect(() => {
    setActiveIndex(-1)
  }, [items, query])

  useEffect(() => {
    const normalized = query.trim()
    if (!open || normalized.length < minQueryLength) return
    const timeout = window.setTimeout(
      () => searchRef.current(normalized),
      debounceMs,
    )
    return () => window.clearTimeout(timeout)
  }, [debounceMs, minQueryLength, open, query])

  const hasSearch = query.trim().length >= minQueryLength
  const showEmpty = hasSearch && !isLoading && items.length === 0

  return (
    <div className="relative">
      <Input
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open && hasSearch}
        aria-busy={Boolean(isLoading)}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        value={query}
        disabled={disabled}
        placeholder={placeholder ?? `Buscar ${provider.singularLabel}`}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const nextQuery = event.target.value
          setQuery(nextQuery)
          onInputChange?.(nextQuery)
          setOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false)
            setActiveIndex(-1)
            return
          }
          if (!open || items.length === 0) return
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex((current) =>
              current >= items.length - 1 ? 0 : current + 1,
            )
            return
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((current) =>
              current <= 0 ? items.length - 1 : current - 1,
            )
            return
          }
          if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault()
            const entity = items[activeIndex]
            if (!entity) return
            onSelect(entity)
            setQuery(provider.getLabel(entity))
            setOpen(false)
            setActiveIndex(-1)
          }
        }}
      />

      {selectedId ? (
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Selecionado: {provider.getLabel(value as TEntity)}
        </p>
      ) : null}

      {open && hasSearch ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={`Resultados de ${provider.singularLabel}`}
          className="absolute z-[var(--z-dropdown)] mt-2 max-h-64 w-full overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1 shadow-[var(--shadow-overlay)]"
        >
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-[var(--color-muted)]">
              Buscando…
            </p>
          ) : null}

          {isError ? (
            <p role="alert" className="px-3 py-2 text-sm text-[var(--color-danger)]">
              {errorMessage ?? `Não foi possível buscar ${provider.singularLabel}.`}
            </p>
          ) : null}

          {items.map((entity, index) => {
            const id = provider.getId(entity)
            const description = provider.getDescription?.(entity)
            return (
              <button
                key={id}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={selectedId === id || activeIndex === index}
                type="button"
                className="block w-full rounded-[var(--radius-sm)] px-3 py-2 text-left hover:bg-[var(--color-hover)] aria-selected:bg-[var(--color-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(entity)
                  setQuery(provider.getLabel(entity))
                  setOpen(false)
                  setActiveIndex(-1)
                }}
              >
                <span className="block text-sm text-[var(--color-ink)]">
                  {provider.getLabel(entity)}
                </span>
                {description ? (
                  <span className="block text-xs text-[var(--color-muted)]">
                    {description}
                  </span>
                ) : null}
              </button>
            )
          })}

          {hasNextPage ? (
            <Button
              type="button"
              variant="ghost"
              className="mt-1 w-full"
              disabled={isFetchingNextPage}
              onMouseDown={(event) => event.preventDefault()}
              onClick={onLoadMore}
            >
              {isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
            </Button>
          ) : null}

          {showEmpty && !isError ? (
            <div className="space-y-2 px-3 py-3">
              <p className="text-sm text-[var(--color-muted)]">
                Nenhum {provider.singularLabel} encontrado para “{query.trim()}”.
              </p>
              {canCreate ? (
                <Button
                  type="button"
                  variant="secondary"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setOpen(false)
                    onCreate(query.trim())
                  }}
                >
                  {createLabel ?? `Criar ${provider.singularLabel}`}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
