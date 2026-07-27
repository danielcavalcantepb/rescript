import type { ReactNode } from 'react'
import { CalendarDays, CheckCircle2, CreditCard, PackageCheck, Save } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { formatCents } from '../sales-money'

export function WorkspaceSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] shadow-sm">
      <header className="border-b border-[var(--color-border-soft)] px-5 py-4">
        <h2 className="font-semibold text-[var(--color-text)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

export function OrderHeader({
  isEdit,
  date,
  submitting,
  canSubmit,
  canConfirm,
  onCancel,
  onSave,
  onConfirm,
}: {
  isEdit: boolean
  date: string
  submitting: boolean
  canSubmit: boolean
  canConfirm: boolean
  onCancel: () => void
  onSave: () => void
  onConfirm: () => void
}) {
  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-[var(--color-border-soft)] bg-[color:var(--color-background)/0.96] px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span className="rounded-full bg-[var(--color-primary-soft)] px-2 py-1 font-medium text-[var(--color-primary)]">
              Rascunho
            </span>
            <span>{isEdit ? 'Pedido em edição' : 'Número gerado ao salvar'}</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold">Pedido de venda</h1>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-muted)]">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {date}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button className="flex-1 sm:flex-none" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button className="flex-1 gap-2 sm:flex-none" disabled={submitting || !canSubmit} onClick={onSave}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {submitting ? 'Salvando…' : 'Salvar rascunho'}
          </Button>
          {canConfirm ? (
            <Button
              className="flex-1 gap-2 sm:flex-none"
              disabled={submitting || !canSubmit}
              onClick={onConfirm}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Concluir pedido
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export function PaymentSection() {
  return (
    <WorkspaceSection
      title="Pagamento"
      description="As condições financeiras serão habilitadas quando o contrato de integração com Receivables estiver aprovado."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Condição de pagamento">
          <Input value="Não configurada" disabled />
        </FormField>
        <FormField label="Forma de pagamento">
          <Input value="Definida posteriormente" disabled />
        </FormField>
      </div>
      <p className="mt-3 flex gap-2 text-xs text-[var(--color-muted)]">
        <CreditCard className="h-4 w-4 shrink-0" aria-hidden="true" />
        Nenhuma parcela ou obrigação financeira é criada nesta etapa.
      </p>
    </WorkspaceSection>
  )
}

export function DeliverySection() {
  return (
    <WorkspaceSection
      title="Entrega"
      description="A entrega não possui contrato persistente no Sales Order atual."
    >
      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted)]">
        <div className="flex items-center gap-2 font-medium text-[var(--color-text-secondary)]">
          <PackageCheck className="h-4 w-4" aria-hidden="true" />
          Definição logística pendente
        </div>
        <p className="mt-1">
          Transportadora, frete, volumes e endereço não serão simulados nem gravados em observações.
        </p>
      </div>
    </WorkspaceSection>
  )
}

export function SalesTotals({
  itemCount,
  subtotalCents,
  discountCents,
  currency,
}: {
  itemCount: number
  subtotalCents: number
  discountCents: number
  currency: string
}) {
  const total = Math.max(0, subtotalCents - discountCents)
  return (
    <aside className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 shadow-sm lg:sticky lg:top-28">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
        <h2 className="font-semibold">Resumo comercial</h2>
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between"><dt>Itens</dt><dd>{itemCount}</dd></div>
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCents(subtotalCents, currency)}</dd></div>
        <div className="flex justify-between text-[var(--color-muted)]"><dt>Desconto</dt><dd>- {formatCents(discountCents, currency)}</dd></div>
        <div className="flex justify-between text-[var(--color-muted)]"><dt>Frete</dt><dd>Não informado</dd></div>
        <div className="border-t border-[var(--color-border-soft)] pt-3">
          <div className="flex items-end justify-between gap-3">
            <dt className="font-medium">Total</dt>
            <dd className="text-xl font-semibold">{formatCents(total, currency)}</dd>
          </div>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
        O servidor recalcula preços, descontos e snapshots antes de persistir o pedido.
      </p>
    </aside>
  )
}

export function NotesSection({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <WorkspaceSection title="Observações" description="Informação interna preservada no documento comercial.">
      <FormField label="Observação interna">
        <Textarea
          value={value}
          rows={4}
          placeholder="Contexto importante para a equipe comercial"
          onChange={(event) => onChange(event.target.value)}
        />
      </FormField>
    </WorkspaceSection>
  )
}
