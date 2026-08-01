import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { RescriptLogo } from '#/components/brand/RescriptLogo'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { resumeAcquisition, saveBusinessIdentity, type BusinessIdentity } from './acquisition-api'

const storageKey = 'rescript:acquisition:public-id'
const key = () => crypto.randomUUID()
const digits = (value: string) => value.replace(/\D/g, '')
const phone = (value: string) => {
  const raw = digits(value).slice(0, 11)
  return raw.length <= 10
    ? raw.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_, ddd, a, b) => `(${ddd}${a ? `) ${a}` : ''}${b ? `-${b}` : ''}`)
    : raw.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}
const zipCode = (value: string) => {
  const raw = digits(value).slice(0, 8)
  return raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw
}
const document = (value: string, type: BusinessIdentity['personType']) => {
  const raw = digits(value).slice(0, type === 'individual' ? 11 : 14)
  if (type === 'individual') return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) => `${a}${b ? `.${b}` : ''}${c ? `.${c}` : ''}${d ? `-${d}` : ''}`)
  return raw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, a, b, c, d, e) => `${a}${b ? `.${b}` : ''}${c ? `.${c}` : ''}${d ? `/${d}` : ''}${e ? `-${e}` : ''}`)
}

const initialIdentity: BusinessIdentity = {
  personType: 'company', legalName: '', tradeName: '', taxId: '', stateRegistration: '',
  phone: '', email: '', zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', mainBranchName: '',
}

export function BusinessIdentityOnboardingPage() {
  const navigate = useNavigate()
  const [publicId, setPublicId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const id = localStorage.getItem(storageKey)
    if (!id) { setLoading(false); return }
    resumeAcquisition({ data: { publicId: id } })
      .then((result) => setPublicId(result.publicId))
      .catch(() => localStorage.removeItem(storageKey))
      .finally(() => setLoading(false))
  }, [])
  return <Shell>{loading ? <p>Retomando seu cadastro…</p> : publicId ? <IdentityForm publicId={publicId} onComplete={() => void navigate({ to: '/onboarding/plano' })} /> : <MissingSession />}</Shell>
}

