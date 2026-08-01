import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  calculateSubscriptionPricing,
  beginCheckout,
  createSubscriptionIntent,
  getSubscriptionPlans,
  type BillingCycle,
  type CalculatedPricing,
  type SubscriptionPlan,
} from './acquisition-api'

const onboardingStorageKey = 'rescript:acquisition:public-id'
const checkoutStorageKey = 'rescript:acquisition:checkout'

function currency(value: number, code = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: code }).format(value)
}

function key() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

export function SubscriptionIntentPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [intentIdempotencyKey] = useState(key)
  const [checkoutIdempotencyKey] = useState(key)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [pricing, setPricing] = useState<CalculatedPricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId) ?? null, [plans, selectedPlanId])

  useEffect(() => {
    getSubscriptionPlans()
      .then((items) => {
        setPlans(items)
        if (items[0]) setSelectedPlanId(items[0].id)
      })
      .catch(() => setError('Nao foi possivel carregar os planos agora.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedPlanId) return
    setPricing(null)
    calculateSubscriptionPricing({ data: { planId: selectedPlanId, billingCycle: cycle } })
      .then(setPricing)
      .catch(() => setError('Nao foi possivel calcular este plano.'))
  }, [selectedPlanId, cycle])

  async function continueToCheckout() {
    const onboardingPublicId = window.localStorage.getItem(onboardingStorageKey)
    if (!onboardingPublicId || !selectedPlan) {
      setError('Retome o onboarding para selecionar um plano.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const intent = await createSubscriptionIntent({ data: {
        onboardingPublicId, planId: selectedPlan.id, billingCycle: cycle, idempotencyKey: intentIdempotencyKey,
      } })
      const session = await beginCheckout({ data: {
        intentPublicId: intent.publicId, idempotencyKey: checkoutIdempotencyKey,
      } })
      window.sessionStorage.setItem(checkoutStorageKey, JSON.stringify({ intent, session, planName: selectedPlan.label || selectedPlan.name }))
      if (session.checkoutUrl) {
        window.location.assign(session.checkoutUrl)
        return
      }
      await navigate({ to: '/onboarding/pagamento' })
    } catch {
      setError('Nao foi possivel preparar o checkout. Revise o onboarding e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return <PublicShell>
    <header><p className="text-sm font-medium text-[var(--color-primary)]">Rescript</p><h1 className="mt-2 text-3xl font-semibold">Escolha o plano certo para sua operacao</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Valores, recursos e limites sao definidos pelo catalogo comercial.</p></header>
    <div className="mt-6 flex rounded-lg border border-[var(--color-border)] p-1 w-fit" aria-label="Ciclo de cobranca">
      {(['monthly', 'yearly'] as BillingCycle[]).map((value) => <button key={value} type="button" onClick={() => setCycle(value)} className={`rounded-md px-4 py-2 text-sm ${cycle === value ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)]'}`}>{value === 'monthly' ? 'Mensal' : 'Anual'}</button>)}
    </div>
    {error && <p role="alert" className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
    {loading ? <p className="mt-8 text-sm text-[var(--color-text-secondary)]">Carregando planos...</p> : <div className="mt-6 grid gap-4 md:grid-cols-2">{plans.map((plan) => {
      const price = plan.prices.find((item) => item.billingCycle === cycle)
      const selected = plan.id === selectedPlanId
      return <button type="button" key={plan.id} onClick={() => setSelectedPlanId(plan.id)} aria-pressed={selected} className={`rounded-xl border p-5 text-left transition ${selected ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'}`}>
        <p className="font-semibold">{plan.label || plan.name}</p><p className="mt-2 text-2xl font-semibold">{price ? currency(price.amount, price.currency) : 'Indisponivel'}</p><p className="text-xs text-[var(--color-text-secondary)]">por {cycle === 'monthly' ? 'mes' : 'ano'}</p>
        {plan.trialDays > 0 && <p className="mt-3 text-xs text-[var(--color-primary)]">Teste preparado: {plan.trialDays} dias</p>}
      </button>
    })}</div>}
    {selectedPlan && <section className="mt-6 rounded-xl border border-[var(--color-border)] p-5"><p className="text-sm text-[var(--color-text-secondary)]">Resumo</p><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{selectedPlan.label || selectedPlan.name}</p><p className="text-sm text-[var(--color-text-secondary)]">{pricing ? currency(pricing.total, pricing.currency) : 'Calculando...'}</p></div><button type="button" disabled={!pricing || submitting} onClick={continueToCheckout} className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Preparando...' : 'Continuar para pagamento'}</button></div></section>}
    <Link to="/onboarding/perfil" className="mt-5 inline-block text-sm text-[var(--color-primary)] underline">Voltar ao perfil</Link>
  </PublicShell>
}

export function BillingSessionPage() {
  const [session, setSession] = useState<{ planName: string; intent: { total: number; currency: string }; session: { status: string } } | null>(null)
  useEffect(() => { const raw = window.sessionStorage.getItem(checkoutStorageKey); if (raw) setSession(JSON.parse(raw)) }, [])
  return <PublicShell><h1 className="text-3xl font-semibold">Pagamento preparado</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Esta etapa registra apenas a intencao comercial. Nenhuma cobranca, assinatura ou acesso foi ativado.</p>{session ? <section className="mt-6 rounded-xl border border-[var(--color-border)] p-5"><p className="font-semibold">{session.planName}</p><p className="mt-1 text-lg">{currency(session.intent.total, session.intent.currency)}</p><p className="mt-3 text-sm text-[var(--color-text-secondary)]">Status do checkout: {session.session.status}</p></section> : <p className="mt-6 text-sm text-[var(--color-text-secondary)]">Nenhuma sessao de checkout foi preparada nesta navegacao.</p>}<Link to="/onboarding/plano" className="mt-5 inline-block text-sm text-[var(--color-primary)] underline">Voltar aos planos</Link></PublicShell>
}

function PublicShell({ children }: { children: ReactNode }) { return <main className="min-h-screen bg-[var(--color-background)] p-6 text-[var(--color-text-primary)]"><div className="mx-auto max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-sm sm:p-8">{children}</div></main> }
