import type {
  AddPriceEntryCommand,
  ClosePriceEntryCommand,
  CreatePriceListCommand,
  ListPriceHistoryQuery,
  ListPricesByVariantQuery,
  PriceEntryResponse,
  PriceHistoryItemResponse,
  PriceListDetailResponse,
  PriceListIdCommand,
  PriceListResponse,
  ResolveCurrentPriceCommand,
  ResolvedPriceResponse,
  UpdatePriceEntryCommand,
  UpdatePriceListCommand,
  VariantPriceSummaryResponse,
} from '#/modules/catalog/application/dto'
import {
  CatalogConflictError,
  CatalogNotFoundError,
  CatalogPermissionError,
  CatalogValidationError,
  throwIfDomainError,
} from '#/modules/catalog/application/errors'
import {
  requirePricesActivate,
  requirePricesArchive,
  requirePricesCreate,
  requirePricesEdit,
  requirePricesRead,
  requirePricesResolve,
  requirePricesRestore,
  type CatalogAppDeps,
} from '#/modules/catalog/application/deps'
import {
  toPriceEntryResponse,
  toPriceListDetailResponse,
  toPriceListResponse,
  toResolvedPriceResponse,
} from '#/modules/catalog/application/mappers'
import {
  assertValid,
  validateAddPriceEntry,
  validateCreatePriceList,
  validateUpdatePriceEntry,
} from '#/modules/catalog/application/validation'
import {
  createDefaultPriceList,
  setVariantPrice,
} from '#/modules/catalog/domain/factories/price-list-factory'
import {
  assertSupportedCurrency,
  createMoney,
  type MoneyCurrency,
} from '#/modules/catalog/domain/value-objects/money'
import { PriceResolutionPolicy } from '#/modules/catalog/domain/policies/price-resolution-policy'
import type { PriceList } from '#/modules/catalog/domain/types'

async function loadList(deps: CatalogAppDeps, priceListId: string) {
  const list = await deps.priceLists.getById(
    deps.organizationId,
    priceListId,
  )
  if (!list) throw new CatalogNotFoundError('price_list_not_found')
  return list
}

function normalizePriority(value: number | undefined, fallback: number) {
  const priority = value ?? fallback
  if (!Number.isInteger(priority) || priority < 0 || priority > 1000) {
    throw new CatalogValidationError({
      priority: 'Prioridade deve ser um inteiro entre 0 e 1000.',
    })
  }
  return priority
}

async function assertVariantResolvable(
  deps: CatalogAppDeps,
  variantId: string,
) {
  const products = await deps.products.listByOrganization(deps.organizationId)
  const product = products.find((p) =>
    p.variants.some((v) => v.id === variantId),
  )
  if (!product) throw new CatalogNotFoundError('variant_not_found')
  if (product.status === 'archived') {
    throw new CatalogPermissionError('product_archived')
  }
  const variant = product.variants.find((v) => v.id === variantId)!
  if (variant.status === 'archived') {
    throw new CatalogPermissionError('variant_archived')
  }
  return { product, variant }
}

export async function createPriceList(
  deps: CatalogAppDeps,
  command: CreatePriceListCommand,
): Promise<PriceListResponse> {
  if (!requirePricesCreate(deps.can)) throw new CatalogPermissionError()
  assertValid(validateCreatePriceList(command))

  const currency = throwIfDomainError(
    assertSupportedCurrency(command.currency ?? 'BRL'),
  )
  const wantDefault = command.isDefault !== false
  const description = command.description?.trim()
    ? command.description.trim()
    : null

  if (wantDefault) {
    const existing = await deps.priceLists.getDefault(deps.organizationId)
    if (existing) throw new CatalogConflictError('default_price_list_exists')
    const created = throwIfDomainError(
      createDefaultPriceList(
        deps.organizationId,
        () => deps.ids.next(),
        command.name,
      ),
    )
    const list: PriceList = {
      ...created.priceList,
      currency,
      description,
      priority: normalizePriority(command.priority, 100),
    }
    await deps.priceLists.save(list)
    deps.events.append(created.events)
    return toPriceListResponse(list)
  }

  const list: PriceList = {
    id: deps.ids.next(),
    organizationId: deps.organizationId,
    name: command.name.trim(),
    description,
    currency,
    isDefault: false,
    priority: normalizePriority(command.priority, 0),
    status: 'active',
    entries: [],
  }
  await deps.priceLists.save(list)
  deps.events.append([
    {
      type: 'PriceListCreated',
      organizationId: deps.organizationId,
      priceListId: list.id,
    },
  ])
  return toPriceListResponse(list)
}