function IdentityForm({ publicId, onComplete }: { publicId: string; onComplete: () => void }) {
  const [identity, setIdentity] = useState<BusinessIdentity>(initialIdentity)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const individual = identity.personType === 'individual'
  const set = <K extends keyof BusinessIdentity>(field: K, value: BusinessIdentity[K]) => setIdentity((current) => ({ ...current, [field]: value }))
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (identity.legalName.trim().length < 2) return setError(individual ? 'Informe o nome completo.' : 'Informe a razão social.')
    if (digits(identity.taxId).length !== (individual ? 11 : 14)) return setError(individual ? 'Informe um CPF válido.' : 'Informe um CNPJ válido.')
    if (digits(identity.phone).length < 10) return setError('Informe um telefone válido.')
    if (!/^\S+@\S+\.\S+$/.test(identity.email.trim())) return setError('Informe um e-mail válido.')
    if (digits(identity.zipCode).length !== 8 || !identity.street.trim() || !identity.number.trim() || !identity.neighborhood.trim() || !identity.city.trim() || identity.state.trim().length !== 2) return setError('Preencha o endereço completo, incluindo CEP e UF.')
    setBusy(true); setError(null)
    try {
      await saveBusinessIdentity({ data: { publicId, identity: { ...identity, taxId: digits(identity.taxId), phone: digits(identity.phone), zipCode: digits(identity.zipCode), email: identity.email.trim().toLowerCase(), state: identity.state.trim().toUpperCase() }, idempotencyKey: key() } })
      onComplete()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : ''
      setError(message.includes('invalid_transition') ? 'Conclua o perfil do negócio antes de continuar.' : 'Não foi possível salvar os dados. Revise os campos e tente novamente.')
    } finally { setBusy(false) }
  }
  return <form className="mt-7 space-y-4" onSubmit={(event) => void submit(event)}>
    <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Dados da empresa</h1>
    <p className="text-sm text-[var(--color-text-secondary)]">Informe a identidade que será usada para preparar o seu ambiente.</p>
    <div className="flex gap-2" role="group" aria-label="Tipo de cadastro">
      <Button type="button" variant={individual ? 'secondary' : 'primary'} onClick={() => set('personType', 'company')}>Pessoa jurídica</Button>
      <Button type="button" variant={individual ? 'primary' : 'secondary'} onClick={() => set('personType', 'individual')}>Pessoa física</Button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={individual ? 'Nome completo' : 'Razão social'}><Input value={identity.legalName} onChange={(event) => set('legalName', event.target.value)} /></Field>
      <Field label={individual ? 'Nome de exibição' : 'Nome fantasia'}><Input value={identity.tradeName ?? ''} onChange={(event) => set('tradeName', event.target.value)} /></Field>
      <Field label={individual ? 'CPF' : 'CNPJ'}><Input value={document(identity.taxId, identity.personType)} onChange={(event) => set('taxId', digits(event.target.value))} inputMode="numeric" /></Field>
      {!individual && <Field label="Inscrição estadual"><Input value={identity.stateRegistration ?? ''} onChange={(event) => set('stateRegistration', event.target.value)} /></Field>}
      <Field label="Telefone"><Input value={phone(identity.phone)} onChange={(event) => set('phone', digits(event.target.value))} inputMode="tel" /></Field>
      <Field label="E-mail comercial"><Input type="email" value={identity.email} onChange={(event) => set('email', event.target.value)} /></Field>
    </div>
    <fieldset className="space-y-4 border-t border-[var(--color-border-soft)] pt-4"><legend className="text-base font-semibold text-[var(--color-ink)]">Endereço principal</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="CEP"><Input value={zipCode(identity.zipCode)} onChange={(event) => set('zipCode', digits(event.target.value))} inputMode="numeric" /></Field>
        <Field label="UF"><Input value={identity.state} maxLength={2} onChange={(event) => set('state', event.target.value.toUpperCase())} /></Field>
        <Field label="Logradouro"><Input value={identity.street} onChange={(event) => set('street', event.target.value)} /></Field>
        <Field label="Número"><Input value={identity.number} onChange={(event) => set('number', event.target.value)} /></Field>
        <Field label="Bairro"><Input value={identity.neighborhood} onChange={(event) => set('neighborhood', event.target.value)} /></Field>
        <Field label="Cidade"><Input value={identity.city} onChange={(event) => set('city', event.target.value)} /></Field>
      </div>
      <Field label="Complemento"><Input value={identity.complement ?? ''} onChange={(event) => set('complement', event.target.value)} /></Field>
    </fieldset>
    <Field label="Nome da unidade principal"><Input value={identity.mainBranchName} onChange={(event) => set('mainBranchName', event.target.value)} placeholder={identity.tradeName || identity.legalName || 'Ex.: Loja Centro'} /></Field>
    {error && <p role="alert" className="rounded bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger)]">{error}</p>}
    <div className="flex items-center justify-between gap-3"><Link className="text-sm text-[var(--color-primary)] underline" to="/onboarding/perfil">Voltar ao perfil</Link><Button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Continuar'}</Button></div>
  </form>
}

function MissingSession() { return <div className="mt-7"><h1 className="text-2xl font-semibold text-[var(--color-ink)]">Retome seu cadastro</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Não encontramos uma sessão ativa neste navegador.</p><Link className="mt-5 inline-block text-sm text-[var(--color-primary)] underline" to="/onboarding">Começar cadastro</Link></div> }
function Shell({ children }: { children: React.ReactNode }) { return <main className="public-onboarding-light min-h-screen px-4 py-10 sm:py-16"><div className="mx-auto w-full max-w-xl rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-overlay)] sm:p-8"><RescriptLogo variant="auth" /><div className="mt-7 flex gap-2" aria-label="Progresso do cadastro"><span className="h-1 flex-1 rounded bg-[var(--color-primary)]" /><span className="h-1 flex-1 rounded bg-[var(--color-primary)]" /><span className="h-1 flex-1 rounded bg-[var(--color-primary)]" /></div>{children}</div></main> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-[var(--color-ink)]"><span className="mb-1 block">{label}</span>{children}</label> }
