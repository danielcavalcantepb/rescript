import { useState, type FormEvent } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { RescriptLogo } from '#/components/brand/RescriptLogo'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { fetchAuthSession } from '#/lib/auth/fetch-auth-session'
import { fetchMembershipGate } from '#/lib/org/fetch-membership-gate'
import { useOrganization } from '#/platform/organization/organization-context'
import { ButtonLoading } from '#/platform/loading'
import { notificationService } from '#/platform/services'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    const { user } = await fetchAuthSession()
    if (!user) {
      throw redirect({ to: '/login', search: { redirect: '/onboarding' } })
    }
    const { hasActiveMembership } = await fetchMembershipGate()
    if (hasActiveMembership) {
      throw redirect({ to: '/' })
    }
  },
  component: OnboardingPage,
})

function OnboardingPage() {
  const { createOrganization } = useOrganization()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return

    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('Informe o nome da organização (mínimo 2 caracteres).')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await createOrganization(trimmed)
      notificationService.success('Organização criada')
      await navigate({ to: '/' })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível criar a organização.'
      setError(
        message.includes('invalid_organization_name')
          ? 'Nome inválido.'
          : 'Não foi possível criar a organização. Tente novamente.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-4">
      <div className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-7">
        <RescriptLogo variant="auth" />
        <p className="mt-7 text-[13px] text-[var(--color-text-secondary)]">
          Bem-vindo
        </p>
        <h1 className="mt-0.5 text-xl font-medium tracking-tight text-[var(--color-ink)]">
          Crie sua organização
        </h1>
        <p className="mt-1.5 text-[13px] text-[var(--color-text-secondary)]">
          Você será o proprietário. Depois disso, entre na Central.
        </p>

        <form className="mt-6 space-y-3.5" onSubmit={(e) => void onSubmit(e)}>
          <div>
            <label
              htmlFor="org-name"
              className="mb-1 block text-[13px] font-medium text-[var(--color-ink)]"
            >
              Nome da organização
            </label>
            <Input
              id="org-name"
              value={name}
              disabled={submitting}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Distribuidora Norte"
              autoFocus
            />
          </div>

          {error ? (
            <p className="rounded-[var(--radius-sm)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <ButtonLoading label="Criando…" />
            ) : (
              'Criar e entrar'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
