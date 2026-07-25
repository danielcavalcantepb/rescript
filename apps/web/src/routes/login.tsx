import { useState, type FormEvent } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { sanitizeRedirectPath } from '@rescript/auth'
import { RescriptLogo } from '#/components/brand/RescriptLogo'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { fetchAuthSession } from '#/lib/auth/fetch-auth-session'
import { useSession } from '#/providers/app-session'
import { icons } from '#/platform/icons/catalog'
import { ButtonLoading } from '#/platform/loading'

type LoginSearch = {
  redirect?: string
}

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

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-7">
        <RescriptLogo variant="auth" />
        <h1 className="mt-7 text-xl font-medium tracking-tight text-[var(--color-ink)]">
          Entrar
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          Acesse sua conta Rescript.
        </p>

        <form className="mt-6 space-y-3.5" onSubmit={(e) => void onSubmit(e)} noValidate>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-[13px] font-medium text-[var(--color-ink)]"
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
            />
            {emailError ? (
              <p className="mt-1 text-xs text-[var(--color-danger)]">{emailError}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-[13px] font-medium text-[var(--color-ink)]"
            >
              Senha
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                disabled={submitting}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                aria-invalid={Boolean(passwordError)}
              />
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="size-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
            {passwordError ? (
              <p className="mt-1 text-xs text-[var(--color-danger)]">{passwordError}</p>
            ) : null}
          </div>

          {formError ? (
            <p className="rounded-[var(--radius-sm)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs text-[var(--color-danger)]">
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <ButtonLoading label="Entrando…" /> : 'Entrar'}
          </Button>

          <p className="text-center text-[11px] text-[var(--color-muted)]">
            Recuperação de senha — em breve
          </p>
        </form>
      </div>
    </div>
  )
}
