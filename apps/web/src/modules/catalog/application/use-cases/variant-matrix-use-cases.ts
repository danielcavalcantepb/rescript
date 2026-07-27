import type {
  AddVariantAxisCommand,
  AddVariantOptionCommand,
  ApplyVariantCombinationsCommand,
  ApplyVariantCombinationsResponse,
  DefineVariantAxesCommand,
  PreviewVariantCombinationsCommand,
  ProductVariantsResponse,
  RemoveVariantAxisCommand,
  RemoveVariantOptionCommand,
  UpdateVariantOptionCommand,
  VariantAxisDraft,
  VariantAxisResponse,
  VariantCombinationsPreviewResponse,
  VariantResponse,
  ListProductVariantsQuery,
} from '#/modules/catalog/application/dto'
import {
  CatalogConflictError,
  CatalogNotFoundError,
  CatalogPermissionError,
  CatalogValidationError,
  throwIfDomainError,
} from '#/modules/catalog/application/errors'
import {
  requireVariantConfigure,
  requireVariantRead,
  type CatalogAppDeps,
} from '#/modules/catalog/application/deps'
import { toProductResponse, toVariantResponse } from '#/modules/catalog/application/mappers'
import {
  COMBINATION_LIMITS,
  combinationHash,
  VariantCombinationPolicy,
} from '#/modules/catalog/domain/policies/combination-policy'
import { IdentifierPolicy } from '#/modules/catalog/domain/policies/identifier-policy'
import { ProductTopologyPolicy } from '#/modules/catalog/domain/policies/topology-policy'
import { createAttributeDefinition } from '#/modules/catalog/domain/factories/taxonomy-factory'
import { createNamedLabel } from '#/modules/catalog/domain/value-objects/normalized-name'
import { createSku } from '#/modules/catalog/domain/value-objects/sku'
import { createQuantity } from '#/modules/catalog/domain/value-objects/quantity'
import type { CatalogDomainEvent } from '#/modules/catalog/domain/events'
import type {
  AttributeDefinition,
  AttributeOption,
  Product,
  ProductVariant,
  ProductVariantAxis,
  VariantAttributeValue,
} from '#/modules/catalog/domain/types'

/** Soft UX threshold — server still enforces COMBINATION_LIMITS.maxCombinationsPerProduct. */
export const VARIANT_SOFT_CONFIRM_ABOVE = 24

type ResolvedAxis = {
  definition: AttributeDefinition
  axis: ProductVariantAxis
}

async function loadProduct(deps: CatalogAppDeps, productId: string) {
  const product = await deps.products.getById(deps.organizationId, productId)
  if (!product) throw new CatalogNotFoundError('product_not_found')
  return product
}

function assertProductMutable(product: Product) {
  if (product.status === 'archived') {
    throw new CatalogPermissionError('product_archived')
  }
}

function validateAxisDrafts(axes: VariantAxisDraft[]) {
  if (axes.length > COMBINATION_LIMITS.maxAxes) {
    throw new CatalogValidationError({
      axes: `Máximo de ${COMBINATION_LIMITS.maxAxes} eixos por produto.`,
    })
  }
  const seenNames = new Set<string>()
  for (const draft of axes) {
    const name = createNamedLabel(draft.name, { max: 120 }, 'Informe o nome do eixo.')
    if (!name.ok) {
      throw new CatalogValidationError({ name: name.error.message })
    }
    if (seenNames.has(name.value.normalizedName)) {
      throw new CatalogValidationError({
        name: 'Nomes de eixo não podem se repetir no mesmo produto.',
      })
    }
    seenNames.add(name.value.normalizedName)
    if (!draft.options?.length) {
      throw new CatalogValidationError({
        options: 'Cada eixo deve ter ao menos uma opção.',
      })
    }
    const seenOpts = new Set<string>()
    for (const opt of draft.options) {
      const label = createNamedLabel(opt, { max: 120 }, 'Informe a opção.')
      if (!label.ok) {
        throw new CatalogValidationError({ options: label.error.message })
      }
      if (seenOpts.has(label.value.normalizedName)) {
        throw new CatalogValidationError({
          options: `Opção duplicada no eixo "${name.value.name}".`,
        })
      }
      seenOpts.add(label.value.normalizedName)
    }
  }
}

