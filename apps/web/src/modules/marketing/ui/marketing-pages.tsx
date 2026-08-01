import { features, marketingSite, modules, plans } from '../content'
import { OrganizationStructuredData } from '../seo'
import {
  FinalCtaSection,
  MarketingFaq,
  MarketingLayout,
  MarketingSection,
  ModuleGrid,
  PricingSection,
  TestimonialsSection,
} from './marketing-components'
import { RescripetMarketingPage } from './rescripet-landing'

export function MarketingHomePage() {
  return <><OrganizationStructuredData /><RescripetMarketingPage /></>
}

export function MarketingFeaturesPage() {
  return (
    <MarketingLayout>
      <MarketingPageHero
        eyebrow="Recursos"
        title="Recursos pensados para relação, contexto e velocidade."
        description="A Rescript transforma capacidades técnicas em ganho operacional: menos retrabalho, mais contexto e decisões explicáveis."
      />
      <MarketingSection
        eyebrow="Diferenciais"
        title="Cada recurso precisa aproximar áreas."
        description="A plataforma pública apresenta os pilares do produto sem acionar funcionalidades internas."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">{feature.text}</p>
            </article>
          ))}
        </div>
      </MarketingSection>
      <FinalCtaSection />
    </MarketingLayout>
  )
}

export function MarketingModulesPage() {
  return (
    <MarketingLayout>
      <MarketingPageHero
        eyebrow="Camadas"
        title="Camadas conectadas pela mesma empresa."
        description="Relacionamento, receita, operação, financeiro e inteligência aparecem como partes de uma rede única."
      />
      <MarketingSection
        eyebrow="Mapa operacional"
        title="Responsabilidades claras. Relações visíveis."
        description="Cada card aponta para a futura página da camada e preserva a arquitetura modular do produto."
      >
        <ModuleGrid />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {modules.map((module, index) => (
            <article
              id={module.slug}
              key={module.slug}
              className="scroll-mt-24 rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5"
            >
              <p className="text-xs text-white/34">0{index + 1}</p>
              <h2 className="mt-6 text-xl font-semibold">{module.name}</h2>
              <p className="mt-3 text-sm leading-6 text-white/62">{module.description}</p>
              <p className="mt-4 text-sm font-medium text-emerald-200">{module.benefit}</p>
            </article>
          ))}
        </div>
      </MarketingSection>
      <FinalCtaSection />
    </MarketingLayout>
  )
}

export function MarketingPricingPage() {
  return (
    <MarketingLayout>
      <MarketingPageHero
        eyebrow="Planos"
        title="Escolha como sua operação começa."
        description="O checkout cria a empresa, o owner, a assinatura inicial e o onboarding. Cobrança e gateways continuam fora desta fundação."
      />
      <PricingSection />
      <MarketingSection
        eyebrow="Próximo passo"
        title="Do plano ao primeiro workspace."
        description="Depois da escolha do plano, a Rescript prepara a base SaaS para o primeiro acesso do proprietário."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.name} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="font-semibold">{plan.name}</h2>
              <p className="mt-2 text-sm leading-6 text-white/58">{plan.audience}</p>
            </div>
          ))}
        </div>
      </MarketingSection>
    </MarketingLayout>
  )
}

export function MarketingAboutPage() {
  return (
    <MarketingLayout>
      <MarketingPageHero
        eyebrow="Sobre"
        title="A Rescript nasce para conectar a empresa inteira."
        description={marketingSite.description}
      />
      <MarketingSection
        eyebrow="Produto"
        title="Plataforma moderna com disciplina operacional."
        description="A base do produto privilegia workspaces, relações, rastreabilidade, permissões, auditoria e fluxos operacionais claros."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {['Produtividade antes de volume', 'Contexto antes de navegação', 'Governança antes de atalhos frágeis'].map(
            (item) => (
              <article key={item} className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-lg font-semibold">{item}</h2>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  Uma decisão de produto só entra quando reduz esforço, preserva controle e escala com segurança.
                </p>
              </article>
            ),
          )}
        </div>
      </MarketingSection>
      <FinalCtaSection />
    </MarketingLayout>
  )
}

export function MarketingCustomersPage() {
  return (
    <MarketingLayout>
      <MarketingPageHero
        eyebrow="Clientes"
        title="Espaço reservado para histórias reais."
        description="Depoimentos, logos e estudos de caso serão publicados apenas com autorização e evidências reais."
      />
      <TestimonialsSection />
    </MarketingLayout>
  )
}

