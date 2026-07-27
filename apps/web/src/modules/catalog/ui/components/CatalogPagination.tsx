import { Button } from '#/components/ui/button'

export function CatalogPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}) {
  if (total === 0) return null

  return (
    <nav
      className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Paginação do catálogo"
    >
      <p className="text-[12px] text-[var(--color-text-secondary)]">
        Página {page} de {totalPages} · {total}{' '}
        {total === 1 ? 'item' : 'itens'}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Próxima página"
        >
          Próxima
        </Button>
      </div>
    </nav>
  )
}