/**
 * Resolve draft axes into AttributeDefinitions (find-or-create by normalized name)
 * and ProductVariantAxis allow-lists. Persists attribute changes.
 */
async function resolveAndPersistAxes(
  deps: CatalogAppDeps,
  drafts: VariantAxisDraft[],
): Promise<ResolvedAxis[]> {
  validateAxisDrafts(drafts)
  const resolved: ResolvedAxis[] = []

  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i]!
    const nameLabel = throwIfDomainError(
      createNamedLabel(draft.name, { max: 120 }, 'Informe o nome do eixo.'),
    )
    let definition = await deps.attributes.findByNormalizedName(
      deps.organizationId,
      nameLabel.normalizedName,
    )

    if (!definition) {
      const created = throwIfDomainError(
        createAttributeDefinition(
          deps.organizationId,
          nameLabel.name,
          'option',
          draft.options,
          () => deps.ids.next(),
        ),
      )
      await deps.attributes.save(created)
      definition = created
    } else {
      if (definition.valueType !== 'option') {
        throw new CatalogConflictError(
          'Eixos de variante aceitam apenas atributos do tipo option.',
        )
      }
      definition = await mergeOptionsOntoDefinition(deps, definition, draft.options)
    }

    const allowedOptionIds: string[] = []
    for (const optLabel of draft.options) {
      const normalized = throwIfDomainError(
        createNamedLabel(optLabel, { max: 120 }, 'Informe a opção.'),
      ).normalizedName
      const option = definition.options.find(
        (o) => o.normalizedLabel === normalized && o.status !== 'archived',
      )
      if (!option) {
        throw new CatalogConflictError(
          `Opção "${optLabel}" não encontrada no eixo "${definition.name}".`,
        )
      }
      allowedOptionIds.push(option.id)
    }

    resolved.push({
      definition,
      axis: {
        attributeDefinitionId: definition.id,
        allowedOptionIds,
        sortOrder: i,
      },
    })
  }

  return resolved
}

async function mergeOptionsOntoDefinition(
  deps: CatalogAppDeps,
  definition: AttributeDefinition,
  optionLabels: string[],
): Promise<AttributeDefinition> {
  const options = [...definition.options]
  let nextSort =
    options.reduce((max, o) => Math.max(max, o.sortOrder), -1) + 1

  for (const raw of optionLabels) {
    const label = throwIfDomainError(
      createNamedLabel(raw, { max: 120 }, 'Informe a opção.'),
    )
    const existing = options.find((o) => o.normalizedLabel === label.normalizedName)
    if (existing) {
      if (existing.status === 'archived') {
        existing.status = 'active'
      }
      existing.label = label.name
      continue
    }
    options.push({
      id: deps.ids.next(),
      definitionId: definition.id,
      label: label.name,
      normalizedLabel: label.normalizedName,
      status: 'active',
      sortOrder: nextSort,
    })
    nextSort += 1
  }

  const next: AttributeDefinition = { ...definition, options }
  await deps.attributes.save(next)
  return next
}

function toAxisResponses(resolved: ResolvedAxis[]): VariantAxisResponse[] {
  return resolved.map(({ definition, axis }) => ({
    attributeDefinitionId: axis.attributeDefinitionId,
    name: definition.name,
    sortOrder: axis.sortOrder,
    options: axis.allowedOptionIds.map((optionId, index) => {
      const opt = definition.options.find((o) => o.id === optionId)
      return {
        id: optionId,
        label: opt?.label ?? optionId,
        sortOrder: index,
        status: opt?.status ?? 'active',
      }
    }),
  }))
}

async function loadResolvedAxesFromProduct(
  deps: CatalogAppDeps,
  product: Product,
): Promise<ResolvedAxis[]> {
  const resolved: ResolvedAxis[] = []
  const ordered = [...product.axes].sort((a, b) => a.sortOrder - b.sortOrder)
  for (const axis of ordered) {
    const definition = await deps.attributes.getById(
      deps.organizationId,
      axis.attributeDefinitionId,
    )
    if (!definition) {
      throw new CatalogNotFoundError('attribute_definition_not_found')
    }
    resolved.push({ definition, axis })
  }
  return resolved
}

