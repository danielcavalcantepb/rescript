import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { RescriptLogo } from '#/components/brand/RescriptLogo'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { authService } from '#/lib/auth/auth-service'
import {
  linkPendingAccount,
  resumeAcquisition,
  saveBusinessProfile,
  startAcquisition,
  type BusinessProfile,
} from './acquisition-api'

const STORAGE = 'rescript:acquisition:public-id'
const segments = [
  'Supermercado e mercearia',
  'Moda e vestuário',
  'Calçados',
  'Acessórios',
  'Cosméticos e perfumaria',
  'Farmácia',
  'Casa e decoração',
  'Eletrônicos',
  'Papelaria',
  'Materiais de construção',
  'Autopeças',
  'Pet shop',
  'Distribuidora',
  'Outros',
]
const revenues = [
  'Ainda não comecei a vender',
  'Até R$ 5 mil',
  'R$ 5 mil a R$ 15 mil',
  'R$ 15 mil a R$ 40 mil',
  'R$ 40 mil a R$ 70 mil',
  'R$ 70 mil a R$ 120 mil',
  'R$ 120 mil a R$ 300 mil',
  'Acima de R$ 300 mil',
  'Prefiro não informar',
]
const needs = [
  'PDV',
  'Estoque',
  'Vendas e pedidos',
  'Financeiro',
  'Contas a pagar e receber',
  'Compras',
  'Fornecedores',
  'Clientes',
  'Comissões',
  'Código de barras',
  'Etiquetas',
  'Fiscal',
  'NFC-e',
  'NF-e',
  'Relatórios',
  'Trocas e devoluções',
  'Outros',
]
const newKey = () => crypto.randomUUID()
const onboardingErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('invalid_email')) return 'Informe um e-mail válido.'
  if (message.includes('invalid_phone')) return 'Informe um WhatsApp brasileiro válido.'
  if (message.includes('rate_limited')) return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
  if (message.includes('account_mismatch')) return 'Esta conta não corresponde ao e-mail informado. Entre com a conta correta ou use outro e-mail.'
  if (message.includes('onboarding_not_found')) return 'Sua sessão de cadastro expirou. Recomece o cadastro para continuar.'
  return 'Não foi possível criar sua conta agora. Tente novamente.'
}
const phoneDigits = (value: string) => value.replace(/\D/g, '')
const formatPhone = (value: string) => {
  const d = phoneDigits(value).slice(0, 11)
  return d.length <= 10
    ? d.replace(
        /(\d{2})(\d{0,4})(\d{0,4})/,
        (_, a, b, c) => `(${a}${b ? `) ${b}` : ''}${c ? `-${c}` : ''}`,
      )
    : d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

export function AcquisitionOnboardingPage({
  forcedStep,
}: { forcedStep?: 'conta' | 'perfil' } = {}) {
  const navigate = useNavigate()
  const [step, setStep] = useState<'conta' | 'perfil'>(forcedStep ?? 'conta')
  const [publicId, setPublicId] = useState<string | null>(null)
  const [savedProfile, setSavedProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const id = localStorage.getItem(STORAGE)
    if (!id) {
      setLoading(false)
      return
    }
    resumeAcquisition({ data: { publicId: id } })
      .then((r) => {
        setPublicId(r.publicId)
        setSavedProfile(r.profile)
        if (r.step === 'perfil' || r.state.includes('business_profile')) setStep('perfil')
      })
      .catch(() => localStorage.removeItem(STORAGE))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    if (forcedStep) setStep(forcedStep)
  }, [forcedStep])
  if (loading)
    return (
      <Shell>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Retomando seu cadastro…
        </p>
      </Shell>
    )
  return (
    <Shell step={step}>
      {step === 'conta' ? (
        <AccountForm
          onComplete={(id) => {
            setPublicId(id)
            localStorage.setItem(STORAGE, id)
            setStep('perfil')
            void navigate({ to: '/onboarding/perfil' })
          }}
        />
      ) : (
        <BusinessForm publicId={publicId} initialProfile={savedProfile} onBack={() => setStep('conta')} onComplete={() => void navigate({ to: '/onboarding/empresa' })} />
      )}
    </Shell>
  )
}

