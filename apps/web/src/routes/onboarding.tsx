import { useState, type FormEvent } from 'react'
import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { RescriptLogo } from '#/components/brand/RescriptLogo'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { fetchAuthSession } from '#/lib/auth/fetch-auth-session'
import { useOrganization } from '#/platform/organization/organization-context'
import { useSession } from '#/providers/app-session'
import { ButtonLoading } from '#/platform/loading'
import { notificationService } from '#/platform/services'
import { USER_NAME_FALLBACK } from '@rescript/auth'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    const { user } = await fetchAuthSession()
    if (!user) {
      throw redirect({ to: '/login', search: { redirect: '/onboarding' } })
    }
  },
  component: OnboardingPage,
})

function OnboardingPage() {
  const { createOrganization, currentOrganization } = useOrganization()
  const { authUser, updateDisplayName, needsDisplayName } = useSession()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(
    authUser && authUser.displayName !== USER_NAME_FALLBACK
      ? authUser.displayName
      : '',
  )
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (currentOrganization) {
    return <ProvisionedOnboarding organizationName={currentOrganization.name} />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return

    const trimmedName = fullName.trim()
    const trimmedOrg = orgName.trim()

    if (trimmedName.length < 2) {
      setError('Informe seu nome completo (mínimo 2 caracteres).')
      return
    }
    if (trimmedOrg.length < 2) {
      setError('Informe o nome da organização (mínimo 2 caracteres).')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      if (needsDisplayName || trimmedName !== authUser?.displayName) {
        const nameResult = await updateDisplayName(trimmedName)
        if (!nameResult.ok) {
          setError(nameResult.message)
          return
        }
      }

      await createOrganization(trimmedOrg)
      notificationService.success('Organização criada')
      await navigate({ to: '/app' })
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
          {authUser?.email ? ` · ${authUser.email}` : ''}
        </p>
        <h1 className="mt-0.5 text-xl font-medium tracking-tight text-[var(--color-ink)]">
          Configure sua conta
        </h1>
        <p className="mt-1.5 text-[13px] text-[var(--color-text-secondary)]">
          Informe seu nome completo e crie a organização. Você será o
          proprietário.
        </p>

        <form className="mt-6 space-y-3.5" onSubmit={(e) => void onSubmit(e)}>
          <div>
            <label
              htmlFor="full-name"
              className="mb-1 block text-[13px] font-medium text-[var(--color-ink)]"
            >
              Nome completo
            </label>
            <Input
              id="full-name"
              value={fullName}
              disabled={submitting}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex.: Daniel Cavalcante"
              autoComplete="name"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="org-name"
              className="mb-1 block text-[13px] font-medium text-[var(--color-ink)]"
            >
              Nome da organização
            </label>
            <Input
              id="org-name"
              value={orgName}
              disabled={submitting}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Ex.: Distribuidora Norte"
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

function ProvisionedOnboarding({ organizationName }: { organizationName: string }) {
  const steps = [
    ['Cliente', 'Cadastre o primeiro cliente para manter histórico e relacionamento.'],
    ['Produto', 'Adicione o primeiro produto para vender com contexto e margem.'],
    ['Estoque inicial', 'Configure o saldo inicial quando houver produto físico.'],
    ['Primeira venda', 'Registre a primeira venda e acompanhe o fluxo operacional.'],
  ] as const

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] px-4 py-10">
      <main className="mx-auto max-w-5xl">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-sm)]">
          <RescriptLogo variant="auth" />
          <p className="mt-8 text-[13px] text-[var(--color-text-secondary)]">
            Workspace inicial
          </p>
          <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
                {organizationName} está pronta para operar.
              </h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                Complete o essencial para sair do cadastro vazio e chegar ao primeiro
                fluxo real: relacionamento, produto, estoque e venda.
              </p>
            </div>
            <Button asChild>
              <Link to="/app">Ir para a Central</Link>
            </Button>
          </div>

          <section className="mt-8 grid gap-3 md:grid-cols-2">
            {steps.map(([title, description], index) => (
              <article
                key={title}
                className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface-alt)] p-4"
              >
                <p className="text-xs font-medium text-[var(--color-primary)]">
                  0{index + 1}
                </p>
                <h2 className="mt-2 text-base font-semibold text-[var(--color-ink)]">
                  {title}
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                  {description}
                </p>
              </article>
            ))}
          </section>
        </div>
      </main>
    </div>
  )
}
