import { useSession } from '#/providers/app-session'

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

/**
 * Contextual greeting. Uses firstName from the centralized resolver —
 * never the email address or its local-part.
 */
export function WorkspaceGreeting() {
  const { authUser } = useSession()

  const firstName = authUser?.firstName ?? null
  const greeting = greetingForHour(new Date().getHours())

  return (
    <header>
      <h1 className="text-[1.375rem] leading-tight font-semibold tracking-tight text-[var(--color-ink)]">
        {greeting}
        {firstName ? `, ${firstName}` : ''}.
      </h1>
      <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
        Este é o seu centro operacional. Comece pelo que precisa de atenção.
      </p>
    </header>
  )
}
