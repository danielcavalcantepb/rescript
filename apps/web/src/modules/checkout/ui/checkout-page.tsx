import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { Select } from '#/components/ui/select'
import {
  normalizeBillingCycle,
  normalizePlan,
  type BillingCycle,
  type PlanCode,
  type ProvisioningResult,
} from '#/modules/checkout'
import {
  completeCheckoutSession,
  createCheckoutSession,
  startCheckoutSession,
} from './checkout-api'

type CheckoutPageProps = {
  initialPlan?: string
  initialCycle?: string
}

const planLabels: Record<PlanCode, string> = {
  rescript: 'Rescript',
}

const planDescriptions: Record<PlanCode, string> = {
  rescript: 'Vendas, estoque, financeiro e indicadores em uma única plataforma.',
}

export function CheckoutPage({
  initialPlan = 'rescript',
  initialCycle = 'monthly',
}: CheckoutPageProps) {
  const [step, setStep] = useState(0)
  const [plan, setPlan] = useState<PlanCode>(normalizePlan(initialPlan))
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    normalizeBillingCycle(initialCycle),
  )
  const [organizationName, setOrganizationName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ProvisioningResult | null>(null)

  const summary = useMemo(
    () => [
      ['Plano', `${planLabels[plan]} · ${billingCycle === 'yearly' ? 'anual' : 'mensal'}`],
      ['Empresa', organizationName || 'Não informado'],
      ['Responsável', ownerName || 'Não informado'],
      ['E-mail', ownerEmail || 'Não informado'],
    ],
    [billingCycle, organizationName, ownerEmail, ownerName, plan],
  )

  async function finalize() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createCheckoutSession({
        data: {
          selectedPlan: plan,
          billingCycle,
          country: 'BR',
          language: 'pt-BR',
          currency: 'BRL',
        },
      })
      if (!created.ok) throw new Error(created.error.message)

      const details = {
        publicToken: created.data.publicToken,
        selectedPlan: plan,
        billingCycle,
        organizationName,
        ownerName,
        ownerEmail,
        phone,
        country: 'BR',
        language: 'pt-BR',
        currency: 'BRL',
        ownerPassword,
        termsAccepted,
      } as const

      const started = await startCheckoutSession({ data: details })
      if (!started.ok) throw new Error(started.error.message)

      const completed = await completeCheckoutSession({
        data: { ...details, idempotencyKey: crypto.randomUUID() },
      })
      if (!completed.ok) throw new Error(completed.error.message)
      setResult(completed.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <CheckoutShell>
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-emerald-300/20 bg-white/[0.06] p-8 text-center shadow-[0_40px_120px_rgb(0_0_0/0.35)]">
          <p className="text-sm font-semibold text-emerald-200">Conta criada</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
            Sua operação Rescript está pronta.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/64">
            Criamos a empresa, o proprietário, a assinatura inicial e o workspace
            de onboarding. Entre com o e-mail e a senha definidos no checkout.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/login" search={{ redirect: '/onboarding' }}>
                Entrar agora
              </Link>
            </Button>
            <a
              href="/"
              className="rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-white/72 transition hover:bg-white/[0.08]"
            >
              Voltar ao site
            </a>
          </div>
        </div>
      </CheckoutShell>
    )
  }

  return (
    <CheckoutShell>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-[#07100d]/82 p-6 shadow-[0_30px_100px_rgb(0_0_0/0.34)]">
          <p className="text-sm font-semibold text-emerald-200">Checkout Rescript</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
            Comece pelo plano. Termine com a empresa pronta para operar.
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/60">
            Sem cobrança nesta etapa. O fluxo cria a base SaaS: organização,
            owner, assinatura inicial e onboarding.
          </p>
          <div className="mt-8 space-y-3">
            {['Plano', 'Empresa', 'Responsável', 'Resumo'].map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  step === index
                    ? 'border-emerald-300/35 bg-emerald-300/12 text-white'
                    : 'border-white/10 bg-white/[0.035] text-white/58 hover:text-white'
                }`}
              >
                <span>{label}</span>
                <span className="text-xs">0{index + 1}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_100px_rgb(0_0_0/0.28)]">
          {error ? (
            <p className="mb-4 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          {step === 0 ? (
            <div>
              <StepTitle
                title="Escolha o plano"
                description="Planos são dados versionados. A cobrança real entra em sprint futura."
              />
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {(Object.keys(planLabels) as PlanCode[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setPlan(code)}
                    className={`rounded-[1.5rem] border p-5 text-left transition ${
                      plan === code
                        ? 'border-emerald-300/50 bg-emerald-300/12'
                        : 'border-white/10 bg-[#050b08] hover:bg-white/[0.07]'
                    }`}
                  >
                    <h2 className="text-xl font-semibold text-white">{planLabels[code]}</h2>
                    <p className="mt-3 min-h-16 text-sm leading-6 text-white/58">
                      {planDescriptions[code]}
                    </p>
                  </button>
                ))}
              </div>
              <FormField label="Ciclo" className="mt-5">
                <Select
                  value={billingCycle}
                  onChange={(event) =>
                    setBillingCycle(normalizeBillingCycle(event.target.value))
                  }
                  className="h-11 border-white/10 bg-[#050b08] text-white"
                >
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </Select>
              </FormField>
              <StepActions onNext={() => setStep(1)} />
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <StepTitle
                title="Dados da empresa"
                description="Este nome será usado para criar a organização e o workspace inicial."
              />
              <div className="mt-6 grid gap-4">
                <DarkField label="Nome da empresa">
                  <Input
                    value={organizationName}
                    onChange={(event) => setOrganizationName(event.target.value)}
                    placeholder="Ex.: Loja Ana Clara"
                  />
                </DarkField>
                <DarkField label="Telefone">
                  <Input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+55 11 99999-9999"
                  />
                </DarkField>
              </div>
              <StepActions onBack={() => setStep(0)} onNext={() => setStep(2)} />
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <StepTitle
                title="Proprietário"
                description="O responsável entra como owner com permissões máximas."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <DarkField label="Nome completo">
                  <Input
                    value={ownerName}
                    onChange={(event) => setOwnerName(event.target.value)}
                    placeholder="Ana Clara"
                  />
                </DarkField>
                <DarkField label="E-mail">
                  <Input
                    type="email"
                    value={ownerEmail}
                    onChange={(event) => setOwnerEmail(event.target.value)}
                    placeholder="ana@empresa.com"
                  />
                </DarkField>
                <DarkField label="Senha" className="md:col-span-2">
                  <Input
                    type="password"
                    value={ownerPassword}
                    onChange={(event) => setOwnerPassword(event.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                </DarkField>
              </div>
              <label className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-[#050b08] p-4 text-sm leading-6 text-white/62">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  className="mt-1 size-4 accent-emerald-300"
                />
                <span>
                  Aceito os <a href="/terms" className="text-emerald-200 hover:underline">termos</a> e a{' '}
                  <a href="/privacy" className="text-emerald-200 hover:underline">política de privacidade</a>.
                </span>
              </label>
              <StepActions onBack={() => setStep(1)} onNext={() => setStep(3)} />
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <StepTitle
                title="Resumo"
                description="Confira os dados antes de provisionar a empresa."
              />
              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10">
                {summary.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[8rem_1fr] border-b border-white/10 bg-[#050b08] px-4 py-3 last:border-b-0"
                  >
                    <span className="text-sm text-white/42">{label}</span>
                    <span className="text-sm font-medium text-white">{value}</span>
                  </div>
                ))}
              </div>
              <StepActions
                onBack={() => setStep(2)}
                finish
                submitting={submitting}
                onNext={() => void finalize()}
              />
            </div>
          ) : null}
        </section>
      </div>
    </CheckoutShell>
  )
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#030806] px-4 py-8 text-white">
      <header className="mx-auto mb-8 flex max-w-6xl items-center justify-between rounded-[1.45rem] border border-white/10 bg-[#07100d]/82 px-5 py-4 backdrop-blur-2xl">
        <Link to="/" className="flex items-center gap-3">
          <img src="/brand/mark.png" alt="" className="size-8 rounded-xl" />
          <span className="text-sm font-semibold tracking-[0.18em] uppercase">Rescript</span>
        </Link>
        <Link
          to="/pricing"
          className="rounded-full border border-white/12 px-4 py-2 text-sm text-white/72 transition hover:bg-white/[0.08]"
        >
          Planos
        </Link>
      </header>
      {children}
    </div>
  )
}

function StepTitle({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/58">{description}</p>
    </div>
  )
}

function StepActions({
  onBack,
  onNext,
  finish,
  submitting,
}: {
  onBack?: () => void
  onNext: () => void
  finish?: boolean
  submitting?: boolean
}) {
  return (
    <div className="mt-8 flex justify-end gap-3">
      {onBack ? (
        <Button type="button" variant="secondary" onClick={onBack}>
          Voltar
        </Button>
      ) : null}
      <Button type="button" onClick={onNext} disabled={submitting}>
        {submitting ? 'Provisionando…' : finish ? 'Finalizar e criar conta' : 'Continuar'}
      </Button>
    </div>
  )
}

function DarkField({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <FormField label={label} className={className}>
      <div className="[&_input]:h-11 [&_input]:border-white/10 [&_input]:bg-[#050b08] [&_input]:text-white [&_input]:placeholder:text-white/32">
        {children}
      </div>
    </FormField>
  )
}