function combinationLabel(
  values: readonly VariantAttributeValue[],
  resolved: ResolvedAxis[],
): string {
  if (values.length === 0) return 'Padrão'
  const ordered = [...resolved].sort((a, b) => a.axis.sortOrder - b.axis.sortOrder)
  const parts: string[] = []
  for (const { definition, axis } of ordered) {
    const value = values.find(
      (v) => v.attributeDefinitionId === axis.attributeDefinitionId,
    )
    if (!value) continue
    const opt = definition.options.find((o) => o.id === value.optionId)
    parts.push(opt?.label ?? value.optionId)
  }
  return parts.join(' / ')
}

/** Stable key for UI selection — independent of attribute/option persistence ids. */
export function combinationSelectionKey(
  values: readonly VariantAttributeValue[],
  resolved: ResolvedAxis[],
): string {
  if (values.length === 0) return 'default'
  return [...resolved]
    .map(({ definition, axis }) => {
      const value = values.find(
        (v) => v.attributeDefinitionId === axis.attributeDefinitionId,
      )
      const opt = definition.options.find((o) => o.id === value?.optionId)
      return `${definition.normalizedName}=${opt?.normalizedLabel ?? ''}`
    })
    .sort((a, b) => a.localeCompare(b))
    .join('|')
}

function enrichVariant(
  variant: ProductVariant,
  resolved: ResolvedAxis[],
): VariantResponse {
  return {
    ...toVariantResponse(variant),
    combinationLabel: combinationLabel(variant.attributeValues, resolved),
  }
}

