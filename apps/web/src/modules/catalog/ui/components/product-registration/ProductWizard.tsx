import { isValidElement, useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import type {
  AttributeResponse,
  BrandResponse,
  CategoryResponse,
  PriceListResponse,
  UnitOfMeasureResponse,
} from '#/modules/catalog/application'
import type { ProductCreationCommand } from '#/modules/catalog/application/product-creation-contract'

type ProductKind = 'simple' | 'variable'
type Branch = { id: string; name: string; code: string; isDefault: boolean }
type Location = { id: string; name: string; status: string; isDefault: boolean }
type Assignment = { attributeDefinitionId: string; optionId: string }
type VariantDraft = {
  id: string
  assignments: Assignment[]
  sku: string
  ean: string
  salePrice: string
  unitCost: string
  quantity: string
  branchId: string
  locationId: string
  status: 'active' | 'inactive'
}
type Draft = {
  name: string
  description: string
  unitId: string
  unitCode: string
  kind: ProductKind
  categoryId: string
  brandId: string
  priceListId: string
  branchId: string
  locationId: string
  variants: VariantDraft[]
  idempotencyKey: string
}
type StoredDraft = { version: 3; step: number; draft: Draft }

const fieldClass =
  'h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-focus)]'

function newId() {
  return globalThis.crypto.randomUUID()
}

function emptyVariant(defaults?: Partial<VariantDraft>): VariantDraft {
  return {
    id: newId(),
    assignments: [],
    sku: '',
    ean: '',
    salePrice: '',
    unitCost: '',
    quantity: '0',
    branchId: '',
    locationId: '',
    status: 'active',
    ...defaults,
  }
}

function emptyDraft(): Draft {
  return {
    name: '',
    description: '',
    unitId: '',
    unitCode: '',
    kind: 'simple',
    categoryId: '',
    brandId: '',
    priceListId: '',
    branchId: '',
    locationId: '',
    variants: [emptyVariant()],
    idempotencyKey: newId(),
  }
}

function readDraft(key: string): StoredDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? 'null') as
      | StoredDraft
      | null
    if (!value?.draft || value.step < 1 || value.step > 4) return null
    if (value.version === 3) return value
    // Attribute preselection was part of the previous UI only. Existing
    // operational variant data remains valid when restoring older drafts.
    return {
      version: 3,
      step: value.step,
      draft: value.draft,
    }
  } catch {
    window.localStorage.removeItem(key)
    return null
  }
}

function numberValue(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function moneyPayload(value: string): string {
  const parsed = numberValue(value)
  return parsed == null ? '' : parsed.toFixed(2)
}

function derivedMargin(sale: string, cost: string): number | null {
  const saleValue = numberValue(sale)
  const costValue = numberValue(cost)
  if (saleValue == null || costValue == null || saleValue <= 0) return null
  return Number((((saleValue - costValue) / saleValue) * 100).toFixed(2))
}

function formatMoney(value: string): string {
  const number = numberValue(value)
  return number == null
    ? '—'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number)
}

