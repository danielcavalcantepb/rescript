import { useState, type ReactNode } from 'react'
import { MarketingLayout } from './marketing-components'

const nav = [
  ['Plataforma', '#plataforma'],
  ['Indicadores', '#indicadores'],
  ['Operação', '#operacao'],
  ['Benefícios', '#beneficios'],
] as const

const faqs = [
  [
    'Para quais empresas a Rescript é indicada?',
    'Para operações que vendem, mantêm estoque e precisam acompanhar financeiro, produtos, marcas e vendedores em um só lugar.',
  ],
  [
    'O que alimenta os indicadores?',
    'Os indicadores usam dados registrados pela operação. Vendas, estoque e financeiro permanecem conectados à sua origem.',
  ],
  [
    'Posso acessar a Rescript pela internet?',
    'Sim. A plataforma é acessada pela web, sem instalação local para a rotina da equipe.',
  ],
  [
    'Como começo com a Rescript?',
    'Escolha “Quero ser Rescript” para iniciar o caminho de entrada na plataforma.',
  ],
] as const

function Glow({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute rounded-full bg-[#5fe09a]/20 blur-[110px] ${className}`}
    />
  )
}

function Section({
  id,
  eyebrow,
  title,
  children,
  className = '',
}: {
  id?: string
  eyebrow: string
  title: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      className={`relative px-5 py-32 sm:px-8 lg:px-12 lg:py-44 ${className}`}
    >
      <div className="relative mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#94f2b8]">
          {eyebrow}
        </p>
        <h2 className="mt-6 max-w-4xl text-5xl leading-[0.93] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">
          {title}
        </h2>
        {children}
      </div>
    </section>
  )
}

function LandingNavigation() {
  const [open, setOpen] = useState(false)
  return (
    <header className="absolute inset-x-0 top-0 z-50 px-5 pt-5 sm:px-8 lg:px-12 lg:pt-7">
      <nav className="mx-auto flex h-[70px] max-w-6xl items-center justify-between rounded-2xl border border-white/[0.12] bg-[#070a08]/75 px-4 shadow-[0_18px_80px_rgb(0_0_0/0.35)] backdrop-blur-2xl sm:px-6">
        <a
          href="/"
          className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94f2b8]"
          aria-label="Rescript"
        >
          <img
            src="/brand/mark.png"
            width="30"
            height="30"
            alt=""
            className="size-7 rounded-md"
          />
          <span className="text-xs font-semibold tracking-[0.24em]">RESCRIPT</span>
        </a>
        <div className="hidden items-center gap-8 lg:flex">
          {nav.map(([label, href]) => (
            <a
              className="text-sm text-white/62 transition hover:text-[#b8f7cd]"
              href={href}
              key={href}
            >
              {label}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="/login"
            aria-label="Entrar"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.06]"
          >
            Entrar
          </a>
          <a
            href="/onboarding"
            aria-label="Quero ser Rescript"
            className="rounded-full bg-[#63e5a0] px-5 py-2.5 text-sm font-semibold text-[#03110c] shadow-[0_0_34px_rgb(95_224_154/0.22)] transition hover:bg-[#8af0b3]"
          >
            Quero ser Rescript
          </a>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Abrir menu"
          className="grid size-10 place-items-center rounded-xl border border-white/15 lg:hidden"
        >
          <span aria-hidden className="text-lg">
            {open ? '×' : '☰'}
          </span>
        </button>
      </nav>
      {open ? (
        <div className="mx-auto mt-3 max-w-6xl rounded-2xl border border-white/10 bg-[#080b09]/95 p-3 backdrop-blur-2xl lg:hidden">
          {nav.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm text-white/75 hover:bg-white/[0.06]"
            >
              {label}
            </a>
          ))}
          <a
            href="/login"
            aria-label="Entrar"
            className="block rounded-xl px-4 py-3 text-sm text-white/75"
          >
            Entrar
          </a>
          <a
            href="/onboarding"
            aria-label="Quero ser Rescript"
            className="mt-1 block rounded-xl bg-[#63e5a0] px-4 py-3 text-center text-sm font-semibold text-[#03110c]"
          >
            Quero ser Rescript
          </a>
        </div>
      ) : null}
    </header>
  )
}