export function MarketingFaqPage() {
  return (
    <MarketingLayout>
      <MarketingPageHero
        eyebrow="FAQ"
        title="Perguntas frequentes sobre a Rescript."
        description="Respostas institucionais para entender posicionamento, escopo e próximas evoluções."
      />
      <MarketingSection
        eyebrow="Dúvidas"
        title="O essencial para avaliar a plataforma."
        description="As respostas evitam promessas de módulos que pertencem a sprints futuras."
      >
        <MarketingFaq />
      </MarketingSection>
    </MarketingLayout>
  )
}

export function MarketingContactPage() {
  return (
    <MarketingLayout>
      <MarketingPageHero
        eyebrow="Contato"
        title="Vamos entender sua operação."
        description="Nesta fundação pública, o contato permanece institucional e preparado para um fluxo comercial futuro."
      />
      <MarketingSection
        eyebrow="Canais"
        title="Fale com a Rescript."
        description="Use os canais institucionais enquanto o fluxo comercial completo entra em sprints posteriores."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <a
            href="mailto:contato@rescript.com.br"
            className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 transition hover:border-emerald-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
          >
            <p className="text-sm text-emerald-200">E-mail</p>
            <h2 className="mt-3 text-xl font-semibold">contato@rescript.com.br</h2>
            <p className="mt-3 text-sm leading-6 text-white/58">Converse com a Rescript sobre operação, módulos e implantação.</p>
          </a>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-emerald-200">Relacionamento</p>
            <h2 className="mt-3 text-xl font-semibold">Atendimento comercial em preparação</h2>
            <p className="mt-3 text-sm leading-6 text-white/58">A página mantém um ponto de contato sem implementar checkout, login, cadastro ou agendamento comercial.</p>
          </div>
        </div>
      </MarketingSection>
    </MarketingLayout>
  )
}

export function MarketingPrivacyPage() {
  return (
    <MarketingLegalPage
      eyebrow="Privacidade"
      title="Privacidade"
      description="Página institucional preparada para a política oficial de privacidade."
      items={[
        'A Rescript trata privacidade como requisito de produto e governança.',
        'Esta página pública não coleta dados transacionais do ERP.',
        'O texto jurídico final deve ser validado antes da publicação comercial.',
      ]}
    />
  )
}

export function MarketingTermsPage() {
  return (
    <MarketingLegalPage
      eyebrow="Termos"
      title="Termos de uso"
      description="Página institucional preparada para os termos oficiais da plataforma."
      items={[
        'O checkout cria a base SaaS, mas não executa cobrança nem integra gateways nesta fundação.',
        'Os termos definitivos devem acompanhar o modelo comercial futuro.',
        'Nenhuma regra operacional do ERP é alterada por esta página pública.',
      ]}
    />
  )
}

export function MarketingStatusPage() {
  return (
    <MarketingLayout>
      <MarketingPageHero
        eyebrow="Status"
        title="Status operacional da plataforma."
        description="Estrutura pública para comunicação de disponibilidade, preparada para integração futura com monitoramento."
      />
      <MarketingSection
        eyebrow="Disponibilidade"
        title="Página de status em modo institucional."
        description="Não há integração com incidentes ou telemetria nesta sprint."
      >
        <div className="rounded-[1.75rem] border border-emerald-300/20 bg-emerald-300/10 p-6">
          <p className="text-sm font-semibold text-emerald-100">Estrutura pronta</p>
          <p className="mt-3 text-sm leading-6 text-white/62">
            A conexão com uma fonte real de status deve ser adicionada em sprint específica de observabilidade pública.
          </p>
        </div>
      </MarketingSection>
    </MarketingLayout>
  )
}

function MarketingLegalPage({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string
  title: string
  description: string
  items: string[]
}) {
  return (
    <MarketingLayout>
      <MarketingPageHero eyebrow={eyebrow} title={title} description={description} />
      <MarketingSection
        eyebrow="Escopo"
        title="Conteúdo preparado para revisão jurídica."
        description="Esta fundação mantém a página navegável sem inventar termos legais definitivos."
      >
        <div className="space-y-3">
          {items.map((item) => (
            <p key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-6 text-white/64">
              {item}
            </p>
          ))}
        </div>
      </MarketingSection>
    </MarketingLayout>
  )
}

function MarketingPageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <section className="relative overflow-hidden px-4 pt-28 pb-12 sm:px-6 lg:px-8 lg:pt-36">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-400/16 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-5xl">
        <p className="text-sm font-semibold text-emerald-200">{eyebrow}</p>
        <h1 className="mt-4 text-5xl leading-[0.98] font-semibold tracking-[-0.06em] text-balance text-white sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-white/64">{description}</p>
      </div>
    </section>
  )
}
