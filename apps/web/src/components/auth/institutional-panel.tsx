import { cn } from '#/lib/utils'

const NARRATIVE = [
  {
    title: 'Clientes',
    body: 'Relacionamentos sob um único contexto — claros, completos e acessíveis a toda a operação.',
  },
  {
    title: 'Produtos',
    body: 'Um catálogo estruturado para que a empresa opere com a mesma referência em cada etapa.',
  },
  {
    title: 'Processos',
    body: 'Cada ação registrada. Cada etapa ligada. Cada decisão apoiada em informação confiável.',
  },
] as const

/**
 * Institutional brand panel for the auth experience.
 * Positioning only — no feature lists, no fabricated metrics.
 * Decorative ambient visuals only; no auth behavior.
 */
export function InstitutionalPanel({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'relative hidden overflow-hidden bg-[var(--auth-panel-bg)] lg:flex lg:flex-col lg:justify-center',
        className,
      )}
      aria-label="Rescript — centro operacional"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--auth-grid-line) 1px, transparent 1px),
            linear-gradient(to bottom, var(--auth-grid-line) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse 75% 65% at 55% 42%, black 15%, transparent 78%)',
        }}
      />

      <div
        className="pointer-events-none absolute -top-24 left-1/2 size-[560px] -translate-x-1/2 rounded-full blur-3xl"
        aria-hidden
        style={{
          background: 'radial-gradient(circle, var(--auth-glow), transparent 68%)',
        }}
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
        aria-hidden
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 600 800"
      >
        <g stroke="var(--auth-connector)" strokeWidth="1" fill="none">
          <path d="M120 150 L300 250 L470 170" />
          <path d="M300 250 L280 470 L470 560" />
          <path d="M280 470 L120 560" />
        </g>
        {[
          [120, 150],
          [470, 170],
          [300, 250],
          [280, 470],
          [120, 560],
          [470, 560],
        ].map(([cx, cy]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="2.5"
            fill="var(--color-accent)"
            opacity="0.5"
          />
        ))}
      </svg>

      <div className="auth-panel-enter relative z-10 flex flex-col px-12 xl:px-16">
        <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--color-accent)] uppercase">
          Centro operacional
        </p>
        <h2 className="mt-5 max-w-[16ch] text-[2rem] leading-[1.12] font-semibold tracking-tight text-[var(--color-ink)] text-balance xl:text-[2.25rem]">
          Uma só verdade operacional.
        </h2>
        <p className="mt-4 max-w-[40ch] text-[14px] leading-relaxed text-[var(--color-text-secondary)] text-pretty">
          O Rescript é onde a operação acontece — reunida, padronizada e
          preparada para crescer com ordem.
        </p>

        <div className="auth-rise mt-10 w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/80 p-5 shadow-[var(--shadow-elevated)] backdrop-blur-md">
          <p className="text-[13px] font-medium tracking-tight text-[var(--color-ink)]">
            Operação integrada
          </p>

          <ol className="mt-5 space-y-5">
            {NARRATIVE.map((item, index) => (
              <li key={item.title} className="relative pl-5">
                {index < NARRATIVE.length - 1 ? (
                  <span
                    className="absolute top-5 bottom-[-1.25rem] left-[3px] w-px bg-[var(--color-border)]"
                    aria-hidden
                  />
                ) : null}
                <span
                  className="absolute top-1.5 left-0 size-1.5 rounded-full bg-[var(--color-accent)]"
                  aria-hidden
                />
                <p className="text-[13px] font-medium text-[var(--color-ink)]">
                  {item.title}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 self-start rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1.5 backdrop-blur-sm">
          <span
            className="inline-block size-1.5 rounded-full bg-[var(--color-accent)]"
            aria-hidden
          />
          <span className="text-[11px] tracking-wide text-[var(--color-text-secondary)]">
            Para empresas que cresceram além do improviso.
          </span>
        </div>
      </div>
    </aside>
  )
}
