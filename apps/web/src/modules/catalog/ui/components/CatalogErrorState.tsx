import { EmptyState } from '#/components/EmptyState'
import { Button } from '#/components/ui/button'

export function CatalogErrorState({
  title = 'Não foi possível carregar o catálogo',
  description = 'Tente novamente em instantes. Se o problema continuar, verifique sua conexão.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div role="alert">
      <EmptyState
        icon="alert"
        title={title}
        description={description}
        action={
          onRetry ? (
            <Button type="button" variant="secondary" onClick={onRetry}>
              Tentar novamente
            </Button>
          ) : undefined
        }
      />
    </div>
  )
}