function Shell({
  children,
  step = 'conta',
}: {
  children: React.ReactNode
  step?: string
}) {
  return (
    <div className="public-onboarding-light min-h-screen px-4 py-10 sm:py-16">
      <main className="mx-auto w-full max-w-xl rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-overlay)] sm:p-8">
        <RescriptLogo variant="auth" />
        <div className="mt-7 flex gap-2" aria-label="Progresso do cadastro">
          <span className="h-1 flex-1 rounded bg-[var(--color-primary)]" />
          <span
            className={`h-1 flex-1 rounded ${step === 'perfil' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-soft)]'}`}
          />
        </div>
        {children}
      </main>
    </div>
  )
}

function AccountForm({ onComplete }: { onComplete: (id: string) => void }) {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    emailConfirmation: '',
    password: '',
    passwordConfirmation: '',
    terms: false,
    privacy: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((p) => ({ ...p, [key]: value }))
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const email = form.email.trim().toLowerCase()
    if (form.fullName.trim().length < 2) return setError('Informe seu nome completo.')
    if (phoneDigits(form.phone).length < 10)
      return setError('Informe um WhatsApp brasileiro válido.')
    if (
      !/^\S+@\S+\.\S+$/.test(email) ||
      email !== form.emailConfirmation.trim().toLowerCase()
    )
      return setError('Confira o e-mail e a confirmação.')
    if (
      !/(?=.*[A-Za-z])(?=.*\d).{8,}/.test(form.password) ||
      form.password !== form.passwordConfirmation
    )
      return setError('A senha deve ter ao menos 8 caracteres, uma letra e um número.')
    if (!form.terms || !form.privacy)
      return setError('Aceite os Termos e a Política de Privacidade para continuar.')
    setBusy(true)
    setError(null)
    try {
      const utm = new URLSearchParams(location.search)
      const started = await startAcquisition({
        data: {
          email,
          fullName: form.fullName.trim(),
          phone: phoneDigits(form.phone),
          idempotencyKey: newKey(),
          utm: {
            source: utm.get('utm_source') ?? undefined,
            medium: utm.get('utm_medium') ?? undefined,
            campaign: utm.get('utm_campaign') ?? undefined,
            content: utm.get('utm_content') ?? undefined,
            term: utm.get('utm_term') ?? undefined,
            referrer: document.referrer || undefined,
          },
        },
      })
      const signed = await authService.signup(email, form.password, form.fullName.trim())
      if (!signed.ok) return setError(signed.message)
      await linkPendingAccount({
        data: {
          publicId: started.publicId,
          userId: signed.userId,
          userAgent: navigator.userAgent,
        },
      })
      onComplete(started.publicId)
    } catch (error) {
      setError(onboardingErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={(e) => void submit(e)} className="mt-7 space-y-4">
      <h1 className="text-2xl font-semibold text-[var(--color-ink)]">
        Crie sua conta no Rescript
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Esses serão os dados utilizados para acessar a plataforma.
      </p>
      <Field label="Nome completo">
        <Input
          value={form.fullName}
          onChange={(e) => set('fullName', e.target.value)}
          autoComplete="name"
        />
      </Field>
      <Field label="WhatsApp">
        <Input
          value={form.phone}
          onChange={(e) => set('phone', formatPhone(e.target.value))}
          inputMode="tel"
          autoComplete="tel"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-mail">
          <Input
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            type="email"
            autoComplete="email"
          />
        </Field>
        <Field label="Confirmar e-mail">
          <Input
            value={form.emailConfirmation}
            onChange={(e) => set('emailConfirmation', e.target.value)}
            type="email"
          />
        </Field>
        <Field label="Senha">
          <Input
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            type="password"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirmar senha">
          <Input
            value={form.passwordConfirmation}
            onChange={(e) => set('passwordConfirmation', e.target.value)}
            type="password"
            autoComplete="new-password"
          />
        </Field>
      </div>
      <Consent checked={form.terms} onChange={(v) => set('terms', v)}>
        <Link className="underline" to="/terms">
          Termos de Uso
        </Link>
      </Consent>
      <Consent checked={form.privacy} onChange={(v) => set('privacy', v)}>
        <Link className="underline" to="/privacy">
          Política de Privacidade
        </Link>
      </Consent>
      {error && (
        <p
          role="alert"
          className="rounded bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger)]"
        >
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <Link className="text-sm text-[var(--color-primary)] hover:underline" to="/login">
          Já tenho conta
        </Link>
        <Button type="submit" disabled={busy}>
          {busy ? 'Criando…' : 'Continuar'}
        </Button>
      </div>
    </form>
  )
}

function BusinessForm({
  publicId,
  initialProfile,
  onBack,
  onComplete,
}: {
  publicId: string | null
  initialProfile: BusinessProfile | null
  onBack: () => void
  onComplete: () => void
}) {
  const [profile, setProfile] = useState<BusinessProfile>(initialProfile ?? {
    segment: '',
    revenueRange: 'Prefiro não informar',
    currentSystemStatus: 'Não utiliza',
    needs: [],
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const toggle = (name: string) =>
    setProfile((p) => ({
      ...p,
      needs: p.needs.includes(name)
        ? p.needs.filter((x) => x !== name)
        : [...p.needs, name],
    }))
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!publicId)
      return setError(
        'Não foi possível retomar o cadastro. Volte e crie sua conta novamente.',
      )
    if (!profile.segment) return setError('Selecione o segmento.')
    if (profile.segment === 'Outros' && !profile.segmentOther?.trim())
      return setError('Descreva o segmento.')
    if (profile.needs.includes('Outros') && !profile.needsOther?.trim())
      return setError('Descreva a necessidade.')
    setBusy(true)
    setError(null)
    try {
      await saveBusinessProfile({ data: { publicId, profile, idempotencyKey: newKey() } })
      onComplete()
    } catch {
      setError('Não foi possível salvar seu perfil agora. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="mt-7 space-y-4" onSubmit={(e) => void submit(e)}>
      <h1 className="text-2xl font-semibold text-[var(--color-ink)]">
        Conte-nos sobre o seu negócio
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Essas informações nos ajudam a preparar uma experiência mais adequada à sua
        operação.
      </p>
      <Field label="Segmento">
        <select
          className="h-10 w-full rounded border border-[var(--color-border-soft)] bg-[var(--color-surface-alt)] px-3"
          value={profile.segment}
          onChange={(e) => setProfile({ ...profile, segment: e.target.value })}
        >
          <option value="">Selecione</option>
          {segments.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      {profile.segment === 'Outros' && (
        <Field label="Qual segmento?">
          <Input
            value={profile.segmentOther ?? ''}
            onChange={(e) => setProfile({ ...profile, segmentOther: e.target.value })}
          />
        </Field>
      )}
      <Field label="Faturamento aproximado">
        <select
          className="h-10 w-full rounded border border-[var(--color-border-soft)] bg-[var(--color-surface-alt)] px-3"
          value={profile.revenueRange}
          onChange={(e) => setProfile({ ...profile, revenueRange: e.target.value })}
        >
          {revenues.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field label="Sistema atual">
        <select
          className="h-10 w-full rounded border border-[var(--color-border-soft)] bg-[var(--color-surface-alt)] px-3"
          value={profile.currentSystemStatus}
          onChange={(e) =>
            setProfile({ ...profile, currentSystemStatus: e.target.value })
          }
        >
          <option>Não utiliza</option>
          <option>Utiliza atualmente</option>
          <option>Já utilizou</option>
        </select>
      </Field>
      {profile.currentSystemStatus !== 'Não utiliza' && (
        <>
          <Field label="Nome do sistema">
            <Input
              value={profile.currentSystemName ?? ''}
              onChange={(e) =>
                setProfile({ ...profile, currentSystemName: e.target.value })
              }
            />
          </Field>
          <Consent
            checked={Boolean(profile.migrationInterest)}
            onChange={(v) => setProfile({ ...profile, migrationInterest: v })}
          >
            Tenho interesse em migrar dados
          </Consent>
        </>
      )}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-[var(--color-ink)]">
          O que você precisa?
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {needs.map((n) => (
            <Consent
              key={n}
              checked={profile.needs.includes(n)}
              onChange={() => toggle(n)}
            >
              {n}
            </Consent>
          ))}
        </div>
      </fieldset>
      {profile.needs.includes('Outros') && (
        <Field label="Qual necessidade?">
          <Input
            value={profile.needsOther ?? ''}
            onChange={(e) => setProfile({ ...profile, needsOther: e.target.value })}
          />
        </Field>
      )}
      {error && (
        <p
          role="alert"
          className="rounded bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger)]"
        >
          {error}
        </p>
      )}
      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          Voltar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Salvando…' : 'Continuar'}
        </Button>
      </div>
    </form>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-[var(--color-ink)]">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  )
}
function Consent({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {children}
    </label>
  )
}
