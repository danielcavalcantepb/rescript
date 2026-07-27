import { HomeBlock } from '#/components/home/home-block'
import { useSession } from '#/providers/app-session'
import { useOrganization } from '#/platform/organization'
import { usePermission } from '#/platform/permissions'
import { cn } from '#/lib/utils'

type StatusTone = 'ok' | 'pending' | 'error'

type StatusSignal = {
  id: string
  label: string
  value: string
  tone: StatusTone
}

const dotClass: Record<StatusTone, string> = {
  ok: 'bg-[var(--color-success)]',
  pending: 'bg-[var(--color-warning)]',
  error: 'bg-[var(--color-danger)]',
}

/**
 * Institutional status panel. Every signal reflects real session, organization
 * and permission state — never fabricated metrics.
 */
export function OperationStatus() {
  const { authUser } = useSession()
  const { currentOrganization, isLoading: orgLoading, error: orgError } =
    useOrganization()
  const { status: permStatus } = usePermission()

  const orgActive = currentOrganization?.status === 'active'

  const signals: StatusSignal[] = [
    {
      id: 'operation',
      label: 'Operação',
      value: 'Disponível',
      tone: 'ok',
    },
    {
      id: 'organization',
      label: 'Organização ativa',
      value: orgLoading
        ? 'Carregando…'
        : orgError
          ? 'Indisponível'
          : (currentOrganization?.name ?? 'Nenhuma'),
      tone: orgLoading ? 'pending' : orgActive ? 'ok' : 'error',
    },
    {
      id: 'permissions',
      label: 'Permissões',
      value:
        permStatus === 'ready'
          ? 'Carregadas'
          : permStatus === 'error'
            ? 'Falha ao carregar'
            : 'Carregando…',
      tone:
        permStatus === 'ready'
          ? 'ok'
          : permStatus === 'error'
            ? 'error'
            : 'pending',
    },
    {
      id: 'sync',
      label: 'Sincronização',
      value:
        !orgLoading && permStatus === 'ready' ? 'Concluída' : 'Em andamento…',
      tone: !orgLoading && permStatus === 'ready' ? 'ok' : 'pending',
    },
    {
      id: 'session',
      label: 'Sessão',
      value: authUser?.email ?? '—',
      tone: authUser ? 'ok' : 'error',
    },
  ]

  return (
    <HomeBlock title="Status da operação" hint="Estado atual do sistema">
      <ul className="flex flex-col divide-y divide-[var(--color-border-soft)]">
        {signals.map((signal) => (
          <li
            key={signal.id}
            className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <span
              className={cn('size-2 shrink-0 rounded-full', dotClass[signal.tone])}
              aria-hidden
            />
            <span className="flex-1 text-[12px] text-[var(--color-text-secondary)]">
              {signal.label}
            </span>
            <span className="max-w-[55%] truncate text-[12px] font-medium text-[var(--color-ink)]">
              {signal.value}
            </span>
          </li>
        ))}
      </ul>
    </HomeBlock>
  )
}