/** Creates the checksum digit for a 12-digit EAN-13 base. */
export function buildEan13(base: string): string {
  const digits = base.replace(/\D/g, '').slice(0, 12)
  if (digits.length !== 12) throw new Error('EAN-13 requires 12 base digits.')
  const sum = [...digits].reduce(
    (total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0,
  )
  return `${digits}${(10 - (sum % 10)) % 10}`
}

function generateEan13(): string {
  const random = new Uint32Array(1)
  globalThis.crypto.getRandomValues(random)
  // Prefix 2 identifies an internal, non-GS1 assignment. The check digit is
  // calculated so manual scanners and EAN validators can read the value.
  return buildEan13(`2${String(random[0]).padStart(11, '0').slice(-11)}`)
}

/** Legacy pure helper retained for existing combination-preview coverage. */
export function buildVariantCombinationLabels(axes: Array<{ labels: string[] }>): string[] {
  if (axes.length === 0) return []
  return axes.reduce<string[]>(
    (rows, axis) =>
      rows.flatMap((row) =>
        axis.labels.map((label) => (row ? `${row} / ${label}` : label)),
      ),
    [''],
  )
}

function variantLabel(variant: VariantDraft, attributes: AttributeResponse[]) {
  const labels = variant.assignments
    .map((assignment) => {
      const attribute = attributes.find((item) => item.id === assignment.attributeDefinitionId)
      const option = attribute?.values.find((value) => value.id === assignment.optionId)
      return option ? `${attribute?.name ?? 'Atributo'}: ${option.label}` : null
    })
    .filter((label): label is string => label != null)
  return labels.length ? labels.join(' · ') : 'Variante sem atributos'
}

export function ProductWizard({
  organizationId,
  actorId,
  brands,
  categories,
  attributes,
  units,
  priceLists,
  branches,
  locations,
  unitsError,
  submitting,
  error,
  onSubmit,
  onCancel,
}: {
  organizationId: string
  actorId: string
  brands: BrandResponse[]
  categories: CategoryResponse[]
  attributes: AttributeResponse[]
  units: UnitOfMeasureResponse[]
  priceLists: PriceListResponse[]
  branches: Branch[]
  locations: Location[]
  unitsError?: string | null
  submitting: boolean
  error: string | null
  onSubmit: (command: ProductCreationCommand, idempotencyKey: string) => Promise<void>
  onCancel: () => void
}) {
  const storageKey = `catalog-product-wizard:v3:${organizationId}:${actorId}`
  const [restored] = useState(() => readDraft(storageKey))
  const [step, setStep] = useState(restored?.step ?? 1)
  const [draft, setDraft] = useState<Draft>(() => restored?.draft ?? emptyDraft())
  const [dirty, setDirty] = useState(Boolean(restored))
  const [removing, setRemoving] = useState<string | null>(null)

  function update(next: Partial<Draft>) {
    setDirty(true)
    setDraft((current) => ({ ...current, ...next }))
  }

  useEffect(() => {
    if (!draft.unitId && units[0]) update({ unitId: units[0].id, unitCode: units[0].code })
  }, [units])
  useEffect(() => {
    const defaultBranchId =
      branches.find((branch) => branch.isDefault)?.id ?? branches[0]?.id
    if (!defaultBranchId) return

    setDraft((current) => {
      const branchId = branches.some((branch) => branch.id === current.branchId)
        ? current.branchId
        : defaultBranchId
      const variants = current.variants.map((variant) => ({
        ...variant,
        branchId: branches.some((branch) => branch.id === variant.branchId)
          ? variant.branchId
          : branchId,
      }))
      const changed =
        branchId !== current.branchId ||
        variants.some((variant, index) => variant.branchId !== current.variants[index]?.branchId)
      if (!changed) return current
      setDirty(true)
      return { ...current, branchId, variants }
    })
  }, [branches])
  useEffect(() => {
    const activePriceLists = priceLists.filter((list) => list.status === 'active')
    if (!activePriceLists.length) return
    setDraft((current) => {
      if (activePriceLists.some((list) => list.id === current.priceListId)) return current
      setDirty(true)
      return {
        ...current,
        priceListId:
          activePriceLists.find((list) => list.isDefault)?.id ?? activePriceLists[0].id,
      }
    })
  }, [priceLists])
  useEffect(() => {
    const activeLocations = locations.filter((location) => location.status === 'active')
    const defaultLocationId =
      activeLocations.find((location) => location.isDefault)?.id ?? activeLocations[0]?.id
    if (!defaultLocationId) return

    setDraft((current) => {
      const hasLocation = (locationId: string) =>
        activeLocations.some((location) => location.id === locationId)
      const locationId = hasLocation(current.locationId)
        ? current.locationId
        : defaultLocationId
      const variants = current.variants.map((variant) => ({
        ...variant,
        locationId: hasLocation(variant.locationId) ? variant.locationId : locationId,
      }))
      const changed =
        locationId !== current.locationId ||
        variants.some((variant, index) => variant.locationId !== current.variants[index]?.locationId)
      if (!changed) return current
      setDirty(true)
      return { ...current, locationId, variants }
    })
  }, [locations])
  useEffect(() => {
    if (dirty) {
      window.localStorage.setItem(storageKey, JSON.stringify({ version: 3, step, draft }))
    }
  }, [dirty, draft, step, storageKey])

  const activeAttributes = useMemo(
    () => attributes.filter((attribute) => attribute.status === 'active'),
    [attributes],
  )
  const variants = draft.kind === 'simple' ? draft.variants.slice(0, 1) : draft.variants
  const duplicateCombinations = useMemo(() => {
    const seen = new Set<string>()
    const duplicates = new Set<string>()
    for (const variant of variants) {
      const key = [...variant.assignments]
        .sort((left, right) => left.attributeDefinitionId.localeCompare(right.attributeDefinitionId))
        .map((assignment) => `${assignment.attributeDefinitionId}:${assignment.optionId}`)
        .join('|')
      if (key && seen.has(key)) duplicates.add(variant.id)
      if (key) seen.add(key)
    }
    return duplicates
  }, [variants])
  const variantErrors = useMemo(
    () =>
      variants.flatMap((variant) =>
        validateVariant(
          variant,
          draft.kind,
          duplicateCombinations.has(variant.id),
          draft.branchId,
          draft.locationId,
        ),
      ),
    [
      duplicateCombinations,
      draft.branchId,
      draft.kind,
      draft.locationId,
      variants,
    ],
  )
  const attributesValid = true
  const canContinue =
    step === 1
      ? Boolean(draft.name.trim() && draft.unitId)
      : step === 2
        ? attributesValid
        : true
  const canSave = Boolean(
    draft.name.trim() &&
      draft.unitId &&
      draft.priceListId &&
      draft.branchId &&
      variants.length &&
      attributesValid &&
      variantErrors.length === 0,
  )

  function updateVariant(id: string, next: Partial<VariantDraft>) {
    update({
      variants: draft.variants.map((variant) =>
        variant.id === id ? { ...variant, ...next } : variant,
      ),
    })
  }

  function addVariant(copy?: VariantDraft) {
    const next = emptyVariant(
      copy
        ? {
            assignments: copy.assignments.map((assignment) => ({ ...assignment })),
            salePrice: copy.salePrice,
            unitCost: copy.unitCost,
            quantity: '0',
            branchId: copy.branchId || draft.branchId,
            locationId: copy.locationId || draft.locationId,
          }
        : { branchId: draft.branchId, locationId: draft.locationId },
    )
    update({ variants: [...draft.variants, next] })
  }

  function removeVariant(id: string) {
    if (draft.kind !== 'variable' || draft.variants.length <= 1) return
    if (removing !== id) {
      setRemoving(id)
      return
    }
    update({ variants: draft.variants.filter((variant) => variant.id !== id) })
    setRemoving(null)
  }

  function changeKind(kind: ProductKind) {
    const initial = draft.variants[0] ?? emptyVariant()
    update({
      kind,
      variants: kind === 'simple' ? [{ ...initial, assignments: [] }] : draft.variants,
    })
  }

  async function save() {
    if (!canSave || submitting) return
    const command: ProductCreationCommand = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      unitOfMeasureId: draft.unitId,
      brandId: draft.brandId || null,
      categoryId: draft.categoryId || null,
      branchId: draft.branchId,
      priceListId: draft.priceListId,
      topology: draft.kind,
      variants: variants.map((variant, index) => ({
        identityKey: variant.id,
        sku: variant.sku.trim(),
        ean: variant.ean.trim() ? { type: 'EAN_13', value: variant.ean.trim() } : null,
        salePrice: moneyPayload(variant.salePrice),
        initialQuantity: String(numberValue(variant.quantity) ?? 0),
        unitCost: variant.unitCost.trim() ? moneyPayload(variant.unitCost) : null,
        allowZeroCost: numberValue(variant.unitCost) === 0,
        branchId: variant.branchId || draft.branchId,
        locationId: variant.locationId || draft.locationId || null,
        attributes: variant.assignments,
        isDefault: index === 0,
        tracksInventory: true,
      })),
    }
    await onSubmit(command, draft.idempotencyKey)
    window.localStorage.removeItem(storageKey)
    setDirty(false)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <header className="border-b border-[var(--color-border-soft)] p-5">
          <ol aria-label="Progresso do cadastro" className="grid grid-cols-4 gap-2">
            {['Dados básicos', 'Classificação', 'Variantes', 'Resumo'].map((label, index) => (
              <li key={label} aria-current={step === index + 1 ? 'step' : undefined}>
                <div className={`h-1 rounded-full ${index + 1 <= step ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />
                <span className="mt-2 block text-xs text-[var(--color-ink-muted)]">
                  {index + 1}. {label}
                </span>
              </li>
            ))}
          </ol>
        </header>
        <div className="min-h-[470px] p-5 sm:p-7">
          {step === 1 && <BasicStep draft={draft} units={units} update={update} changeKind={changeKind} />}
          {step === 2 && (
            <ClassificationStep
              draft={draft}
              categories={categories}
              brands={brands}
              priceLists={priceLists}
              branches={branches}
              locations={locations}
              update={update}
            />
          )}
          {step === 3 && (
            <VariantsStep
              draft={draft}
              variants={variants}
              attributes={activeAttributes}
              branches={branches}
              locations={locations}
              errors={variantErrors}
              removing={removing}
              updateVariant={updateVariant}
              addVariant={addVariant}
              removeVariant={removeVariant}
            />
          )}
          {step === 4 && (
            <ReviewStep
              draft={draft}
              variants={variants}
              attributes={activeAttributes}
              categories={categories}
              brands={brands}
              priceLists={priceLists}
              errors={variantErrors}
              onStep={setStep}
            />
          )}
          {error && <p role="alert" className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">{friendlyError(error)}</p>}
          {unitsError && <p role="alert" className="mt-5 text-sm text-[var(--color-danger)]">{unitsError}</p>}
        </div>
        <footer className="flex flex-wrap justify-between gap-3 border-t border-[var(--color-border-soft)] p-5">
          <Button type="button" variant="secondary" onClick={step === 1 ? onCancel : () => setStep(step - 1)}>
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          {step < 4 ? (
            <Button type="button" disabled={!canContinue} onClick={() => setStep((current) => Math.min(4, current + 1))}>
              Continuar
            </Button>
          ) : (
            <Button type="button" disabled={!canSave || submitting} onClick={() => void save()}>
              {submitting ? 'Criando produto…' : 'Criar produto'}
            </Button>
          )}
        </footer>
      </section>
      <SummaryAside draft={draft} variants={variants} categories={categories} brands={brands} />
    </div>
  )
}

function BasicStep({ draft, units, update, changeKind }: { draft: Draft; units: UnitOfMeasureResponse[]; update: (next: Partial<Draft>) => void; changeKind: (kind: ProductKind) => void }) {
  const matched = units.find((unit) => unit.id === draft.unitId)
  function updateUnit(value: string) {
    const normalized = value.trim().toLowerCase()
    const match = units.find((unit) => unit.code.toLowerCase() === normalized || unit.name.toLowerCase() === normalized)
    update({ unitCode: value, unitId: match?.id ?? '' })
  }
  return <div className="space-y-6"><Heading title="Dados básicos" description="Identifique o produto e defina a sua unidade operacional." /><div className="grid gap-4 sm:grid-cols-2"><Field label="Nome do produto" required><input autoFocus className={fieldClass} value={draft.name} onChange={(event) => update({ name: event.target.value })} /></Field><Field label="Tipo"><select className={fieldClass} value={draft.kind} onChange={(event) => changeKind(event.target.value as ProductKind)}><option value="simple">Produto simples</option><option value="variable">Produto variável</option></select></Field><Field label="Unidade" required><input className={fieldClass} list="catalog-units" value={draft.unitCode || matched?.code || ''} onChange={(event) => updateUnit(event.target.value)} placeholder="UN, KG, MT, CX…" /><datalist id="catalog-units">{units.map((unit) => <option key={unit.id} value={unit.code} label={unit.name} />)}</datalist><p className="text-xs font-normal text-[var(--color-ink-muted)]">{matched ? `${matched.name} selecionada.` : 'Digite uma unidade cadastrada.'}</p></Field></div><Field label="Descrição"><textarea className={`${fieldClass} min-h-28 py-3`} value={draft.description} onChange={(event) => update({ description: event.target.value })} /></Field></div>
}

function ClassificationStep({ draft, categories, brands, priceLists, branches, locations, update }: { draft: Draft; categories: CategoryResponse[]; brands: BrandResponse[]; priceLists: PriceListResponse[]; branches: Branch[]; locations: Location[]; update: (next: Partial<Draft>) => void }) {
  const activeCategories = categories.filter((item) => item.status === 'active')
  const activeBrands = brands.filter((item) => item.status === 'active')
  const activeLists = priceLists.filter((item) => item.status === 'active')
  const activeLocations = locations.filter((item) => item.status !== 'archived')
  return <div className="space-y-7"><div><Heading title="Classificação" description="Defina categoria, marca e os padrões que serão usados ao iniciar as variantes." /><div className="mt-5 grid gap-4 sm:grid-cols-2"><SelectField label="Categoria" value={draft.categoryId} onChange={(categoryId) => update({ categoryId })} items={activeCategories.map((item) => ({ id: item.id, label: item.name }))} emptyText="Sem categorias ativas" configTo="/catalog/categories" /><SelectField label="Marca" value={draft.brandId} onChange={(brandId) => update({ brandId })} items={activeBrands.map((item) => ({ id: item.id, label: item.name }))} emptyText="Sem marcas ativas" configTo="/catalog/brands" /><SelectField label="Lista de preço" required value={draft.priceListId} onChange={(priceListId) => update({ priceListId })} items={activeLists.map((item) => ({ id: item.id, label: `${item.name}${item.isDefault ? ' · padrão' : ''}` }))} emptyText="Nenhuma lista de preço ativa" configTo="/catalog/pricing" /><SelectField label="Filial padrão" required value={draft.branchId} onChange={(branchId) => update({ branchId })} items={branches.map((item) => ({ id: item.id, label: `${item.name}${item.isDefault ? ' · padrão' : ''}` }))} emptyText="Nenhuma filial ativa" /><SelectField label="Localização padrão" value={draft.locationId} onChange={(locationId) => update({ locationId })} items={activeLocations.map((item) => ({ id: item.id, label: item.name }))} emptyText="Nenhuma localização ativa" configTo="/catalog/inventory" /></div></div><div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-ink-muted)]">{draft.kind === 'simple' ? 'Será criada uma única variante padrão. Atributos não são necessários.' : 'Na próxima etapa, crie cada variante e informe somente os atributos que formam aquela combinação.'}</div></div>
}

function VariantsStep({ draft, variants, attributes, branches, locations, errors, removing, updateVariant, addVariant, removeVariant }: { draft: Draft; variants: VariantDraft[]; attributes: AttributeResponse[]; branches: Branch[]; locations: Location[]; errors: string[]; removing: string | null; updateVariant: (id: string, next: Partial<VariantDraft>) => void; addVariant: (copy?: VariantDraft) => void; removeVariant: (id: string) => void }) {
  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><Heading title={draft.kind === 'simple' ? 'Variante padrão' : 'Variantes'} description={draft.kind === 'simple' ? 'Preencha os dados operacionais da única variante do produto.' : 'Comece por uma variante. Os atributos abaixo identificam apenas esta combinação.'} /><Button type="button" onClick={() => addVariant()} disabled={draft.kind === 'simple'}>+ Adicionar variante</Button></div><div className="space-y-4">{variants.map((variant, index) => <VariantCard key={variant.id} index={index} variant={variant} attributes={attributes} branches={branches} locations={locations} defaultBranch={draft.branchId} defaultLocation={draft.locationId} error={errors.find((item) => item.startsWith(`${variant.id}:`))} canRemove={draft.kind === 'variable' && variants.length > 1} removing={removing === variant.id} update={updateVariant} onDuplicate={() => addVariant(variant)} onRemove={() => removeVariant(variant.id)} />)}</div></div>
}

function VariantCard({ index, variant, attributes, branches, locations, defaultBranch, defaultLocation, error, canRemove, removing, update, onDuplicate, onRemove }: { index: number; variant: VariantDraft; attributes: AttributeResponse[]; branches: Branch[]; locations: Location[]; defaultBranch: string; defaultLocation: string; error?: string; canRemove: boolean; removing: boolean; update: (id: string, next: Partial<VariantDraft>) => void; onDuplicate: () => void; onRemove: () => void }) {
  const availableAttributes = attributes.filter((attribute) => attribute.values.some((value) => value.status === 'active'))
  const assigned = new Set(variant.assignments.map((assignment) => assignment.attributeDefinitionId))
  function setAssignment(attributeDefinitionId: string, optionId: string) { const remaining = variant.assignments.filter((assignment) => assignment.attributeDefinitionId !== attributeDefinitionId); update(variant.id, { assignments: optionId ? [...remaining, { attributeDefinitionId, optionId }] : remaining }) }
  return <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Variante {index + 1}</h3><p className="text-xs text-[var(--color-ink-muted)]">{variantLabel(variant, attributes)}</p></div><div className="flex gap-2"><Button type="button" size="sm" variant="secondary" onClick={onDuplicate}>Duplicar</Button>{canRemove && <Button type="button" size="sm" variant="secondary" onClick={onRemove}>{removing ? 'Confirmar remoção' : 'Remover'}</Button>}</div></div>{availableAttributes.length > 0 && <div className="mt-4 grid gap-3 md:grid-cols-2"><Field label="Adicionar atributo"><select className={fieldClass} value="" onChange={(event) => { const attribute = availableAttributes.find((item) => item.id === event.target.value); const option = attribute?.values.find((value) => value.status === 'active'); if (attribute && option) setAssignment(attribute.id, option.id) }}><option value="">Selecione um atributo</option>{availableAttributes.filter((attribute) => !assigned.has(attribute.id)).map((attribute) => <option key={attribute.id} value={attribute.id}>{attribute.name}</option>)}</select></Field>{variant.assignments.map((assignment) => { const attribute = attributes.find((item) => item.id === assignment.attributeDefinitionId); if (!attribute) return null; return <Field key={attribute.id} label={attribute.name}><select className={fieldClass} value={assignment.optionId} onChange={(event) => setAssignment(attribute.id, event.target.value)}><option value="">Selecione um valor</option>{attribute.values.filter((value) => value.status === 'active').map((value) => <option key={value.id} value={value.id}>{value.label}</option>)}</select></Field> })}</div>}<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Field label="SKU" required><input className={fieldClass} value={variant.sku} onChange={(event) => update(variant.id, { sku: event.target.value.toUpperCase().replace(/\s+/g, '-') })} placeholder="PREFIXO-G-PRETO" /></Field><Field label="EAN"><input className={fieldClass} value={variant.ean} onChange={(event) => update(variant.id, { ean: event.target.value.replace(/\D/g, '') })} inputMode="numeric" /></Field><Field label="Preço de venda" required><input className={fieldClass} value={variant.salePrice} onChange={(event) => update(variant.id, { salePrice: event.target.value })} inputMode="decimal" placeholder="0,00" /></Field><Field label="Custo unitário"><input className={fieldClass} value={variant.unitCost} onChange={(event) => update(variant.id, { unitCost: event.target.value })} inputMode="decimal" placeholder="0,00" /></Field><Field label="Margem"><output className={`${fieldClass} flex items-center bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]`}>{derivedMargin(variant.salePrice, variant.unitCost) == null ? (variant.salePrice ? 'Sem custo' : 'Sem base') : `${derivedMargin(variant.salePrice, variant.unitCost)?.toLocaleString('pt-BR')}%`}</output></Field><Field label="Quantidade inicial"><input className={fieldClass} value={variant.quantity} onChange={(event) => update(variant.id, { quantity: event.target.value.replace(/[^0-9]/g, '') })} inputMode="numeric" /></Field><Field label="Filial"><select className={fieldClass} value={variant.branchId || defaultBranch} onChange={(event) => update(variant.id, { branchId: event.target.value })}><option value="">Selecione</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></Field><Field label="Localização"><select className={fieldClass} value={variant.locationId || defaultLocation} onChange={(event) => update(variant.id, { locationId: event.target.value })}><option value="">Sem estoque inicial</option>{locations.filter((location) => location.status !== 'archived').map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></Field><Field label="Status"><select className={fieldClass} value={variant.status} onChange={(event) => update(variant.id, { status: event.target.value as 'active' | 'inactive' })}><option value="active">Ativa</option><option value="inactive">Inativa</option></select></Field></div>{error && <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">{error.slice(error.indexOf(':') + 1)}</p>}</article>
}

function ReviewStep({ draft, variants, attributes, categories, brands, priceLists, errors, onStep }: { draft: Draft; variants: VariantDraft[]; attributes: AttributeResponse[]; categories: CategoryResponse[]; brands: BrandResponse[]; priceLists: PriceListResponse[]; errors: string[]; onStep: (step: number) => void }) {
  const selectedPriceList = priceLists.find((item) => item.id === draft.priceListId)
  return <div className="space-y-6"><Heading title="Revisão final" description="Revise todos os dados antes de iniciar a transação de criação." /><div className="grid gap-3 sm:grid-cols-2"><Review label="Produto" value={draft.name} onEdit={() => onStep(1)} /><Review label="Classificação" value={`${categories.find((item) => item.id === draft.categoryId)?.name ?? 'Sem categoria'} · ${brands.find((item) => item.id === draft.brandId)?.name ?? 'Sem marca'}`} onEdit={() => onStep(2)} /><Review label="Lista de preço" value={selectedPriceList?.name ?? 'Não selecionada'} onEdit={() => onStep(2)} /><Review label="Variantes" value={`${variants.length} cadastrada(s)`} onEdit={() => onStep(3)} /></div>{!selectedPriceList && <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 p-4 text-sm text-[var(--color-danger)]">Uma lista de preço ativa é obrigatória para criar o produto. <button type="button" className="font-semibold underline" onClick={() => onStep(2)}>Selecionar lista de preço</button> ou <Link className="font-semibold underline" to="/catalog/pricing">criar uma lista</Link>.</div>}<div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-soft)]"><table className="min-w-full text-left text-sm"><thead className="border-b border-[var(--color-border-soft)] text-xs text-[var(--color-ink-muted)]"><tr><th className="p-3">Combinação</th><th className="p-3">SKU</th><th className="p-3">EAN</th><th className="p-3">Custo</th><th className="p-3">Venda</th><th className="p-3">Margem</th><th className="p-3">Qtd.</th></tr></thead><tbody>{variants.map((variant) => <tr key={variant.id} className="border-b border-[var(--color-border-soft)] last:border-0"><td className="p-3">{variantLabel(variant, attributes)}</td><td className="p-3">{variant.sku || '—'}</td><td className="p-3 font-mono">{variant.ean || '—'}</td><td className="p-3">{formatMoney(variant.unitCost)}</td><td className="p-3">{formatMoney(variant.salePrice)}</td><td className="p-3">{derivedMargin(variant.salePrice, variant.unitCost) == null ? 'Sem base' : `${derivedMargin(variant.salePrice, variant.unitCost)}%`}</td><td className="p-3">{variant.quantity || '0'}</td></tr>)}</tbody></table></div>{errors.length > 0 && <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 p-4 text-sm text-[var(--color-danger)]"><strong>Corrija antes de criar:</strong><ul className="mt-2 list-disc pl-5">{errors.map((item) => <li key={item}>{item.slice(item.indexOf(':') + 1)}</li>)}</ul></div>}</div>
}

function SummaryAside({ draft, variants, categories, brands }: { draft: Draft; variants: VariantDraft[]; categories: CategoryResponse[]; brands: BrandResponse[] }) { const selectedAttributes = new Set(variants.flatMap((variant) => variant.assignments.map((assignment) => assignment.attributeDefinitionId))).size; return <aside className="h-fit rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5 xl:sticky xl:top-5"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">Resumo</p><h2 className="mt-3 text-lg font-semibold">{draft.name || 'Novo produto'}</h2><dl className="mt-5 space-y-3 text-sm"><Row label="Tipo" value={draft.kind === 'simple' ? 'Simples' : 'Variável'} /><Row label="Categoria" value={categories.find((item) => item.id === draft.categoryId)?.name ?? 'Não definida'} /><Row label="Marca" value={brands.find((item) => item.id === draft.brandId)?.name ?? 'Não definida'} /><Row label="Atributos em uso" value={String(selectedAttributes)} /><Row label="Variantes cadastradas" value={String(variants.length)} /><Row label="Status" value={stepStatus(draft)} /></dl><p className="mt-5 text-xs text-[var(--color-ink-muted)]">Cada variante concentra sua combinação, preço, custo e quantidade inicial.</p></aside> }

function stepStatus(draft: Draft) { return draft.name.trim() && draft.unitId ? 'Em preenchimento' : 'Dados básicos pendentes' }
function validateVariant(variant: VariantDraft, kind: ProductKind, duplicate: boolean, defaultBranchId: string, defaultLocationId: string): string[] { const errors: string[] = []; const quantity = numberValue(variant.quantity) ?? 0; if (!variant.sku.trim()) errors.push('SKU é obrigatório.'); if (numberValue(variant.salePrice) == null || (numberValue(variant.salePrice) ?? -1) < 0) errors.push('Informe um preço de venda válido.'); if (numberValue(variant.unitCost) != null && (numberValue(variant.unitCost) ?? 0) < 0) errors.push('Custo unitário não pode ser negativo.'); if (!Number.isInteger(quantity) || quantity < 0) errors.push('Quantidade deve ser um inteiro não negativo.'); if (quantity > 0 && (!(variant.locationId || defaultLocationId) || !(variant.branchId || defaultBranchId))) errors.push('Selecione filial e localização para o saldo inicial.'); if (kind === 'variable' && variant.assignments.length === 0) errors.push('Selecione pelo menos um atributo.'); if (duplicate) errors.push('Combinação de atributos repetida.'); return errors.map((message) => `${variant.id}:${message}`) }
function friendlyError(error: string) { const map: Record<string, string> = { variant_sku_required: 'Informe o SKU de cada variante.', initial_price_required: 'Informe um preço de venda válido.', active_price_list_required: 'Selecione uma lista de preço ativa.', valid_branch_required: 'Selecione uma filial válida.', valid_stock_location_required: 'Selecione uma localização válida para o estoque inicial.', initial_quantity_invalid: 'A quantidade inicial é inválida.', initial_unit_cost_invalid: 'O custo inicial é inválido.', category_not_found: 'A categoria informada não é válida.', brand_not_found: 'A marca informada não é válida.', idempotency_key_payload_mismatch: 'Esta tentativa já foi enviada com dados diferentes. Atualize a página para iniciar uma nova tentativa.' }; return Object.entries(map).find(([key]) => error.includes(key))?.[1] ?? error }
function Heading({ title, description }: { title: string; description: string }) { return <div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-[var(--color-ink-muted)]">{description}</p></div> }
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  const eanInput =
    label === 'EAN' && isValidElement<{ onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void }>(children)
      ? children
      : null

  return (
    <label className="block space-y-1.5 text-sm font-medium">
      {label}
      {required ? <span aria-hidden="true"> *</span> : null}
      {eanInput ? (
        <div className="flex gap-2">
          {children}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            title="Gerar código EAN-13 válido"
            onClick={() =>
              eanInput.props.onChange?.({
                target: { value: generateEan13() },
              } as React.ChangeEvent<HTMLInputElement>)
            }
          >
            Gerar EAN
          </Button>
        </div>
      ) : (
        children
      )}
      {eanInput ? <p className="text-xs font-normal text-[var(--color-ink-muted)]">Digite manualmente ou gere um EAN-13.</p> : null}
    </label>
  )
}
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-3"><dt className="text-[var(--color-ink-muted)]">{label}</dt><dd className="text-right font-medium">{value}</dd></div> }
function Review({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) { return <div className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] p-3"><dt className="text-xs text-[var(--color-ink-muted)]">{label}</dt><dd className="mt-1 flex items-start justify-between gap-2 font-medium"><span>{value}</span><button type="button" className="text-xs text-[var(--color-accent)] hover:underline" onClick={onEdit}>Editar</button></dd></div> }
function SelectField({ label, required, value, onChange, items, emptyText, configTo }: { label: string; required?: boolean; value: string; onChange: (value: string) => void; items: Array<{ id: string; label: string }>; emptyText: string; configTo?: string }) { return <Field label={label} required={required}>{items.length ? <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}><option value="">Selecione</option>{items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select> : <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-3 text-sm text-[var(--color-ink-muted)]">{emptyText}{configTo && <> · <Link className="text-[var(--color-accent)] hover:underline" to={configTo as never}>Configurar</Link></>}</div>}</Field> }
