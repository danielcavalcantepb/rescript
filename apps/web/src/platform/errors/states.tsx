import type { ReactNode } from 'react'
import { Button } from '#/components/ui/button'
import { icons } from '#/platform/icons/catalog'

type ErrorStateProps = {
  title: string
  description: string
  action?: ReactNode
}

function Frame({ title, description, action, icon }: ErrorStateProps & { icon: ReactNode }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
      {icon}
      <h1 className="text-lg font-medium text-[var(--color-ink)]">{title}</h1>
      <p className="max-w-md text-[13px] text-[var(--color-text-secondary)]">
        {description}
      </p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export function UnauthorizedState({
  title = 'Não autenticado',
  description = 'Faça login para continuar.',
  action,
}: Partial<ErrorStateProps>) {
  const Icon = icons.alert
  return (
    <Frame
      title={title}
      description={description}
      action={action}
      icon={<Icon className="size-7 text-[var(--color-muted)]" strokeWidth={1.5} />}
    />
  )
}

export function ForbiddenState({
  title = 'Sem permissão',
  description = 'Você não tem acesso a este recurso nesta organização.',
  action,
}: Partial<ErrorStateProps>) {
  const Icon = icons.alert
  return (
    <Frame
      title={title}
      description={description}
      action={action}
      icon={<Icon className="size-7 text-[var(--color-warning)]" strokeWidth={1.5} />}
    />
  )
}

export function OfflineState({
  title = 'Você está offline',
  description = 'Verifique a conexão e tente novamente.',
  onRetry,
}: Partial<ErrorStateProps> & { onRetry?: () => void }) {
  const Icon = icons.alert
  return (
    <Frame
      title={title}
      description={description}
      icon={<Icon className="size-7 text-[var(--color-muted)]" strokeWidth={1.5} />}
      action={
        onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            Tentar novamente
          </Button>
        ) : undefined
      }
    />
  )
}

export function UnexpectedErrorState({
  title = 'Algo deu errado',
  description = 'Não foi possível concluir esta operação.',
  onRetry,
  onRecover,
}: Partial<ErrorStateProps> & {
  onRetry?: () => void
  onRecover?: () => void
}) {
  const Icon = icons.alert
  return (
    <Frame
      title={title}
      description={description}
      icon={<Icon className="size-7 text-[var(--color-danger)]" strokeWidth={1.5} />}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          {onRetry ? (
            <Button variant="primary" onClick={onRetry}>
              Tentar novamente
            </Button>
          ) : null}
          {onRecover ? (
            <Button variant="secondary" onClick={onRecover}>
              Voltar à Central
            </Button>
          ) : null}
        </div>
      }
    />
  )
}

export function PageError({
  error,
  onRetry,
  onRecover,
}: {
  error?: Error | null
  onRetry?: () => void
  onRecover?: () => void
}) {
  return (
    <UnexpectedErrorState
      description={error?.message || 'Não foi possível carregar esta página.'}
      onRetry={onRetry}
      onRecover={onRecover}
    />
  )
}
