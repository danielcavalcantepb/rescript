import { useState, type FormEvent } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { sanitizeRedirectPath } from '@rescript/auth'
import { InstitutionalPanel } from '#/components/auth/institutional-panel'
import { RescriptLogo } from '#/components/brand/RescriptLogo'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { fetchAuthSession } from '#/lib/auth/fetch-auth-session'
import { useSession } from '#/providers/app-session'
import { icons } from '#/platform/icons/catalog'
import { ButtonLoading } from '#/platform/loading'
import { cn } from '#/lib/utils'

type LoginSearch = {
  redirect?: string
}

type AuthMethod = 'password' | 'magic-link'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect:
      typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { user } = await fetchAuthSession()
    if (user) {
      throw redirect({
        href: sanitizeRedirectPath(search.redirect, '/'),
      })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { login } = useSession()
  const navigate = useNavigate()
  const { redirect: redirectTo } = Route.useSearch()
  const Eye = icons.eye
  const EyeOff = icons.eyeOff

  const [method, setMethod] = useState<AuthMethod>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberSession, setRememberSession] = useState(true)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return

    setEmailError(null)
    setPasswordError(null)
    setFormError(null)

    const trimmedEmail = email.trim()
    let valid = true

    if (!trimmedEmail) {
      setEmailError('Informe seu e-mail.')
      valid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Informe um e-mail válido.')
      valid = false
    }

    if (method === 'magic-link') {
      if (!valid) return
      setFormError('Magic Link — em breve.')
      return
    }

    if (!password) {
      setPasswordError('Informe sua senha.')
      valid = false
    }

    if (!valid) return

    setSubmitting(true)
    try {
      const result = await login(trimmedEmail, password)
      if (!result.ok) {
        setFormError(result.message)
        return
      }
      await navigate({ href: sanitizeRedirectPath(redirectTo, '/') })
    } finally {
      setSubmitting(false)
    }
  }

  const tabClass = (active: boolean) =>
    cn(
      'rounded-[var(--radius-sm)] px-3 py-2 text-[13px] font-medium transition-colors duration-[var(--motion-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]',
      active
        ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-ink)]',
    )

  return (
    <div className="auth-experience flex min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <section className="relative flex w-full flex-col justify-center px-6 py-12 sm:px-10 lg:w-[45%] lg:px-14 xl:px-20">
        {/* Ambient brand glow (mobile/tablet identity accent) */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,var(--auth-glow),transparent_70%)] lg:hidden"
          aria-hidden
        />

        <div className="auth-form-enter relative mx-auto w-full max-w-[380px]">
          <div className="inline-flex items-center rounded-[var(--radius-md)] bg-white px-3.5 py-2.5 shadow-[var(--shadow-sm)]">
            <RescriptLogo variant="auth" />
          </div>

          <h1 className="mt-10 text-[1.75rem] leading-[1.15] font-semibold tracking-tight text-[var(--color-ink)] text-balance">
            O centro operacional
            <br />
            <span className="text-[var(--color-text-secondary)]">
              da sua empresa.
            </span>
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text-secondary)] text-pretty">
            Quando a operação se espalha, a clareza se perde. O Rescript reúne o
            negócio em um só lugar — para organizar, controlar e crescer com
            confiança.
          </p>

          <div
            className="mt-9 grid grid-cols-2 gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
            role="tablist"
            aria-label="Método de autenticação"
          >
            <button
              type="button"
              role="tab"
              id="auth-tab-password"
              aria-selected={method === 'password'}
              aria-controls="auth-panel"
              className={tabClass(method === 'password')}
              onClick={() => {
                setMethod('password')
                setFormError(null)
                setPasswordError(null)
              }}
            >
              Login por senha
            </button>
            <button
              type="button"
              role="tab"
              id="auth-tab-magic"
              aria-selected={method === 'magic-link'}
              aria-controls="auth-panel"
              className={tabClass(method === 'magic-link')}
              onClick={() => {
                setMethod('magic-link')
                setFormError(null)
                setPasswordError(null)
              }}
            >
              Magic Link
            </button>
          </div>

          <form
            id="auth-panel"
            role="tabpanel"
            aria-labelledby={
              method === 'password' ? 'auth-tab-password' : 'auth-tab-magic'
            }
            className="mt-7 space-y-5"
            onSubmit={(e) => void onSubmit(e)}
            noValidate
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[13px] font-medium text-[var(--color-ink)]"
              >
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                disabled={submitting}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'email-error' : undefined}
                className="h-11 rounded-[var(--radius-md)] border-[var(--color-border)] bg-[var(--color-surface)] text-[14px] text-[var(--color-ink)] transition-colors focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
                placeholder="voce@empresa.com"
              />
              {emailError ? (
                <p
                  id="email-error"
                  className="mt-1.5 text-xs text-[var(--color-danger)]"
                  role="alert"
                >
                  {emailError}
                </p>
              ) : null}
            </div>

            {method === 'password' ? (
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-[13px] font-medium text-[var(--color-ink)]"
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    className="rounded text-[12px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
                    onClick={() =>
                      setFormError('Recuperação de senha — em breve.')
                    }
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    disabled={submitting}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-[var(--radius-md)] border-[var(--color-border)] bg-[var(--color-surface)] pr-11 text-[14px] text-[var(--color-ink)] transition-colors focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={
                      passwordError ? 'password-error' : undefined
                    }
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="size-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                {passwordError ? (
                  <p
                    id="password-error"
                    className="mt-1.5 text-xs text-[var(--color-danger)]"
                    role="alert"
                  >
                    {passwordError}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                Enviaremos um link seguro para o seu e-mail. A integração com o
                provedor será disponibilizada em breve — o login por senha
                permanece disponível.
              </p>
            )}

            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[var(--color-text-secondary)] select-none">
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                disabled={submitting}
                className="size-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] accent-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
              />
              Lembrar sessão
            </label>

            {formError ? (
              <p
                className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-bg)] px-3.5 py-2.5 text-xs text-[var(--color-danger)]"
                role="alert"
              >
                {formError}
              </p>
            ) : null}

            <Button
              type="submit"
              className="h-11 w-full text-[14px] shadow-[var(--shadow-sm)]"
              disabled={submitting}
            >
              {submitting ? (
                <ButtonLoading label="Entrando…" />
              ) : method === 'password' ? (
                'Entrar'
              ) : (
                'Enviar Magic Link'
              )}
            </Button>
          </form>

          <p className="mt-12 text-[11px] tracking-wide text-[var(--color-muted)]">
            © Rescript
          </p>
        </div>
      </section>

      <InstitutionalPanel className="lg:w-[55%]" />
    </div>
  )
}