function HeroMockup() {
  return (
    <div className="relative mx-auto mt-16 max-w-6xl [perspective:1800px] sm:mt-20">
      <div className="absolute -inset-x-24 bottom-0 h-2/3 bg-[radial-gradient(ellipse_at_center,rgb(95_224_154/0.28),transparent_65%)] blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.16] bg-[#0b100d] p-3 shadow-[0_50px_150px_rgb(0_0_0/0.75)] [transform:rotateX(6deg)] sm:p-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <i className="size-2 rounded-full bg-[#63e5a0]" />
          <i className="size-2 rounded-full bg-white/20" />
          <i className="size-2 rounded-full bg-white/20" />
          <span className="ml-4 h-2 max-w-48 flex-1 rounded-full bg-white/[0.08]" />
        </div>
        <div className="grid min-h-[360px] gap-4 pt-4 lg:grid-cols-[160px_1fr_210px]">
          <aside className="hidden rounded-2xl border border-white/10 bg-[#070a08] p-4 lg:block">
            <div className="mb-10 h-3 w-20 rounded-full bg-[#63e5a0]/55" />
            <div className="space-y-2 text-xs text-white/45">
              <b className="block rounded-lg bg-[#63e5a0]/15 px-3 py-2.5 text-[#b8f7cd]">
                Central de comando
              </b>
              <span className="block px-3 py-2">Produtos</span>
              <span className="block px-3 py-2">Vendas</span>
              <span className="block px-3 py-2">Financeiro</span>
              <span className="block px-3 py-2">Compras</span>
            </div>
          </aside>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Faturamento', 'R$ 84,2 mil'],
                ['Pedidos', '128'],
                ['Estoque', '2.540'],
                ['Ticket médio', 'R$ 658'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/[0.035] p-3"
                >
                  <p className="text-[10px] text-white/42">{label}</p>
                  <b className="mt-3 block text-base sm:text-lg">{value}</b>
                  <small className="text-[#84e7aa]">+12,4%</small>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-[1.35fr_0.85fr]">
              <div className="relative min-h-52 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(150deg,#15241a,#090d0a)] p-5">
                <p className="text-sm text-white/62">Faturamento</p>
                <b className="mt-2 block text-2xl">R$ 84.200</b>
                <div className="absolute inset-x-5 bottom-5 flex h-24 items-end gap-1.5">
                  {[30, 50, 42, 64, 51, 78, 58, 92, 73, 100, 86].map((h, i) => (
                    <span
                      key={i}
                      style={{ height: `${h}%` }}
                      className="flex-1 rounded-t bg-gradient-to-t from-[#1d7848] to-[#9cf6bd]"
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#090d0a] p-5">
                <p className="text-sm text-white/62">Marcas</p>
                {[
                  ['Aurora', '32%'],
                  ['Horizonte', '24%'],
                  ['Norte', '18%'],
                ].map(([name, value]) => (
                  <div className="mt-4" key={name}>
                    <div className="flex justify-between text-xs">
                      <span>{name}</span>
                      <b>{value}</b>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#63e5a0]"
                        style={{ width: value }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="hidden rounded-2xl border border-white/10 bg-[#070a08] p-4 lg:block">
            <p className="text-xs text-white/45">Próximas ações</p>
            <div className="mt-5 space-y-4 text-xs">
              <p>
                <b className="block text-white">Estoque baixo</b>
                <span className="text-white/45">12 produtos precisam de atenção</span>
              </p>
              <p>
                <b className="block text-white">A receber hoje</b>
                <span className="text-white/45">R$ 8.420 previstos</span>
              </p>
              <p>
                <b className="block text-white">Top vendedor</b>
                <span className="text-white/45">Ana Costa · R$ 18.400</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function ProductBoard() {
  return (
    <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#0a110d] p-5 shadow-[0_30px_80px_rgb(0_0_0/0.3)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#8cf0b1]">
            Estoque por produto
          </p>
          <h3 className="mt-2 text-2xl">Visão de catálogo</h3>
        </div>
        <span className="rounded-full bg-[#63e5a0]/15 px-3 py-1 text-xs text-[#aaf7c5]">
          Em tempo real
        </span>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ['Camisa clássica', '92 peças', 'bg-[#1c4530]'],
          ['Tênis urbano', '38 peças', 'bg-[#17382a]'],
          ['Bolsa tote', '16 peças', 'bg-[#213b2e]'],
        ].map(([name, amount, color]) => (
          <div
            className={`min-h-44 rounded-2xl border border-white/10 p-4 ${color}`}
            key={name}
          >
            <div className="h-16 rounded-xl border border-white/10 bg-white/[0.07]" />
            <p className="mt-6 text-sm">{name}</p>
            <b className="mt-1 block text-xs text-[#aaf7c5]">{amount}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinanceBoard() {
  return (
    <div className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#0c100e] p-6 shadow-[0_30px_80px_rgb(0_0_0/0.3)]">
      <Glow className="-right-16 -top-20 size-52" />
      <p className="relative text-xs uppercase tracking-[0.16em] text-[#8cf0b1]">
        Financeiro
      </p>
      <h3 className="relative mt-3 text-3xl tracking-[-0.05em]">Caixa em contexto.</h3>
      <div className="relative mt-10 flex items-end justify-between">
        <div>
          <p className="text-sm text-white/48">Saldo projetado</p>
          <b className="mt-2 block text-4xl">R$ 42.860</b>
        </div>
        <span className="rounded-full bg-[#63e5a0]/15 px-3 py-1 text-xs text-[#b5f9cc]">
          +8,3%
        </span>
      </div>
      <div className="relative mt-9 flex h-20 items-end gap-2">
        {[28, 42, 36, 64, 52, 82, 62, 95].map((h, i) => (
          <i
            key={i}
            className="flex-1 rounded-t bg-[#63e5a0]/80"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function Cta({ children, outline = false }: { children: ReactNode; outline?: boolean }) {
  return (
    <a
      href="/onboarding"
      aria-label="Quero ser Rescript"
      className={`inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold transition duration-300 ${outline ? 'border border-white/20 text-white hover:border-[#8cf0b1] hover:text-[#b8f7cd]' : 'bg-[#63e5a0] text-[#04130c] shadow-[0_0_40px_rgb(95_224_154/0.2)] hover:-translate-y-0.5 hover:bg-[#8bf0b5]'}`}
    >
      {children}
    </a>
  )
}

function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.08] px-5 py-14 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/brand/mark.png"
              alt=""
              width="30"
              height="30"
              className="size-7 rounded-md"
            />
            <b className="text-xs tracking-[0.24em]">RESCRIPT</b>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/50">
            Vendas, estoque, compras, financeiro e indicadores em uma leitura que
            acompanha sua operação.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/40">Produto</p>
          <div className="mt-4 space-y-3 text-sm text-white/60">
            <a className="block hover:text-[#b8f7cd]" href="#plataforma">
              Plataforma
            </a>
            <a className="block hover:text-[#b8f7cd]" href="#indicadores">
              Indicadores
            </a>
            <a className="block hover:text-[#b8f7cd]" href="#operacao">
              Operação
            </a>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/40">Acesso</p>
          <div className="mt-4 space-y-3 text-sm text-white/60">
            <a className="block hover:text-[#b8f7cd]" href="/login">
              Entrar
            </a>
            <a className="block hover:text-[#b8f7cd]" href="/privacy">
              Privacidade
            </a>
            <a className="block hover:text-[#b8f7cd]" href="/terms">
              Termos
            </a>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-14 max-w-6xl text-xs text-white/32">
        © {new Date().getFullYear()} Rescript. Todos os direitos reservados.
      </p>
    </footer>
  )
}

export function RescripetMarketingPage() {
  return (
    <MarketingLayout chrome={false} className="bg-[#030504]">
      <div className="relative overflow-hidden bg-[#030504] text-white">
        <style>{`@keyframes rescriptFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}@keyframes rescriptIn{from{opacity:0;transform:translateY(20px);filter:blur(10px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}.rs-in{animation:rescriptIn .8s cubic-bezier(.2,.8,.2,1) both}.rs-float{animation:rescriptFloat 8s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.rs-in,.rs-float{animation:none}}`}</style>
        <LandingNavigation />
        <section className="relative isolate min-h-[900px] overflow-hidden px-5 pb-24 pt-40 sm:px-8 lg:min-h-[1080px] lg:px-12 lg:pt-52">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgb(95_224_154/0.18),transparent_24%),radial-gradient(circle_at_8%_55%,rgb(25_86_52/0.2),transparent_25%),linear-gradient(118deg,transparent_20%,rgb(255_255_255/0.035)_20.1%,transparent_20.25%,transparent_57%,rgb(255_255_255/0.03)_57.1%,transparent_57.25%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-28 h-px bg-gradient-to-r from-transparent via-[#7df0a9]/30 to-transparent"
          />
          <div
            aria-hidden
            className="absolute left-1/2 top-20 h-[900px] w-[1100px] -translate-x-1/2 rounded-[5rem] border border-white/[0.04]"
          />
          <Glow className="-left-40 top-1/4 size-[32rem]" />
          <Glow className="-right-40 top-1/3 size-[30rem]" />
          <div className="relative mx-auto max-w-6xl text-center">
            <div className="rs-in mx-auto w-fit rounded-full border border-[#83eeb0]/25 bg-[#63e5a0]/10 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-[#b8f7cd] uppercase">
              Gestão para operações que querem crescer
            </div>
            <h1 className="rs-in mx-auto mt-9 max-w-5xl text-6xl leading-[0.85] tracking-[-0.085em] sm:text-8xl lg:text-[8.8rem]">
              A empresa inteira.
              <br />
              <span className="text-[#b8f7cd]">Sob controle.</span>
            </h1>
            <p className="rs-in mx-auto mt-9 max-w-2xl text-lg leading-8 text-white/60 sm:text-xl">
              A Rescript transforma vendas, produtos, estoque, financeiro e indicadores em
              uma única leitura da sua operação.
            </p>
            <div className="rs-in mt-10 flex justify-center">
              <Cta>Quero ser Rescript</Cta>
            </div>
            <p className="rs-in mt-5 text-xs text-white/38">
              Uma visão clara para a próxima decisão.
            </p>
            <div className="rs-float">
              <HeroMockup />
            </div>
          </div>
        </section>
        <Section
          id="plataforma"
          eyebrow="Uma plataforma, vários sinais"
          title={
            <>
              O que acontece na operação
              <br />
              <span className="text-[#b8f7cd]">deixa de ficar escondido.</span>
            </>
          }
        >
          <div className="mt-16 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            <div className="flex min-h-[470px] flex-col justify-between rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_90%_0%,rgb(95_224_154/0.18),transparent_38%),#09100c] p-8 sm:p-10">
              <div>
                <p className="text-sm text-white/45">Vendas, estoque e financeiro</p>
                <h3 className="mt-5 max-w-lg text-4xl leading-[0.95] tracking-[-0.055em]">
                  Uma venda finalizada muda a leitura da empresa inteira.
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <span className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  Venda
                  <br />
                  <b className="mt-2 block text-[#b8f7cd]">confirmada</b>
                </span>
                <span className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  Estoque
                  <br />
                  <b className="mt-2 block text-[#b8f7cd]">atualizado</b>
                </span>
                <span className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  Indicador
                  <br />
                  <b className="mt-2 block text-[#b8f7cd]">explicável</b>
                </span>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FinanceBoard />
              <div className="rounded-[1.7rem] border border-white/10 bg-[#0c100e] p-6">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8cf0b1]">
                  Vendedores
                </p>
                <h3 className="mt-3 text-3xl tracking-[-0.05em]">
                  Quem move o resultado.
                </h3>
                <div className="mt-10 space-y-4">
                  {[
                    ['Ana Costa', 'R$ 18.400'],
                    ['Bruno Lima', 'R$ 15.200'],
                    ['Carla Souza', 'R$ 12.600'],
                  ].map(([name, value], index) => (
                    <div
                      key={name}
                      className="flex items-center justify-between border-b border-white/[0.07] pb-3 text-sm"
                    >
                      <span>
                        <b className="mr-2 text-[#aaf7c5]">0{index + 1}</b>
                        {name}
                      </span>
                      <b>{value}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>
        <Section
          id="indicadores"
          eyebrow="Indicadores que respondem"
          title={
            <>
              Abra a Rescript e entenda
              <br />o negócio <span className="text-[#b8f7cd]">em segundos.</span>
            </>
          }
          className="bg-[linear-gradient(180deg,transparent,#08100b_45%,transparent)]"
        >
          <div className="mt-16">
            <ProductBoard />
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
            <div className="rounded-[1.7rem] border border-white/10 bg-[#0b100d] p-7">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8cf0b1]">
                Leitura executiva
              </p>
              <p className="mt-8 text-3xl leading-tight tracking-[-0.05em]">
                Faturamento, peças, caixa e contas abertas aparecem no mesmo contexto.
              </p>
              <p className="mt-6 text-sm leading-6 text-white/50">
                O gestor deixa de abrir relatórios isolados para descobrir o que precisa
                fazer agora.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#0a0e0b] p-7">
              <Glow className="-right-10 bottom-0 size-48" />
              <div className="relative">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-white/48">Evolução mensal</p>
                    <b className="mt-2 block text-4xl">R$ 84.200</b>
                  </div>
                  <span className="text-sm text-[#aaf7c5]">+12,4%</span>
                </div>
                <div className="mt-14 flex h-36 items-end gap-2">
                  {[35, 48, 45, 64, 58, 74, 68, 96, 75, 100, 88, 92].map(
                    (height, index) => (
                      <span
                        key={index}
                        className="flex-1 rounded-t bg-gradient-to-t from-[#175c39] to-[#a6fac4]"
                        style={{ height: `${height}%` }}
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </Section>
        <Section
          id="operacao"
          eyebrow="O catálogo como centro da operação"
          title={
            <>
              Produtos, marcas e estoque
              <br />
              com <span className="text-[#b8f7cd]">profundidade visual.</span>
            </>
          }
        >
          <div className="mt-16 grid gap-5 md:grid-cols-12">
            <article className="min-h-[310px] rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_0%_0%,rgb(95_224_154/0.22),transparent_48%),#101812] p-8 md:col-span-7">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8cf0b1]">
                Estoque inteligente
              </p>
              <h3 className="mt-5 max-w-md text-4xl leading-[0.95] tracking-[-0.055em]">
                Veja o valor do estoque antes que ele vire dinheiro parado.
              </h3>
              <div className="mt-10 flex gap-3">
                <span className="rounded-lg bg-white/[0.07] px-3 py-2 text-xs">
                  2.540 peças
                </span>
                <span className="rounded-lg bg-white/[0.07] px-3 py-2 text-xs">
                  12 itens críticos
                </span>
                <span className="rounded-lg bg-white/[0.07] px-3 py-2 text-xs">
                  32% marca líder
                </span>
              </div>
            </article>
            <article className="min-h-[310px] rounded-[2rem] border border-white/10 bg-[#0b100d] p-8 md:col-span-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8cf0b1]">
                Compras
              </p>
              <h3 className="mt-5 text-3xl leading-[0.98] tracking-[-0.055em]">
                Compre sabendo o que está saindo.
              </h3>
              <div className="mt-12 space-y-3 text-sm">
                {[
                  'Pedido confirmado',
                  'Recebimento registrado',
                  'Estoque atualizado',
                ].map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="grid size-7 place-items-center rounded-full bg-[#63e5a0]/15 text-xs text-[#b8f7cd]">
                      0{index + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </article>
            <article className="min-h-[250px] rounded-[2rem] border border-white/10 bg-[#0b100d] p-8 md:col-span-4">
              <p className="text-3xl tracking-[-0.055em]">Produtos que pedem atenção.</p>
              <p className="mt-8 text-sm text-white/50">
                Organize giro, disponibilidade e valor por produto, variante e marca.
              </p>
            </article>
            <article className="relative min-h-[250px] overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(125deg,#0f1d14,#071009)] p-8 md:col-span-8">
              <Glow className="right-10 top-0 size-48" />
              <div className="relative">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8cf0b1]">
                  Financeiro conectado
                </p>
                <h3 className="mt-5 max-w-lg text-4xl leading-[0.98] tracking-[-0.055em]">
                  Contas a receber e a pagar sem perder o vínculo com a operação.
                </h3>
              </div>
            </article>
          </div>
        </Section>
        <section
          id="beneficios"
          className="relative overflow-hidden px-5 py-36 sm:px-8 lg:px-12 lg:py-48"
        >
          <Glow className="left-1/2 top-0 size-[38rem] -translate-x-1/2" />
          <div className="relative mx-auto max-w-6xl rounded-[2.5rem] border border-white/12 bg-[linear-gradient(140deg,rgb(95_224_154/0.2),transparent_40%),#0a100c] px-7 py-16 sm:px-12 lg:px-20 lg:py-24">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#aaf7c5]">
                Benefícios da Rescript
              </p>
              <h2 className="mt-6 text-5xl leading-[0.92] tracking-[-0.07em] sm:text-7xl">
                Menos ruído.
                <br />
                Mais <span className="text-[#b8f7cd]">controle.</span>
              </h2>
            </div>
            <div className="mt-16 grid gap-3 md:grid-cols-3">
              {[
                [
                  'Uma operação em um lugar',
                  'Vendas, estoque, compras e financeiro conectados pela mesma empresa.',
                ],
                [
                  'Números que explicam',
                  'Indicadores derivados de eventos reais, com contexto para decidir.',
                ],
                [
                  'Time mais produtivo',
                  'Menos troca de ferramenta e menos cliques para acompanhar a rotina.',
                ],
                [
                  'Visão por produto e marca',
                  'Entenda itens, peças e valor onde a operação realmente acontece.',
                ],
                [
                  'Acompanhamento comercial',
                  'Compare vendedores, pedidos e ticket médio com uma leitura direta.',
                ],
                [
                  'Decisão no momento certo',
                  'Sinais de estoque, financeiro e vendas aparecem antes da urgência.',
                ],
              ].map(([title, text]) => (
                <article
                  key={title}
                  className="rounded-2xl border border-white/10 bg-black/25 p-6 transition hover:-translate-y-1 hover:border-[#8cf0b1]/35"
                >
                  <h3 className="text-xl tracking-[-0.04em]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">{text}</p>
                </article>
              ))}
            </div>
            <div className="mt-12">
              <Cta>Quero ser Rescript</Cta>
            </div>
          </div>
        </section>
        <section className="relative px-5 py-32 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-6xl gap-12 border-y border-white/[0.08] py-16 lg:grid-cols-[.7fr_1.3fr] lg:py-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8cf0b1]">
                Como funciona
              </p>
              <h2 className="mt-6 text-5xl leading-[0.94] tracking-[-0.065em]">
                Uma operação que começa simples e cresce com você.
              </h2>
            </div>
            <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {[
                [
                  'Cadastre e organize',
                  'Produtos, clientes, marcas e fornecedores com contexto.',
                ],
                [
                  'Registre a operação',
                  'Vendas, compras e recebimentos mantêm a empresa atualizada.',
                ],
                [
                  'Acompanhe os números',
                  'Indicadores, estoque e financeiro se conectam à operação.',
                ],
                [
                  'Decida com clareza',
                  'Veja o que gira, o que falta e onde estão as oportunidades.',
                ],
              ].map(([title, text], index) => (
                <div key={title} className="border-t border-white/10 pt-5">
                  <span className="text-sm text-[#aaf7c5]">0{index + 1}</span>
                  <h3 className="mt-4 text-2xl tracking-[-0.04em]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="px-5 py-32 sm:px-8 lg:px-12">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-[#85f1b2]/30 bg-[radial-gradient(circle_at_12%_20%,rgb(95_224_154/0.32),transparent_30%),linear-gradient(130deg,#102419,#070b08_62%)] px-7 py-24 text-center shadow-[0_50px_140px_rgb(0_0_0/0.5)] sm:px-12 lg:py-32">
            <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(118deg,transparent_0,transparent_54px,rgb(255_255_255/0.16)_55px,transparent_56px)]" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b8f7cd]">
                Próximo passo
              </p>
              <h2 className="mx-auto mt-6 max-w-4xl text-5xl leading-[0.9] tracking-[-0.075em] sm:text-7xl">
                Sua empresa merece uma visão que acompanhe o ritmo dela.
              </h2>
              <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-white/60">
                Conheça uma plataforma em que vendas, estoque, financeiro e indicadores
                finalmente conversam.
              </p>
              <div className="mt-10 flex justify-center">
                <Cta>Quero ser Rescript</Cta>
              </div>
            </div>
          </div>
        </section>
        <section className="px-5 pb-32 pt-12 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#8cf0b1]">
              FAQ
            </p>
            <h2 className="mt-6 text-center text-5xl leading-[0.94] tracking-[-0.065em] sm:text-6xl">
              Perguntas frequentes.
            </h2>
            <div className="mt-14 divide-y divide-white/10 rounded-[1.7rem] border border-white/10 bg-[#080c09] px-6">
              {faqs.map(([question, answer]) => (
                <details key={question} className="group py-6">
                  <summary className="cursor-pointer list-none text-lg font-medium">
                    <span className="flex items-center justify-between gap-4">
                      {question}
                      <b className="text-[#aaf7c5] transition group-open:rotate-45">+</b>
                    </span>
                  </summary>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <LandingFooter />
      </div>
    </MarketingLayout>
  )
}