export async function getProductVariants(
  deps: CatalogAppDeps,
  query: ListProductVariantsQuery,
): Promise<ProductVariantsResponse> {
  if (!requireVariantRead(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, query.productId)
  const resolved = await loadResolvedAxesFromProduct(deps, product)
  const status = query.status ?? 'all'
  const filtered =
    status === 'all'
      ? product.variants
      : product.variants.filter((v) => v.status === status)

  const pageSize = Math.min(Math.max(query.pageSize ?? 50, 1), 100)
  const page = Math.max(query.page ?? 1, 1)
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const items = filtered
    .slice(start, start + pageSize)
    .map((v) => enrichVariant(v, resolved))

  return {
    productId: product.id,
    topology: product.topology,
    productStatus: product.status,
    axes: toAxisResponses(resolved),
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function getVariantAxes(
  deps: CatalogAppDeps,
  productId: string,
): Promise<VariantAxisResponse[]> {
  if (!requireVariantRead(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, productId)
  const resolved = await loadResolvedAxesFromProduct(deps, product)
  return toAxisResponses(resolved)
}

export async function previewVariantCombinations(
  deps: CatalogAppDeps,
  command: PreviewVariantCombinationsCommand,
): Promise<VariantCombinationsPreviewResponse> {
  if (!requireVariantRead(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)

  let resolved: ResolvedAxis[]
  if (command.axes) {
    // Dry-run resolve without requiring configure — preview is read-side.
    // Attribute find-or-create is NOT persisted here; simulate ids for new defs.
    resolved = await resolveAxesForPreview(deps, command.axes)
  } else {
    resolved = await loadResolvedAxesFromProduct(deps, product)
  }

  const axes = resolved.map((r) => r.axis)
  const cartesian = throwIfDomainError(
    VariantCombinationPolicy.cartesianOptionSets(axes),
  )

  const byHash = new Map(
    product.variants.map((v) => [v.combinationHash, v] as const),
  )
  const previewHashes = new Set<string>()
  const items: VariantCombinationsPreviewResponse['items'] = []

  for (const values of cartesian) {
    const hash = combinationHash(values)
    previewHashes.add(hash)
    const existing = byHash.get(hash)
    const label = combinationLabel(values, resolved)
    const attributeValues = values.map((v) => {
      const axis = resolved.find(
        (r) => r.axis.attributeDefinitionId === v.attributeDefinitionId,
      )
      const opt = axis?.definition.options.find((o) => o.id === v.optionId)
      return {
        attributeDefinitionId: v.attributeDefinitionId,
        optionId: v.optionId,
        axisName: axis?.definition.name ?? v.attributeDefinitionId,
        optionLabel: opt?.label ?? v.optionId,
      }
    })

    const selectionKey = combinationSelectionKey(values, resolved)
    if (!existing) {
      items.push({
        combinationHash: hash,
        selectionKey,
        label,
        attributeValues,
        state: 'new',
        variantId: null,
        sku: null,
        status: null,
      })
      continue
    }

    items.push({
      combinationHash: hash,
      selectionKey,
      label,
      attributeValues,
      state: existing.status === 'archived' ? 'archived' : 'existing',
      variantId: existing.id,
      sku: existing.sku?.value ?? null,
      status: existing.status,
    })
  }

  const obsolete = product.variants.filter(
    (v) =>
      v.combinationHash !== 'default' &&
      !previewHashes.has(v.combinationHash),
  )
  for (const v of obsolete) {
    items.push({
      combinationHash: v.combinationHash,
      selectionKey: combinationSelectionKey(v.attributeValues, resolved),
      label: combinationLabel(v.attributeValues, resolved),
      attributeValues: v.attributeValues.map((val) => ({
        attributeDefinitionId: val.attributeDefinitionId,
        optionId: val.optionId,
        axisName: val.attributeDefinitionId,
        optionLabel: val.optionId,
      })),
      state: 'obsolete',
      variantId: v.id,
      sku: v.sku?.value ?? null,
      status: v.status,
    })
  }

  const existingCount = items.filter((i) => i.state === 'existing').length
  const newCount = items.filter((i) => i.state === 'new').length
  const archivedCount = items.filter((i) => i.state === 'archived').length
  const obsoleteCount = items.filter((i) => i.state === 'obsolete').length
  const totalCombinations = cartesian.length

  return {
    productId: product.id,
    totalCombinations,
    existingCount,
    newCount,
    archivedCount,
    obsoleteCount,
    requiresConfirmation: totalCombinations > VARIANT_SOFT_CONFIRM_ABOVE,
    softConfirmAbove: VARIANT_SOFT_CONFIRM_ABOVE,
    maxCombinations: COMBINATION_LIMITS.maxCombinationsPerProduct,
    maxAxes: COMBINATION_LIMITS.maxAxes,
    items,
    axes: toAxisResponses(resolved),
  }
}

/**
 * Preview resolve: reuse existing definitions when present; otherwise allocate
 * temporary ids that are NOT saved (preview-only).
 */
async function resolveAxesForPreview(
  deps: CatalogAppDeps,
  drafts: VariantAxisDraft[],
): Promise<ResolvedAxis[]> {
  validateAxisDrafts(drafts)
  const resolved: ResolvedAxis[] = []

  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i]!
    const nameLabel = throwIfDomainError(
      createNamedLabel(draft.name, { max: 120 }, 'Informe o nome do eixo.'),
    )
    const existing = await deps.attributes.findByNormalizedName(
      deps.organizationId,
      nameLabel.normalizedName,
    )

    let definition: AttributeDefinition
    if (existing && existing.valueType === 'option') {
      const options = [...existing.options]
      let nextSort =
        options.reduce((max, o) => Math.max(max, o.sortOrder), -1) + 1
      for (const raw of draft.options) {
        const label = throwIfDomainError(
          createNamedLabel(raw, { max: 120 }, 'Informe a opção.'),
        )
        if (!options.some((o) => o.normalizedLabel === label.normalizedName)) {
          options.push({
            id: `preview-${deps.ids.next()}`,
            definitionId: existing.id,
            label: label.name,
            normalizedLabel: label.normalizedName,
            status: 'active',
            sortOrder: nextSort,
          })
          nextSort += 1
        }
      }
      definition = { ...existing, options }
    } else {
      const defId = `preview-${deps.ids.next()}`
      const options: AttributeOption[] = draft.options.map((raw, idx) => {
        const label = throwIfDomainError(
          createNamedLabel(raw, { max: 120 }, 'Informe a opção.'),
        )
        return {
          id: `preview-${deps.ids.next()}`,
          definitionId: defId,
          label: label.name,
          normalizedLabel: label.normalizedName,
          status: 'active' as const,
          sortOrder: idx,
        }
      })
      definition = {
        id: defId,
        organizationId: deps.organizationId,
        name: nameLabel.name,
        normalizedName: nameLabel.normalizedName,
        valueType: 'option',
        status: 'active',
        options,
      }
    }

    const allowedOptionIds = draft.options.map((raw) => {
      const normalized = throwIfDomainError(
        createNamedLabel(raw, { max: 120 }, 'Informe a opção.'),
      ).normalizedName
      return definition.options.find((o) => o.normalizedLabel === normalized)!.id
    })

    resolved.push({
      definition,
      axis: {
        attributeDefinitionId: definition.id,
        allowedOptionIds,
        sortOrder: i,
      },
    })
  }

  return resolved
}

export async function applyVariantCombinations(
  deps: CatalogAppDeps,
  command: ApplyVariantCombinationsCommand,
): Promise<ApplyVariantCombinationsResponse> {
  if (!requireVariantConfigure(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  assertProductMutable(product)
  throwIfDomainError(
    ProductTopologyPolicy.canChangeAxes({ hasOperationalHistory: false }),
  )

  if (command.axes.length < 1) {
    throw new CatalogValidationError({
      axes: 'Informe ao menos um eixo para aplicar.',
    })
  }

  const resolved = await resolveAndPersistAxes(deps, command.axes)
  const axes = resolved.map((r) => r.axis)
  const cartesian = throwIfDomainError(
    VariantCombinationPolicy.cartesianOptionSets(axes),
  )

  const createAllNew = command.createAllNew === true
  const createKeys = new Set(command.createSelectionKeys ?? [])
  if (!createAllNew) {
    for (const key of createKeys) {
      const exists = cartesian.some((values) => {
        const sk = combinationSelectionKey(values, resolved)
        return sk === key
      })
      if (!exists) {
        throw new CatalogValidationError({
          createSelectionKeys:
            'Combinação selecionada não existe na matriz proposta.',
        })
      }
    }
  }

  const byHash = new Map(
    product.variants.map((v) => [v.combinationHash, v] as const),
  )
  const events: CatalogDomainEvent[] = []
  const createdVariantIds: string[] = []
  const preservedVariantIds: string[] = []
  const variants: ProductVariant[] = []

  // Preserve variants whose hash still exists (including archived).
  for (const values of cartesian) {
    const hash = combinationHash(values)
    const existing = byHash.get(hash)
    if (existing) {
      variants.push({
        ...existing,
        isDefault: false,
        attributeValues: values,
        combinationHash: hash,
      })
      preservedVariantIds.push(existing.id)
      byHash.delete(hash)
    }
  }

  // Keep obsolete variants as-is (never auto-delete / auto-archive).
  for (const leftover of byHash.values()) {
    if (leftover.combinationHash === 'default' && leftover.isDefault) {
      // Converting from simple — archive the default variant.
      variants.push({
        ...leftover,
        isDefault: false,
        status: 'archived',
      })
      events.push({
        type: 'VariantArchived',
        organizationId: deps.organizationId,
        productId: product.id,
        variantId: leftover.id,
      })
    } else {
      variants.push({ ...leftover, isDefault: false })
      preservedVariantIds.push(leftover.id)
    }
  }

  const unitOfMeasureId =
    product.defaultUnitOfMeasureId ??
    product.variants.find((v) => v.unitOfMeasureId)?.unitOfMeasureId
  if (!unitOfMeasureId) {
    throw new CatalogConflictError(
      'Produto precisa de unidade de medida para gerar variantes.',
    )
  }

  const minSaleQty = throwIfDomainError(createQuantity(1, 0))
  const saleMultiple = throwIfDomainError(createQuantity(1, 0))
  const prefix = (command.skuPrefix ?? 'VAR').trim().toUpperCase() || 'VAR'
  const existingSkus = new Set(await deps.products.listSkus(deps.organizationId))
  let skuIndex = 1

  for (const values of cartesian) {
    const hash = combinationHash(values)
    if (variants.some((v) => v.combinationHash === hash)) continue
    const selectionKey = combinationSelectionKey(values, resolved)
    const shouldCreate = createAllNew || createKeys.has(selectionKey)
    if (!shouldCreate) continue

    let skuRaw = `${prefix}-${String(skuIndex).padStart(3, '0')}`
    while (existingSkus.has(skuRaw)) {
      skuIndex += 1
      skuRaw = `${prefix}-${String(skuIndex).padStart(3, '0')}`
    }
    const sku = throwIfDomainError(createSku(skuRaw))
    throwIfDomainError(IdentifierPolicy.assertSkuUnique(sku, existingSkus))
    existingSkus.add(sku.value)

    const variantId = deps.ids.next()
    const variant: ProductVariant = {
      id: variantId,
      productId: product.id,
      organizationId: deps.organizationId,
      sku,
      barcodes: [],
      unitOfMeasureId,
      attributeValues: values,
      combinationHash: hash,
      isDefault: false,
      tracksInventory: true,
      minSaleQty,
      saleMultiple,
      status: 'draft',
    }
    variants.push(variant)
    createdVariantIds.push(variantId)
    events.push({
      type: 'VariantCreated',
      organizationId: deps.organizationId,
      productId: product.id,
      variantId,
    })
    skuIndex += 1
  }

  if (variants.filter((v) => v.status !== 'archived').length < 1) {
    throw new CatalogConflictError(
      'Selecione ao menos uma combinação para criar, ou preserve variantes existentes.',
    )
  }

  const activeCount = variants.filter((v) => v.status === 'active').length
  throwIfDomainError(VariantCombinationPolicy.assertActiveVariantCount(activeCount))
  throwIfDomainError(
    VariantCombinationPolicy.assertUniqueHashes(
      variants.map((v) => v.combinationHash),
    ),
  )

  const next: Product = {
    ...product,
    topology: 'variable',
    axes,
    variants,
    defaultUnitOfMeasureId: unitOfMeasureId,
  }
  throwIfDomainError(ProductTopologyPolicy.assertInvariants(next))

  await deps.products.save(next)
  deps.events.append(events)

  return {
    product: toProductResponse(next),
    createdVariantIds,
    preservedVariantIds,
    axes: toAxisResponses(resolved),
  }
}

export async function defineVariantAxes(
  deps: CatalogAppDeps,
  command: DefineVariantAxesCommand,
): Promise<ApplyVariantCombinationsResponse> {
  if (!requireVariantConfigure(deps.can)) throw new CatalogPermissionError()
  const createAllNew =
    command.createAllNew !== false &&
    (command.createSelectionKeys === undefined ||
      command.createSelectionKeys.length === 0)

  return applyVariantCombinations(deps, {
    productId: command.productId,
    axes: command.axes,
    createAllNew,
    createSelectionKeys: command.createSelectionKeys,
    skuPrefix: command.skuPrefix,
  })
}

export async function addVariantAxis(
  deps: CatalogAppDeps,
  command: AddVariantAxisCommand,
): Promise<ApplyVariantCombinationsResponse> {
  if (!requireVariantConfigure(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  assertProductMutable(product)
  if (product.topology === 'simple') {
    throw new CatalogConflictError(
      'Para o primeiro eixo, use a aplicação da matriz de combinações.',
    )
  }
  const current = await loadResolvedAxesFromProduct(deps, product)
  const drafts: VariantAxisDraft[] = [
    ...current.map((r) => ({
      name: r.definition.name,
      options: r.axis.allowedOptionIds.map(
        (id) => r.definition.options.find((o) => o.id === id)?.label ?? id,
      ),
    })),
    { name: command.name, options: command.options },
  ]
  // Adding an axis invalidates old combinations — preserve existing; create none.
  return applyVariantCombinations(deps, {
    productId: command.productId,
    axes: drafts,
    createAllNew: false,
    createSelectionKeys: [],
  })
}

export async function removeVariantAxis(
  deps: CatalogAppDeps,
  command: RemoveVariantAxisCommand,
): Promise<ApplyVariantCombinationsResponse> {
  if (!requireVariantConfigure(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  assertProductMutable(product)

  const inUse = product.variants.some(
    (v) =>
      v.status !== 'archived' &&
      v.attributeValues.some(
        (a) => a.attributeDefinitionId === command.attributeDefinitionId,
      ),
  )
  if (inUse) {
    throw new CatalogConflictError(
      'Não é possível remover um eixo usado por variantes ativas ou em rascunho.',
    )
  }

  const current = await loadResolvedAxesFromProduct(deps, product)
  const remaining = current.filter(
    (r) => r.axis.attributeDefinitionId !== command.attributeDefinitionId,
  )
  if (remaining.length === current.length) {
    throw new CatalogNotFoundError('variant_axis_not_found')
  }
  if (remaining.length === 0) {
    throw new CatalogConflictError(
      'Produto variável deve manter ao menos um eixo. Use o fluxo de topologia para simplificar.',
    )
  }

  const drafts = remaining.map((r) => ({
    name: r.definition.name,
    options: r.axis.allowedOptionIds.map(
      (id) => r.definition.options.find((o) => o.id === id)?.label ?? id,
    ),
  }))

  return applyVariantCombinations(deps, {
    productId: command.productId,
    axes: drafts,
    createAllNew: false,
    createSelectionKeys: [],
  })
}

export async function addVariantOption(
  deps: CatalogAppDeps,
  command: AddVariantOptionCommand,
): Promise<VariantAxisResponse[]> {
  if (!requireVariantConfigure(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  assertProductMutable(product)
  throwIfDomainError(
    ProductTopologyPolicy.canChangeAxes({ hasOperationalHistory: false }),
  )

  const axis = product.axes.find(
    (a) => a.attributeDefinitionId === command.attributeDefinitionId,
  )
  if (!axis) throw new CatalogNotFoundError('variant_axis_not_found')

  const definition = await deps.attributes.getById(
    deps.organizationId,
    command.attributeDefinitionId,
  )
  if (!definition) throw new CatalogNotFoundError('attribute_definition_not_found')

  const merged = await mergeOptionsOntoDefinition(deps, definition, [
    command.label,
  ])
  const label = throwIfDomainError(
    createNamedLabel(command.label, { max: 120 }, 'Informe a opção.'),
  )
  const option = merged.options.find((o) => o.normalizedLabel === label.normalizedName)!

  const axes = product.axes.map((a) =>
    a.attributeDefinitionId === axis.attributeDefinitionId
      ? {
          ...a,
          allowedOptionIds: a.allowedOptionIds.includes(option.id)
            ? a.allowedOptionIds
            : [...a.allowedOptionIds, option.id],
        }
      : a,
  )

  await deps.products.save({ ...product, axes })
  return getVariantAxes(deps, product.id)
}

export async function updateVariantOption(
  deps: CatalogAppDeps,
  command: UpdateVariantOptionCommand,
): Promise<VariantAxisResponse[]> {
  if (!requireVariantConfigure(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  assertProductMutable(product)

  const definition = await deps.attributes.getById(
    deps.organizationId,
    command.attributeDefinitionId,
  )
  if (!definition) throw new CatalogNotFoundError('attribute_definition_not_found')

  const index = definition.options.findIndex((o) => o.id === command.optionId)
  if (index < 0) throw new CatalogNotFoundError('variant_option_not_found')

  const options = [...definition.options]
  const current = options[index]!
  let label = current.label
  let normalizedLabel = current.normalizedLabel
  if (command.label !== undefined) {
    const named = throwIfDomainError(
      createNamedLabel(command.label, { max: 120 }, 'Informe a opção.'),
    )
    const clash = options.some(
      (o, i) => i !== index && o.normalizedLabel === named.normalizedName,
    )
    if (clash) {
      throw new CatalogConflictError('Opção duplicada no eixo.')
    }
    label = named.name
    normalizedLabel = named.normalizedName
  }

  options[index] = {
    ...current,
    label,
    normalizedLabel,
    sortOrder:
      command.sortOrder !== undefined ? command.sortOrder : current.sortOrder,
  }
  await deps.attributes.save({ ...definition, options })
  return getVariantAxes(deps, product.id)
}

export async function removeVariantOption(
  deps: CatalogAppDeps,
  command: RemoveVariantOptionCommand,
): Promise<VariantAxisResponse[]> {
  if (!requireVariantConfigure(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  assertProductMutable(product)

  const inUse = product.variants.some(
    (v) =>
      v.status !== 'archived' &&
      v.attributeValues.some((a) => a.optionId === command.optionId),
  )
  if (inUse) {
    throw new CatalogConflictError(
      'Não é possível remover uma opção usada por variantes ativas ou em rascunho.',
    )
  }

  const axis = product.axes.find(
    (a) => a.attributeDefinitionId === command.attributeDefinitionId,
  )
  if (!axis) throw new CatalogNotFoundError('variant_axis_not_found')
  if (axis.allowedOptionIds.length <= 1) {
    throw new CatalogConflictError('Cada eixo deve manter ao menos uma opção.')
  }

  const axes = product.axes.map((a) =>
    a.attributeDefinitionId === axis.attributeDefinitionId
      ? {
          ...a,
          allowedOptionIds: a.allowedOptionIds.filter(
            (id) => id !== command.optionId,
          ),
        }
      : a,
  )
  await deps.products.save({ ...product, axes })
  return getVariantAxes(deps, product.id)
}

