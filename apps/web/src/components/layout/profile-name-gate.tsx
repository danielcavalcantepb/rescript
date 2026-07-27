import { useState, type FormEvent, type ReactNode } from 'react'
import {
  USER_NAME_FALLBACK,
  resolveUserFirstName,
} from '@rescript/auth'
import { useSession } from '#/providers/app-session'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ButtonLoading } from '#/platform/loading'

/**
 * Blocking gate when the authenticated user has no human name in metadata.
 * Persists via supabase.auth.updateUser (user_metadata only).
 */
export function ProfileNameGate({ children }: { children: ReactNode }) {
  const { authUser, isAuthLoading, needsDisplayName, updateDisplayName } =
    useSession()
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthLoading || !authUser || !needsDisplayName) {
    return <>{children}</>
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)
    const result = await updateDisplayName(fullName)
    setSubmitting(false)

    if (!result.ok) {
      setError(result.message)
    }
  }

  return (
    <>
      {children}
      <div
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[var(--color-overlay)] px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-name-title"
      >
        <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface-elevated)] p-6 shadow-[var(--shadow-modal)]">
          <h2
            id="profile-name-title"
            className="text-lg font-medium tracking-tight text-[var(--color-ink)]"
          >
            Como devemos te chamar?
          </h2>
          <p className="mt-1.5 text-[13px] text-[var(--color-text-secondary)]">
            Seu nome completo identifica você na operação. O e-mail permanece
            apenas como contato da conta.
          </p>

          <form className="mt-5 space-y-3.5" onSubmit={(e) => void onSubmit(e)}>
            <div>
              <label
                htmlFor="profile-full-name"
                className="mb-1 block text-[13px] font-medium text-[var(--color-ink)]"
              >
                Nome completo
              </label>
              <Input
                id="profile-full-name"
                value={fullName}
                disabled={submitting}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex.: Daniel Cavalcante"
                autoFocus
                autoComplete="name"
              />
              {fullName.trim().length >= 2 ? (
                <p className="mt-1.5 text-[11px] text-[var(--color-muted)]">
                  Saudação:{' '}
                  {resolveUserFirstName({
                    userMetadata: { full_name: fullName.trim() },
                  })}
                  {authUser.email ? ` · ${authUser.email}` : null}
                </p>
              ) : (
                <p className="mt-1.5 text-[11px] text-[var(--color-muted)]">
                  Sem nome: “{USER_NAME_FALLBACK}” — nunca o trecho do e-mail.
                </p>
              )}
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-[var(--radius-sm)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs text-[var(--color-danger)]"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <ButtonLoading label="Salvando…" />
              ) : (
                'Continuar'
              )}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