export async function updatePriceList(
  deps: CatalogAppDeps,
  command: UpdatePriceListCommand,
): Promise<PriceListResponse> {
  if (!requirePricesEdit(deps.can)) throw new CatalogPermissionError()
  const list = await loadList(deps, command.priceListId)
  if (list.status === 'archived') {
    throw new CatalogPermissionError('price_list_archived')
  }

  const name =
    command.name !== undefined ? command.name.trim() : list.name
  if (!name) {
    throw new CatalogValidationError({ name: 'Informe o nome da lista.' })
  }

  let description = list.description
  if (command.description !== undefined) {
    description = command.description?.trim()
      ? command.description.trim()
      : null
  }

  const next: PriceList = {
    ...list,
    name,
    description,
    priority:
      command.priority !== undefined
        ? normalizePriority(command.priority, list.priority)
        : list.priority,
  }
  await deps.priceLists.save(next)
  return toPriceListResponse(next)
}

export async function activatePriceList(
  deps: CatalogAppDeps,
  command: PriceListIdCommand,
): Promise<PriceListResponse> {
  if (!requirePricesActivate(deps.can) && !requirePricesRestore(deps.can)) {
    throw new CatalogPermissionError()
  }
  const list = await loadList(deps, command.priceListId)
  if (list.isDefault) {
    const currentDefault = await deps.priceLists.getDefault(
      deps.organizationId,
    )
    if (currentDefault && currentDefault.id !== list.id) {
      throw new CatalogConflictError('default_price_list_exists')
    }
  }
  const next = {
    ...list,
    status: 'active' as const,
  }
  await deps.priceLists.save(next)
  deps.events.append([
    {
      type: 'PriceListActivated',
      organizationId: deps.organizationId,
      priceListId: list.id,
    },
  ])
  return toPriceListResponse(next)
}

export async function deactivatePriceList(
  deps: CatalogAppDeps,
  command: PriceListIdCommand,
): Promise<PriceListResponse> {
  if (!requirePricesArchive(deps.can)) throw new CatalogPermissionError()
  const list = await loadList(deps, command.priceListId)
  if (list.isDefault) {
    throw new CatalogConflictError('cannot_deactivate_default_price_list')
  }
  const next = { ...list, status: 'archived' as const }
  await deps.priceLists.save(next)
  deps.events.append([
    {
      type: 'PriceListArchived',
      organizationId: deps.organizationId,
      priceListId: list.id,
    },
  ])
  return toPriceListResponse(next)
}

export async function archivePriceList(
  deps: CatalogAppDeps,
  command: PriceListIdCommand,
): Promise<PriceListResponse> {
  return deactivatePriceList(deps, command)
}

export async function restorePriceList(
  deps: CatalogAppDeps,
  command: PriceListIdCommand,
): Promise<PriceListResponse> {
  if (!requirePricesRestore(deps.can)) throw new CatalogPermissionError()
  return activatePriceList(deps, command)
}

export async function getPriceList(
  deps: CatalogAppDeps,
  priceListId: string,
): Promise<PriceListDetailResponse> {
  if (!requirePricesRead(deps.can)) throw new CatalogPermissionError()
  const list = await loadList(deps, priceListId)
  return toPriceListDetailResponse(list, deps.clock.nowIso())
}

export async function addPriceEntry(
  deps: CatalogAppDeps,
  command: AddPriceEntryCommand,
): Promise<PriceEntryResponse> {
  if (!requirePricesEdit(deps.can)) throw new CatalogPermissionError()
  assertValid(validateAddPriceEntry(command))
  await assertVariantResolvable(deps, command.variantId)
  const list = await loadList(deps, command.priceListId)
  if (list.status !== 'active') {
    throw new CatalogConflictError('price_list_archived')
  }
  const result = throwIfDomainError(
    setVariantPrice(
      list,
      command.variantId,
      command.amount,
      command.validFrom,
      () => deps.ids.next(),
    ),
  )
  await deps.priceLists.save(result.priceList)
  deps.events.append([
    ...result.events,
    {
      type: 'PriceEntryCreated',
      organizationId: deps.organizationId,
      priceListId: list.id,
      variantId: command.variantId,
      entryId: result.entry.id,
    },
  ])
  return toPriceEntryResponse(result.entry, deps.clock.nowIso())
}

export async function updatePriceEntry(
  deps: CatalogAppDeps,
  command: UpdatePriceEntryCommand,
): Promise<PriceEntryResponse> {
  if (!requirePricesEdit(deps.can)) throw new CatalogPermissionError()
  assertValid(validateUpdatePriceEntry(command))
  const list = await loadList(deps, command.priceListId)
  if (list.status !== 'active') {
    throw new CatalogConflictError('price_list_archived')
  }
  const entry = list.entries.find((e) => e.id === command.entryId)
  if (!entry) throw new CatalogNotFoundError('price_entry_not_found')
  if (entry.validTo !== null) {
    throw new CatalogConflictError('cannot_update_closed_price_entry')
  }
  const amount = throwIfDomainError(createMoney(command.amount, list.currency))
  const updated = { ...entry, amount }
  const entries = list.entries.map((e) =>
    e.id === entry.id ? updated : e,
  )
  await deps.priceLists.save({ ...list, entries })
  deps.events.append([
    {
      type: 'PriceChanged',
      organizationId: deps.organizationId,
      priceListId: list.id,
      variantId: entry.variantId,
    },
  ])
  return toPriceEntryResponse(updated, deps.clock.nowIso())
}

