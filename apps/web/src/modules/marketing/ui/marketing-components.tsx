import { useState, type ReactNode } from 'react'
import {
  faqs,
  features,
  marketingNav,
  marketingSite,
  modules,
  outcomes,
  pains,
  plans,
  productFlows,
  relationshipCards,
  scaleCards,
} from '../content'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030504]'
const primaryCta =
  'inline-flex items-center justify-center rounded-2xl bg-[#5FE09A] px-5 py-3 text-sm font-semibold text-[#03110c] shadow-[0_18px_54px_rgb(95_224_154/0.16)] transition hover:-translate-y-0.5 hover:bg-[#7AF0AF]'
const secondaryCta =
  'inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.045] px-5 py-3 text-sm font-semibold text-white/86 transition hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.08]'

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#030504] text-white selection:bg-emerald-300/25 [background-image:radial-gradient(circle_at_50%_0%,rgb(95_224_154/0.08),transparent_28rem),linear-gradient(90deg,rgb(255_255_255/0.025)_1px,transparent_1px),linear-gradient(rgb(255_255_255/0.025)_1px,transparent_1px)] [background-size:auto,72px_72px,72px_72px]">
      <MarketingNavbar />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}

export function MarketingNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-5 z-50 px-4">
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between rounded-[1.25rem] border border-white/10 bg-[#070908]/84 px-4 shadow-[0_20px_70px_rgb(0_0_0/0.36)] backdrop-blur-2xl sm:px-5"
        aria-label="Navegação principal"
      >
        <a href="/" className={`flex items-center gap-3 rounded-xl ${focusRing}`} aria-label="Rescript">
          <img src="/brand/mark.png" width="28" height="28" alt="" className="size-7 rounded-lg" />
          <span className="text-xs font-semibold tracking-[0.22em] text-white uppercase">Rescript</span>
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {marketingNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`rounded-lg text-sm text-white/58 transition hover:text-white ${focusRing}`}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="/login"
            className={`rounded-xl border border-white/10 px-4 py-2 text-sm text-white/72 transition hover:bg-white/[0.06] hover:text-white ${focusRing}`}
          >
            Entrar
          </a>
          <a href="/contact" className={`${primaryCta} ${focusRing}`}>
            Solicitar demonstração
          </a>
        </div>

        <button
          type="button"
          className={`inline-flex size-10 items-center justify-center rounded-xl border border-white/12 text-white lg:hidden ${focusRing}`}
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden>{open ? '×' : '☰'}</span>
        </button>
      </nav>

      {open ? (
        <div className="mx-auto mt-2 max-w-5xl rounded-[1.25rem] border border-white/10 bg-[#070908]/96 p-3 shadow-[0_20px_70px_rgb(0_0_0/0.36)] backdrop-blur-2xl lg:hidden">
          <div className="flex flex-col gap-1">
            {marketingNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-3 text-sm text-white/72 hover:bg-white/[0.08] hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <a href="/login" className="rounded-xl px-3 py-3 text-sm text-white/72 hover:bg-white/[0.08] hover:text-white">
              Entrar
            </a>
            <a href="/contact" className="mt-2 rounded-xl bg-[#5FE09A] px-4 py-3 text-center text-sm font-semibold text-[#03110c]">
              Solicitar demonstração
            </a>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-36">
      <RescriptStage />
      <div className="relative mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#060807] shadow-[0_46px_160px_rgb(0_0_0/0.52)]">
          <HeroTexture />
          <div className="relative px-5 pt-20 text-center sm:px-8 lg:px-12 lg:pt-28">
            <div className="mx-auto max-w-5xl">
              <BrandBars className="mx-auto mb-8 w-14" />
              <p className="mx-auto mb-5 max-w-max rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-medium tracking-[0.08em] text-white/64 uppercase">
                Gestão comercial, estoque e indicadores
              </p>
              <h1 className="mx-auto max-w-5xl text-5xl leading-[0.91] font-medium tracking-[-0.075em] text-balance text-white sm:text-7xl lg:text-[7.8rem]">
                Tenha os números da sua empresa nas mãos.
                <span className="block text-white/74">Venda, controle e cresça.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-white/60 sm:text-xl">
                Centralize vendas, estoque, compras e financeiro em um sistema visual que mostra
                o que realmente acontece no seu negócio.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <a href="/contact" className={`${primaryCta} ${focusRing}`}>
                  Solicitar demonstração
                </a>
                <a href="#plataforma" className={`${secondaryCta} ${focusRing}`}>
                  Conhecer a plataforma
                </a>
              </div>
            </div>

            <div className="relative mx-auto mt-16 max-w-5xl pb-8">
              <BrandStatementPanel />
            </div>
          </div>

          <div className="relative border-t border-white/10 bg-black/22 px-5 py-6 sm:px-8 lg:px-12">
            <div className="mx-auto grid max-w-5xl gap-px overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10 md:grid-cols-3">
              {outcomes.map((outcome) => (
                <div key={outcome.metric} className="bg-[#080b09] p-5">
                  <p className="text-2xl font-medium tracking-[-0.05em] text-white">{outcome.metric}</p>
                  <p className="mt-2 text-sm leading-6 text-white/48">{outcome.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function RescriptStage() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#030504]" />
      <div className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_50%_14%,rgb(255_255_255/0.06),transparent_30%),radial-gradient(circle_at_50%_18%,rgb(95_224_154/0.10),transparent_34%)]" />
      <div className="absolute left-1/2 top-24 h-[38rem] w-[72rem] -translate-x-1/2 rounded-[4rem] border border-white/[0.035]" />
      <div className="absolute left-1/2 top-36 h-[30rem] w-[58rem] -translate-x-1/2 rounded-[3rem] border border-white/[0.035]" />
      <div className="absolute inset-x-0 top-[34rem] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}

function HeroTexture() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(255_255_255/0.045),transparent_34%,rgb(0_0_0/0.38))]" />
      <div className="absolute left-1/2 top-0 h-[34rem] w-[60rem] -translate-x-1/2 bg-[radial-gradient(circle_at_50%_0%,rgb(95_224_154/0.12),transparent_60%)]" />
      <div className="absolute -left-32 top-0 h-[42rem] w-[52rem] -rotate-12 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.04)_0px,rgb(255_255_255/0.04)_1px,transparent_1px,transparent_96px)] opacity-50" />
      <div className="absolute right-10 top-24 hidden w-44 space-y-3 opacity-18 lg:block">
        {Array.from({ length: 7 }).map((_, index) => (
          <span key={index} className="block h-px bg-gradient-to-r from-transparent via-white to-transparent" />
        ))}
      </div>
    </div>
  )
}

function BrandBars({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      <span className="block h-px rounded-full bg-gradient-to-r from-[#1A2820] via-[#2A7A56] to-[#5FE09A]" />
      <span className="block h-px rounded-full bg-gradient-to-r from-[#1A2820] via-[#2A7A56] to-[#5FE09A]" />
      <span className="block h-px rounded-full bg-gradient-to-r from-[#1A2820] via-[#2A7A56] to-[#5FE09A]" />
    </div>
  )
}

function BrandStatementPanel() {
  const lines = [
    ['Relacionar', 'entender quem compra e o que precisa acontecer agora'],
    ['Vender', 'preservar preço, promessa, margem e recorrência'],
    ['Operar', 'conectar estoque, entrega, caixa e decisão'],
  ] as const

  return (
    <div
      id="plataforma"
      className="relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#070908] p-6 text-left shadow-[0_42px_150px_rgb(0_0_0/0.46)] sm:p-8"
      aria-label="Síntese visual da proposta da Rescript"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(255_255_255/0.032)_1px,transparent_1px)] bg-[size:112px_112px] opacity-45" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/26 to-transparent" aria-hidden />
      <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <BrandBars className="mb-10 w-20" />
          <p className="text-xs font-medium tracking-[0.16em] text-white/36 uppercase">Rescript</p>
          <h2 className="mt-5 text-4xl leading-[0.94] font-medium tracking-[-0.06em] text-balance text-white sm:text-5xl">
            Relação, venda e lucro em uma linha só.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/54">
            A landing deixa de mostrar uma tela simulada e passa a comunicar a promessa:
            uma empresa inteira funcionando com clareza, ritmo e controle.
          </p>
        </div>

        <div className="space-y-3">
          {lines.map(([title, text], index) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-start gap-4">
                <span className="mt-2 h-px w-10 shrink-0 bg-emerald-200/70" />
                <div>
                  <p className="text-xs text-white/34">0{index + 1}</p>
                  <h3 className="mt-3 text-2xl font-medium tracking-[-0.045em] text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">{text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RelationshipSection() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-200">Quem somos</p>
          <h2 className="mt-4 text-5xl leading-[0.95] font-medium tracking-[-0.065em] text-balance text-white sm:text-6xl">
            Não é sobre preencher telas.
          </h2>
        </div>
        <div>
          <p className="text-xl leading-9 text-white/62">
            É sobre manter a empresa legível enquanto ela vende, entrega, compra,
            recebe, paga e decide. A Rescript organiza a operação para o dono enxergar
            relação, margem e próximo passo sem abrir cinco sistemas.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {relationshipCards.map((card) => (
              <article key={card.title} className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-5">
                <h3 className="text-base font-semibold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/50">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function ScaleSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#070908]">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
          <div className="border-b border-white/10 p-7 sm:p-9 lg:border-r lg:border-b-0">
            <p className="text-sm font-semibold text-emerald-200">Como pensamos</p>
            <h2 className="mt-4 text-4xl leading-[0.98] font-medium tracking-[-0.055em] text-balance sm:text-5xl">
              Crescer sem perder a leitura do negócio.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/56">
              A marca não precisa gritar. O produto precisa mostrar o que importa:
              cliente, venda, lucro e risco operacional.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a href="/pricing" className={`${primaryCta} ${focusRing}`}>
                Começar Agora
              </a>
              <a href="/pricing" className={`${secondaryCta} ${focusRing}`}>
                Conhecer planos
              </a>
            </div>
          </div>
          <div className="grid gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-1">
            {scaleCards.map((card) => (
              <article key={card.title} className="bg-[#090c0a] p-7">
                <p className="text-xs font-medium text-white/38">{card.detail}</p>
                <h3 className="mt-4 text-2xl font-medium tracking-[-0.04em]">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/54">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function ProblemSection() {
  return (
    <MarketingSection
      eyebrow="O que fica para trás"
      title="O problema não é falta de sistema. É falta de verdade compartilhada."
      description="Quando cada área trabalha de um jeito, o cliente sente atraso, o caixa sente ruído e o dono sente incerteza."
    >
      <div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
        {pains.slice(0, 6).map((pain) => (
          <MarketingCard key={pain.title} title={pain.title} text={pain.text} />
        ))}
      </div>
    </MarketingSection>
  )
}

export function TransformationSection() {
  return (
    <MarketingSection
      eyebrow="Como funciona"
      title="Uma operação. Uma sequência. Uma consequência."
      description="A Rescript conecta as etapas sem transformar cada módulo em uma ilha."
    >
      <div className="space-y-4">
        {productFlows.map((flow) => (
          <div key={flow.join('-')} className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
            <div className="flex flex-wrap items-center gap-2">
              {flow.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/78">
                    {step}
                  </span>
                  {index < flow.length - 1 ? (
                    <span className="text-white/28" aria-hidden>
                      →
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </MarketingSection>
  )
}

export function EcosystemSection() {
  const pillars = [
    ['Relacionar', 'Clientes deixam de existir espalhados em conversas, planilhas e memórias.'],
    ['Vender', 'Pedido, preço, item, promessa e margem ficam no mesmo contexto.'],
    ['Operar', 'Estoque, separação, embalagem e entrega aparecem como fluxo interno.'],
    ['Decidir', 'Métricas explicam origem, impacto e próxima ação.'],
  ] as const

  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-emerald-200">Produto</p>
          <h2 className="mt-4 text-5xl leading-[0.95] font-medium tracking-[-0.065em] text-balance sm:text-6xl">
            Uma verdade percorre a empresa.
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/58">
            Poucas camadas. Relações claras. O sistema como instrumento interno de controle operacional.
          </p>
        </div>
        <div className="relative mt-14 overflow-hidden rounded-[2rem] border border-white/10 bg-[#070908] p-5 sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(255_255_255/0.03)_1px,transparent_1px)] bg-[size:92px_92px]" aria-hidden />
          <div className="relative grid gap-px overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10 md:grid-cols-4">
            {pillars.map(([title, text], index) => (
              <article key={title} className="bg-[#090c0a] p-6">
                <span className="text-xs text-white/34">0{index + 1}</span>
                <h3 className="mt-8 text-2xl font-medium tracking-[-0.04em]">{title}</h3>
                <p className="mt-4 text-sm leading-6 text-white/52">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function ModulesSection() {
  return (
    <MarketingSection
      eyebrow="Camadas"
      title="Grandes pilares. Sem catálogo de funcionalidades."
      description="A Rescript não vende módulos isolados; ela organiza responsabilidades que precisam conversar."
    >
      <ModuleGrid />
    </MarketingSection>
  )
}

export function ModuleGrid() {
  return (
    <div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((module) => (
        <a
          key={module.slug}
          href={`/modules#${module.slug}`}
          className={`group bg-[#090c0a] p-6 transition hover:bg-white/[0.055] ${focusRing}`}
        >
          <p className="text-xs font-medium tracking-[0.08em] text-emerald-200 uppercase">{module.name}</p>
          <h3 className="mt-8 text-2xl font-medium tracking-[-0.045em] text-white">{module.benefit}</h3>
          <p className="mt-4 text-sm leading-6 text-white/52">{module.description}</p>
        </a>
      ))}
    </div>
  )
}

export function FeaturesSection() {
  return (
    <MarketingSection
      eyebrow="Diferenciais"
      title="Menos software. Mais leitura operacional."
      description="O valor não está em ter muitas telas, mas em reduzir esforço para saber o que fazer."
    >
      <div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <MarketingCard key={feature.title} title={feature.title} text={feature.text} />
        ))}
      </div>
    </MarketingSection>
  )
}

export function HowItWorksSection() {
  const steps = ['Conheça os planos', 'Comece agora', 'Crie sua empresa', 'Opere com contexto'] as const

  return (
    <MarketingSection
      eyebrow="Começo"
      title="Da escolha do plano ao primeiro dia de controle."
      description="O caminho público leva o usuário a entender planos e iniciar a criação da empresa, sem desviar para um fluxo comercial paralelo."
    >
      <ol className="grid gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 md:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step} className="bg-[#090c0a] p-6">
            <span className="text-xs text-white/34">0{index + 1}</span>
            <h3 className="mt-10 text-2xl font-medium tracking-[-0.045em]">{step}</h3>
            <p className="mt-3 text-sm leading-6 text-white/50">
              Um avanço claro, sem prometer cobrança real ou integrações fora da sprint.
            </p>
          </li>
        ))}
      </ol>
    </MarketingSection>
  )
}

export function BenefitsSection() {
  return (
    <MarketingSection
      eyebrow="Por que confiar"
      title="Controle interno que aparece antes do problema."
      description="A linguagem pública passa a mostrar princípios de operação, sem depender de telas simuladas."
    >
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-[#070908] p-7">
          <BrandBars className="mb-10 w-20" />
          <h3 className="text-4xl leading-[0.96] font-medium tracking-[-0.055em] text-balance">
            O produto não precisa aparecer inteiro para a promessa ficar clara.
          </h3>
          <p className="mt-5 text-sm leading-7 text-white/52">
            A página comunica o que a Rescript organiza: relacionamento, venda,
            operação, financeiro, lucro e decisão.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            'Cliente final com histórico visível antes da próxima ação.',
            'Venda conectada à margem e ao estoque antes da promessa ser feita.',
            'Entrega e financeiro como consequência do mesmo fluxo operacional.',
            'Métricas com origem, não números soltos para interpretar depois.',
            'Governança, permissões e auditoria sem transformar a rotina em burocracia.',
          ].map((benefit) => (
            <div key={benefit} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm leading-6 text-white/66">{benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </MarketingSection>
  )
}

export function PricingSection() {
  return (
    <MarketingSection
      eyebrow="Planos"
      title="Escolha o tamanho do primeiro passo."
      description="Os planos conduzem para o checkout de criação da empresa. Billing e gateway permanecem fora desta etapa."
    >
      <div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 lg:grid-cols-4">
        {plans.map((plan) => (
          <article key={plan.name} className="bg-[#090c0a] p-6">
            <h3 className="text-2xl font-medium tracking-[-0.045em]">{plan.name}</h3>
            <p className="mt-4 min-h-20 text-sm leading-6 text-white/52">{plan.audience}</p>
            <ul className="mt-6 space-y-3 text-sm text-white/62">
              {plan.highlights.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-px w-4 shrink-0 bg-emerald-200/70" />
                  {item}
                </li>
              ))}
            </ul>
            <a href={`/checkout?plan=${plan.code}&cycle=monthly`} className={`mt-7 w-full ${primaryCta} ${focusRing}`}>
              Começar com {plan.name}
            </a>
          </article>
        ))}
      </div>
    </MarketingSection>
  )
}

export function TestimonialsSection() {
  return (
    <MarketingSection
      eyebrow="Clientes"
      title="Histórias reais entram com evidência."
      description="A landing não inventa logos, depoimentos ou números. A confiança vem do produto, da clareza e de dados reais quando existirem."
    >
      <div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 md:grid-cols-3">
        {['Relação com cliente', 'Operação controlada', 'Lucro visível'].map((title) => (
          <div key={title} className="bg-[#090c0a] p-6">
            <p className="text-lg font-medium text-white/86">{title}</p>
            <div className="mt-8 h-2 w-2/3 rounded-full bg-white/10" />
            <div className="mt-2 h-2 w-1/2 rounded-full bg-white/[0.07]" />
            <p className="mt-8 text-xs text-white/36">Reservado para caso real</p>
          </div>
        ))}
      </div>
    </MarketingSection>
  )
}

export function FaqSection() {
  return (
    <MarketingSection
      eyebrow="FAQ"
      title="Perguntas frequentes"
      description="Respostas diretas, sem promessa comercial fora do roadmap."
    >
      <MarketingFaq />
    </MarketingSection>
  )
}

export function MarketingFaq() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {faqs.map((faq) => (
        <details
          key={faq.question}
          className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 open:bg-white/[0.06]"
        >
          <summary className={`cursor-pointer list-none text-base font-semibold ${focusRing}`}>
            <span className="flex items-center justify-between gap-4">
              {faq.question}
              <span className="text-emerald-200 transition group-open:rotate-45" aria-hidden>
                +
              </span>
            </span>
          </summary>
          <p className="mt-4 text-sm leading-7 text-white/58">{faq.answer}</p>
        </details>
      ))}
    </div>
  )
}

export function FinalCtaSection() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#070908] p-8 text-center shadow-[0_40px_130px_rgb(0_0_0/0.36)] sm:p-12">
        <HeroTexture />
        <div className="relative">
          <BrandBars className="mx-auto mb-7 w-14" />
          <h2 className="mx-auto max-w-3xl text-5xl leading-[0.95] font-medium tracking-[-0.065em] text-balance sm:text-6xl">
            Comece pela verdade da sua operação.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/58">
            Conheça os planos ou inicie agora a criação da sua empresa na Rescript.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="/pricing" className={`${primaryCta} ${focusRing}`}>
              Começar Agora
            </a>
            <a href="/pricing" className={`${secondaryCta} ${focusRing}`}>
              Conhecer os planos
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export function MarketingFooter() {
  const groups = [
    ['Empresa', ['Sobre', 'Clientes', 'Contato']],
    ['Produto', ['Recursos', 'Módulos', 'Planos']],
    ['Recursos', ['Documentação', 'Status', 'FAQ']],
    ['Legal', ['Privacidade', 'Termos']],
  ] as const
  const hrefFor = (label: string) =>
    ({
      Sobre: '/about',
      Clientes: '/customers',
      Contato: '/contact',
      Recursos: '/features',
      Módulos: '/modules',
      Planos: '/pricing',
      Documentação: '/features',
      Status: '/status',
      FAQ: '/faq',
      Privacidade: '/privacy',
      Termos: '/terms',
    })[label] ?? '/'

  return (
    <footer className="border-t border-white/10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          <div className="flex items-center gap-3">
            <img src="/brand/mark.png" alt="" width="32" height="32" className="size-8 rounded-xl" />
            <span className="text-sm font-semibold tracking-[0.2em] uppercase">Rescript</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/48">{marketingSite.positioning}</p>
          <p className="mt-6 text-xs text-white/34">© 2026 Rescript. Todos os direitos reservados.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map(([title, items]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a href={hrefFor(item)} className={`rounded-lg text-sm text-white/46 transition hover:text-white ${focusRing}`}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}

export function MarketingSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-sm font-semibold text-emerald-200">{eyebrow}</p>
          <h2 className="mt-4 text-5xl leading-[0.95] font-medium tracking-[-0.065em] text-balance sm:text-6xl">
            {title}
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/58">{description}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

function MarketingCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="bg-[#090c0a] p-6 transition hover:bg-white/[0.055]">
      <h3 className="text-xl font-medium tracking-[-0.035em]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/52">{text}</p>
    </article>
  )
}
