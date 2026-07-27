import { useEffect, useMemo, useState } from 'react'
import { Button } from '#/components/ui/button'
import type {
  AttributeResponse,
  BrandResponse,
  CategoryResponse,
  CreateProductCommand,
  UnitOfMeasureResponse,
} from '#/modules/catalog/application'

type ProductKind = 'simple' | 'variable'
type Draft = {
  name: string
  description: string
  sku: string
  barcode: string
  brandId: string
  categoryId: string
  unitId: string
  kind: ProductKind
  selections: Record<string, string[]>
}

export function buildVariantCombinationLabels(
  axes: Array<{ labels: string[] }>,
): string[] {
  if (axes.length === 0) return []
  return axes.reduce<string[]>(
    (rows, axis) =>
      rows.flatMap((row) =>
        axis.labels.map((label) => (row ? `${row} / ${label}` : label)),
      ),
    [''],
  )
}

const emptyDraft = (unitId: string): Draft => ({
  name: '',
  description: '',
  sku: '',
  barcode: '',
  brandId: '',
  categoryId: '',
  unitId,
  kind: 'simple',
  selections: {},
})

const fieldClass =
  'h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-focus)]'

export function ProductWizard({
  organizationId,
  brands,
  categories,
  attributes,
  units,
  submitting,
  error,
  onSubmit,
  onCancel,
}: {
  organizationId: string
  brands: BrandResponse[]
  categories: CategoryResponse[]
  attributes: AttributeResponse[]
  units: UnitOfMeasureResponse[]
  submitting: boolean
  error: string | null
  onSubmit: (command: CreateProductCommand) => Promise<void>
  onCancel: () => void
}) {
  const storageKey = `catalog-product-draft:${organizationId}`
  const defaultUnitId = units[0]?.id ?? ''
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(defaultUnitId))
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (saved) {
      try {
        setDraft({ ...emptyDraft(defaultUnitId), ...JSON.parse(saved) })
      } catch {
        window.localStorage.removeItem(storageKey)
      }
    } else if (defaultUnitId) {
      setDraft((current) => ({ ...current, unitId: current.unitId || defaultUnitId }))
    }
  }, [defaultUnitId, storageKey])

  useEffect(() => {
    if (!touched) return
    window.localStorage.setItem(storageKey, JSON.stringify(draft))
  }, [draft, storageKey, touched])

  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent) => {
      if (!touched) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', preventLoss)
    return () => window.removeEventListener('beforeunload', preventLoss)
  }, [touched])

  const selectedAxes = useMemo(
    () =>
      attributes
        .filter((attribute) => (draft.selections[attribute.id]?.length ?? 0) > 0)
        .map((attribute) => ({
          attribute,
          valueIds: draft.selections[attribute.id]!,
        })),
    [attributes, draft.selections],
  )
  const combinations = useMemo(() => {
    return buildVariantCombinationLabels(
      selectedAxes.map((axis) => ({
        labels: axis.valueIds.map(
          (id) =>
            axis.attribute.values.find((value) => value.id === id)?.label ?? id,
        ),
      })),
    )
  }, [selectedAxes])

  function update(next: Partial<Draft>) {
    setTouched(true)
    setDraft((current) => ({ ...current, ...next }))
  }

  const canContinue =
    step !== 1 ||
    Boolean(draft.name.trim() && draft.unitId && (draft.kind === 'variable' || draft.sku.trim()))
  const canSave =
    canContinue && (draft.kind === 'simple' || selectedAxes.length > 0)

  async function save() {
    if (!canSave) return
    const command: CreateProductCommand = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      brandId: draft.brandId || null,
      primaryCategoryId: draft.categoryId || null,
      unitOfMeasureId: draft.unitId,
      tracksInventory: false,
      ...(draft.kind === 'simple'
        ? {
            sku: draft.sku.trim(),
            barcode: draft.barcode.trim()
              ? { type: 'internal', value: draft.barcode.trim() }
              : null,
          }
        : {
            skuPrefix: draft.sku.trim() || undefined,
            axes: selectedAxes.map(({ attribute, valueIds }) => ({
              attributeDefinitionId: attribute.id,
              valueType: attribute.valueType,
              allowedOptionIds: valueIds,
            })),
          }),
    }
    await onSubmit(command)
    window.localStorage.removeItem(storageKey)
    setTouched(false)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <header className="border-b border-[var(--color-border-soft)] p-5">
          <ol aria-label="Progresso do cadastro" className="grid grid-cols-4 gap-2">
            {['Dados básicos', 'Classificação', 'Variantes', 'Resumo'].map((label, index) => {
              const position = index + 1
              return (
                <li key={label} aria-current={step === position ? 'step' : undefined}>
                  <div className={`h-1 rounded-full ${position <= step ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />
                  <span className="mt-2 block text-xs text-[var(--color-ink-muted)]">
                    {position}. {label}
                  </span>
                </li>
              )
            })}
          </ol>
        </header>

        <div className="min-h-[440px] p-5 sm:p-7">
          {step === 1 ? (
            <BasicStep draft={draft} units={units} categories={categories} brands={brands} update={update} />
          ) : null}
          {step === 2 ? (
            <ClassificationStep
              draft={draft}
              categories={categories}
              brands={brands}
              attributes={attributes}
              update={update}
            />
          ) : null}
          {step === 3 ? (
            <VariantsStep
              draft={draft}
              attributes={attributes}
              combinations={combinations}
              update={update}
            />
          ) : null}
          {step === 4 ? (
            <SummaryStep
              draft={draft}
              categories={categories}
              brands={brands}
              selectedAxes={selectedAxes}
              variantCount={draft.kind === 'simple' ? 1 : combinations.length}
            />
          ) : null}
          {error ? <p role="alert" className="mt-5 text-sm text-[var(--color-danger)]">{error}</p> : null}
        </div>

        <footer className="flex flex-wrap justify-between gap-3 border-t border-[var(--color-border-soft)] p-5">
          <Button type="button" variant="secondary" onClick={step === 1 ? onCancel : () => setStep(step - 1)}>
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          {step < 4 ? (
            <Button type="button" disabled={!canContinue} onClick={() => setStep(step + 1)}>
              Continuar
            </Button>
          ) : (
            <Button type="button" disabled={!canSave || submitting} onClick={() => void save()}>
              {submitting ? 'Salvando…' : 'Criar produto'}
            </Button>
          )}
        </footer>
      </section>

      <aside className="h-fit rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5 xl:sticky xl:top-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">Resumo</p>
        <h2 className="mt-3 text-lg font-semibold">{draft.name || 'Novo produto'}</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <SummaryRow label="Tipo" value={draft.kind === 'simple' ? 'Simples' : 'Variável'} />
          <SummaryRow label="Categoria" value={categories.find((item) => item.id === draft.categoryId)?.name ?? 'Não definida'} />
          <SummaryRow label="Marca" value={brands.find((item) => item.id === draft.brandId)?.name ?? 'Não definida'} />
          <SummaryRow label="Status" value="Rascunho" />
          <SummaryRow label="Variantes" value={String(draft.kind === 'simple' ? 1 : combinations.length)} />
        </dl>
        <p className="mt-5 text-xs text-[var(--color-ink-muted)]">
          Rascunho salvo neste dispositivo. Estoque e preços não fazem parte deste cadastro.
        </p>
      </aside>
    </div>
  )
}

function BasicStep({ draft, units, categories, brands, update }: {
  draft: Draft
  units: UnitOfMeasureResponse[]
  categories: CategoryResponse[]
  brands: BrandResponse[]
  update: (next: Partial<Draft>) => void
}) {
  return (
    <div className="space-y-6">
      <StepHeading title="Dados básicos" description="Identificação operacional do produto e de sua variante padrão." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" required><input autoFocus className={fieldClass} value={draft.name} onChange={(e) => update({ name: e.target.value })} /></Field>
        <Field label={draft.kind === 'simple' ? 'SKU' : 'Prefixo de SKU'} required={draft.kind === 'simple'}><input className={fieldClass} value={draft.sku} onChange={(e) => update({ sku: e.target.value })} /></Field>
        <Field label="Tipo">
          <select className={fieldClass} value={draft.kind} onChange={(e) => update({ kind: e.target.value as ProductKind })}>
            <option value="simple">Produto simples</option><option value="variable">Produto variável</option>
          </select>
        </Field>
        <Field label="Unidade" required>
          <select className={fieldClass} value={draft.unitId} onChange={(e) => update({ unitId: e.target.value })}>
            <option value="">Selecione</option>{units.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </Field>
        {draft.kind === 'simple' ? <Field label="Código de barras"><input className={fieldClass} value={draft.barcode} onChange={(e) => update({ barcode: e.target.value })} /></Field> : null}
        <Field label="Categoria"><select className={fieldClass} value={draft.categoryId} onChange={(e) => update({ categoryId: e.target.value })}><option value="">Sem categoria</option>{categories.filter((x) => x.status === 'active').map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
        <Field label="Marca"><select className={fieldClass} value={draft.brandId} onChange={(e) => update({ brandId: e.target.value })}><option value="">Sem marca</option>{brands.filter((x) => x.status === 'active').map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
      </div>
      <Field label="Descrição"><textarea className={`${fieldClass} min-h-28 py-3`} value={draft.description} onChange={(e) => update({ description: e.target.value })} /></Field>
    </div>
  )
}

function ClassificationStep({ draft, categories, brands, attributes, update }: {
  draft: Draft
  categories: CategoryResponse[]
  brands: BrandResponse[]
  attributes: AttributeResponse[]
  update: (next: Partial<Draft>) => void
}) {
  return (
    <div className="space-y-6">
      <StepHeading title="Classificação" description="Organize o catálogo usando categorias, marcas e atributos canônicos." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoria"><select className={fieldClass} value={draft.categoryId} onChange={(e) => update({ categoryId: e.target.value })}><option value="">Sem categoria</option>{categories.filter((x) => x.status === 'active').map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
        <Field label="Marca"><select className={fieldClass} value={draft.brandId} onChange={(e) => update({ brandId: e.target.value })}><option value="">Sem marca</option>{brands.filter((x) => x.status === 'active').map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Atributos disponíveis</h3>
        {attributes.filter((item) => item.status === 'active').length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">Nenhum atributo ativo cadastrado.</p> : attributes.filter((item) => item.status === 'active').map((attribute) => (
          <div key={attribute.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] p-4">
            <div className="flex items-center justify-between gap-3"><strong className="text-sm">{attribute.name}</strong><span className="text-xs text-[var(--color-ink-muted)]">{attribute.isVariantAxis ? 'Eixo de variante' : 'Classificação'}</span></div>
            <div className="mt-3 flex flex-wrap gap-2">
              {attribute.values.filter((value) => value.status === 'active').map((value) => {
                const checked = draft.selections[attribute.id]?.includes(value.id) ?? false
                return <label key={value.id} className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs"><input type="checkbox" checked={checked} onChange={() => update({ selections: { ...draft.selections, [attribute.id]: checked ? (draft.selections[attribute.id] ?? []).filter((id) => id !== value.id) : [...(draft.selections[attribute.id] ?? []), value.id] } })} />{value.label}</label>
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VariantsStep({ draft, attributes, combinations, update }: {
  draft: Draft
  attributes: AttributeResponse[]
  combinations: string[]
  update: (next: Partial<Draft>) => void
}) {
  if (draft.kind === 'simple') return <div className="space-y-4"><StepHeading title="Variante padrão" description="Produtos simples recebem automaticamente uma variante padrão pelo domínio." /><div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-5"><strong>{draft.name || 'Produto'}</strong><p className="mt-1 text-sm text-[var(--color-ink-muted)]">SKU {draft.sku || 'não informado'}</p></div></div>
  return (
    <div className="space-y-6">
      <StepHeading title="Variantes" description="Escolha valores dos eixos e revise as combinações antes de salvar." />
      {attributes.filter((item) => item.isVariantAxis && item.status === 'active').map((attribute) => (
        <div key={attribute.id}><p className="mb-2 text-sm font-semibold">{attribute.name}</p><div className="flex flex-wrap gap-2">{attribute.values.filter((value) => value.status === 'active').map((value) => { const checked = draft.selections[attribute.id]?.includes(value.id) ?? false; return <label key={value.id} className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm"><input type="checkbox" checked={checked} onChange={() => update({ selections: { ...draft.selections, [attribute.id]: checked ? (draft.selections[attribute.id] ?? []).filter((id) => id !== value.id) : [...(draft.selections[attribute.id] ?? []), value.id] } })} />{value.label}</label> })}</div></div>
      ))}
      <div><h3 className="text-sm font-semibold">{combinations.length} combinações</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{combinations.map((item) => <div key={item} className="rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm">{item}</div>)}</div></div>
    </div>
  )
}

function SummaryStep({ draft, categories, brands, selectedAxes, variantCount }: {
  draft: Draft
  categories: CategoryResponse[]
  brands: BrandResponse[]
  selectedAxes: Array<{ attribute: AttributeResponse; valueIds: string[] }>
  variantCount: number
}) {
  return <div className="space-y-6"><StepHeading title="Revise o produto" description="Confirme a estrutura antes da criação. Estoque e preço serão tratados nos workspaces próprios." /><dl className="grid gap-4 sm:grid-cols-2"><SummaryCard label="Produto" value={draft.name} /><SummaryCard label="Tipo" value={draft.kind === 'simple' ? 'Simples' : 'Variável'} /><SummaryCard label="Categoria" value={categories.find((x) => x.id === draft.categoryId)?.name ?? 'Não definida'} /><SummaryCard label="Marca" value={brands.find((x) => x.id === draft.brandId)?.name ?? 'Não definida'} /><SummaryCard label="Variantes" value={String(variantCount)} /><SummaryCard label="Status inicial" value="Rascunho" /></dl>{selectedAxes.length ? <div><h3 className="text-sm font-semibold">Atributos</h3><ul className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">{selectedAxes.map(({ attribute, valueIds }) => <li key={attribute.id}><strong className="text-[var(--color-ink)]">{attribute.name}:</strong> {valueIds.map((id) => attribute.values.find((value) => value.id === id)?.label).join(', ')}</li>)}</ul></div> : null}</div>
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block space-y-1.5 text-sm font-medium">{label}{required ? <span aria-hidden="true"> *</span> : null}{children}</label> }
function StepHeading({ title, description }: { title: string; description: string }) { return <div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-[var(--color-ink-muted)]">{description}</p></div> }
function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-3"><dt className="text-[var(--color-ink-muted)]">{label}</dt><dd className="text-right font-medium">{value}</dd></div> }
function SummaryCard({ label, value }: { label: string; value: string }) { return <div className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] p-4"><dt className="text-xs text-[var(--color-ink-muted)]">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div> }