export async function closePriceEntry(
  deps: CatalogAppDeps,
  command: ClosePriceEntryCommand,
): Promise<PriceEntryResponse> {
  if (!requirePricesEdit(deps.can)) throw new CatalogPermissionError()
  const list = await loadList(deps, command.priceListId)
  const entry = list.entries.find((e) => e.id === command.entryId)
  if (!entry) throw new CatalogNotFoundError('price_entry_not_found')
  if (entry.validTo !== null) {
    throw new CatalogConflictError('price_entry_already_closed')
  }
  if (command.validTo <= entry.validFrom) {
    throw new CatalogConflictError('invalid_price_validity')
  }
  const updated = { ...entry, validTo: command.validTo }
  const entries = list.entries.map((e) =>
    e.id === entry.id ? updated : e,
  )
  await deps.priceLists.save({ ...list, entries })
  return toPriceEntryResponse(updated, deps.clock.nowIso())
}

export async function resolveCurrentPrice(
  deps: CatalogAppDeps,
  command: ResolveCurrentPriceCommand,
): Promise<ResolvedPriceResponse> {
  if (!requirePricesResolve(deps.can)) throw new CatalogPermissionError()
  await assertVariantResolvable(deps, command.variantId)

  const currency = command.currency
    ? throwIfDomainError(assertSupportedCurrency(command.currency))
    : undefined

  const lists = command.priceListId
    ? [await loadList(deps, command.priceListId)]
    : await deps.priceLists.listByOrganization(deps.organizationId)

  const resolved = throwIfDomainError(
    PriceResolutionPolicy.resolveFromLists(lists, command.variantId, {
      at: command.at,
      priceListId: command.priceListId,
      currency: currency as MoneyCurrency | undefined,
    }),
  )
  return toResolvedPriceResponse(resolved)
}

export async function getResolvedPrice(
  deps: CatalogAppDeps,
  command: ResolveCurrentPriceCommand,
): Promise<ResolvedPriceResponse> {
  return resolveCurrentPrice(deps, command)
}

export async function listPricesByVariant(
  deps: CatalogAppDeps,
  query: ListPricesByVariantQuery,
): Promise<VariantPriceSummaryResponse> {
  if (!requirePricesRead(deps.can)) throw new CatalogPermissionError()
  const { product } = await assertVariantResolvable(deps, query.variantId)
  const at = query.at ?? deps.clock.nowIso()
  const lists = await deps.priceLists.listByOrganization(deps.organizationId)

  let resolved: ResolvedPriceResponse | null
  try {
    resolved = await resolveCurrentPrice(deps, {
      variantId: query.variantId,
      at,
    })
  } catch {
    resolved = null
  }

  return {
    variantId: query.variantId,
    productId: product.id,
    resolved,
    lists: lists
      .slice()
      .sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name))
      .map((list) => {
        const result = PriceResolutionPolicy.resolve(
          list,
          query.variantId,
          at,
        )
        return {
          priceListId: list.id,
          priceListName: list.name,
          isDefault: list.isDefault,
          priority: list.priority,
          amount: result.ok ? result.value.amount.amount : null,
          currency: result.ok ? result.value.currency : null,
          status: list.status,
        }
      }),
  }
}

export async function getVariantPriceSummary(
  deps: CatalogAppDeps,
  variantId: string,
): Promise<VariantPriceSummaryResponse> {
  return listPricesByVariant(deps, { variantId })
}

export async function listPriceHistory(
  deps: CatalogAppDeps,
  query: ListPriceHistoryQuery,
): Promise<PriceHistoryItemResponse[]> {
  if (!requirePricesRead(deps.can)) throw new CatalogPermissionError()
  const rows = await deps.priceHistory.listByOrganization(
    deps.organizationId,
    {
      variantId: query.variantId,
      priceListId: query.priceListId,
      limit: query.limit,
    },
  )
  return rows.map((r) => ({
    id: r.id,
    priceListId: r.priceListId,
    variantId: r.variantId,
    entryId: r.entryId,
    amount: r.amount,
    currency: r.currency,
    effectiveAt: r.effectiveAt,
    recordedAt: r.recordedAt,
    recordedBy: r.recordedBy,
  }))
}
