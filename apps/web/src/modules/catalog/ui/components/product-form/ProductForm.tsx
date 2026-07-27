import { useEffect, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type {
  BrandResponse,
  CategoryResponse,
  UnitOfMeasureResponse,
} from '#/modules/catalog/application'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { ButtonLoading } from '#/platform/loading'
import { dialogs } from '#/platform/dialogs'
import {
  createProductFormSchema,
  editProductFormSchema,
  type ProductFormValues,
} from '#/modules/catalog/ui/validation/product-form-schema'
import { mergeInitialFormValues } from '#/modules/catalog/ui/components/product-form/mappers'

const selectClassName =
  'h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13px] text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:opacity-[var(--opacity-disabled)]'

export function ProductForm({
  mode,
  initial,
  brands,
  categories,
  units,
  submitting,
  formError,
  serverFieldErrors,
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial?: Partial<ProductFormValues>
  brands: BrandResponse[]
  categories: CategoryResponse[]
  units: UnitOfMeasureResponse[]
  submitting?: boolean
  formError?: string | null
  serverFieldErrors?: Record<string, string>
  submitLabel?: string
  onSubmit: (values: ProductFormValues) => void | Promise<void>
  onCancel?: () => void
}) {
  const schema = mode === 'create' ? createProductFormSchema : editProductFormSchema
  const baselineRef = useRef(mergeInitialFormValues(initial))

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: mergeInitialFormValues(initial),
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!initial) return
    const next = mergeInitialFormValues(initial)
    baselineRef.current = next
    form.reset(next)
  }, [initial, form])

  useEffect(() => {
    if (!serverFieldErrors) return
    for (const [key, message] of Object.entries(serverFieldErrors)) {
      form.setError(key as keyof ProductFormValues, { type: 'server', message })
    }
    const first = Object.keys(serverFieldErrors)[0] as
      | keyof ProductFormValues
      | undefined
    if (first) void form.setFocus(first)
  }, [serverFieldErrors, form])

  const isDirty = form.formState.isDirty

  async function handleCancel() {
    if (!onCancel) return
    if (!isDirty || submitting) {
      onCancel()
      return
    }
    const result = await dialogs.confirm({
      title: 'Descartar alterações?',
      description: 'As mudanças não salvas serão perdidas.',
      confirmLabel: 'Descartar',
      tone: 'danger',
    })
    if (result.confirmed) onCancel()
  }

  return (
    <form
      className="max-w-4xl space-y-5"
      aria-busy={submitting || undefined}
      onSubmit={form.handleSubmit(async (values) => {
        if (submitting) return
        await onSubmit(values)
      })}
      noValidate
    >
      {formError ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {formError}
        </p>
      ) : null}

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5">
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">
            Identificação
          </h2>
          <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
            Informações principais usadas em catálogo, estoque e operações.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Nome *"
            error={form.formState.errors.name?.message}
          >
            <Input
              {...form.register('name')}
              disabled={submitting}
              autoFocus={mode === 'create'}
            />
          </FormField>
          <FormField label="Tipo">
            <Input value="Produto simples" readOnly aria-readonly />
          </FormField>
          <FormField label="SKU *" error={form.formState.errors.sku?.message}>
          <Input
            {...form.register('sku')}
            disabled={submitting || mode === 'edit'}
            autoCapitalize="characters"
            readOnly={mode === 'edit'}
            aria-readonly={mode === 'edit' || undefined}
          />
          </FormField>
          <FormField
            label="Código de barras"
            error={form.formState.errors.barcode?.message}
          >
            <Input
              {...form.register('barcode')}
              disabled={submitting || mode === 'edit'}
              readOnly={mode === 'edit'}
              aria-readonly={mode === 'edit' || undefined}
            />
          </FormField>
          <FormField
            label="Unidade *"
            error={form.formState.errors.unitOfMeasureId?.message}
          >
            <select
              className={selectClassName}
              disabled={submitting || mode === 'edit'}
              {...form.register('unitOfMeasureId')}
            >
              <option value="">Selecione…</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.code} — {unit.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Status"
          >
            <Input
              value={mode === 'create' ? 'Rascunho' : 'Gerenciado no workspace'}
              readOnly
              aria-readonly
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5">
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">
            Classificação
          </h2>
          <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
            Organize o produto para busca, relatórios e navegação.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Marca"
            error={form.formState.errors.brandId?.message}
          >
          <select
            className={selectClassName}
            disabled={submitting}
            {...form.register('brandId')}
          >
            <option value="">Nenhuma</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          </FormField>
          <FormField
            label="Categoria / Subcategoria"
            error={form.formState.errors.primaryCategoryId?.message}
          >
          <select
            className={selectClassName}
            disabled={submitting}
            {...form.register('primaryCategoryId')}
          >
            <option value="">Nenhuma</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          </FormField>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-4 text-[15px] font-semibold text-[var(--color-ink)]">
          Descrição
        </h2>
        <FormField
          label="Descrição completa"
          error={form.formState.errors.description?.message}
        >
          <Textarea
            {...form.register('description')}
            disabled={submitting}
            rows={6}
          />
        </FormField>
      </section>

      {mode === 'create' ? (
        <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-[13px] text-[var(--color-ink)]">
          <input
            type="checkbox"
            className="size-4 rounded border-[var(--color-border)]"
            disabled={submitting}
            {...form.register('tracksInventory')}
          />
          Controla estoque
        </label>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? <ButtonLoading label="Salvando…" /> : submitLabel}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={() => void handleCancel()}
          >
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
