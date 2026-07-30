import { createServerFn } from '@tanstack/react-start'
import type { ListCatalogProductsQuery } from '#/modules/catalog/application'
import type {
  ApplyVariantCombinationsInput,
  ApplyVariantCombinationsRpcResponse,
  CatalogOrgScope,
  CatalogRpcResult,
  CreateProductInput,
  CreateProductWithInitialSetupInput,
  ProductCreationResult,
  CreateProductResponse,
  GetLifecycleInput,
  GetLifecycleResponse,
  GetProductInput,
  GetProductResponse,
  LifecycleProductInput,
  LifecycleProductResponse,
  ListCatalogProductsResponse,
  ListProductVariantsInput,
  ListProductVariantsResponse,
  PreviewVariantCombinationsInput,
  PreviewVariantCombinationsResponse,
  UpdateProductInput,
  UpdateProductResponse,
  UpdateVariantInput,
  UpdateVariantResponse,
  VariantLifecycleInput,
  VariantLifecycleResponse,
  AddPriceEntryInput,
  AddPriceEntryResponse,
  CreatePriceListInput,
  CreatePriceListResponse,
  GetPriceListInput,
  GetPriceListResponse,
  ListPriceListsResponse,
  PriceListLifecycleInput,
  PriceListLifecycleResponse,
  ResolvePriceInput,
  ResolvePriceResponse,
  SearchVariantsInput,
  SearchVariantsResponse,
  UpdatePriceListInput,
  UpdatePriceListResponse,
  VariantPriceSummaryInput,
  VariantPriceSummaryRpcResponse,
  CreateBrandInput,
  ArchiveBrandInput,
  ArchiveCategoryInput,
  CreateAttributeInput,
  UpdateAttributeInput,
  ArchiveAttributeInput,
  DeleteAttributeInput,
  CreateAttributeValueInput,
  UpdateAttributeValueInput,
  ArchiveAttributeValueInput,
  UpdateBrandInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  MoveCategoryInput,
} from '#/modules/catalog/ui/api/contracts'
import { toCatalogRpcError } from '#/modules/catalog/ui/errors/catalog-rpc-errors'

type ListProductsInput = CatalogOrgScope & {
  query?: ListCatalogProductsQuery
}

/**
 * Catalog UI → Application Layer RPC bridge.
 * Safe to import from client hooks — TanStack Start replaces handlers with RPC stubs.
 * Repositories / SQL load only inside the server handler via dynamic import.
 *
 * organizationId from the client is a membership selection claim only.
 * Actor identity always comes from JWT; tenant is pinned after membership check.
 */
async function createServerCatalogApp(organizationId: string) {
  const {
    can: canCheck,
    isRolePreset,
    permissionsForRole,
  } = await import('@rescript/permissions')
  const { createCatalogApplicationService } = await import(
    '#/modules/catalog/application'
  )
  const { createInMemoryEventCollector } = await import(
    '#/modules/catalog/application/ports/event-collector'
  )
  const { createServerSupabaseClient } = await import(
    '#/lib/supabase/server.server'
  )
  const {
    createSupabaseCatalogRepos,
    resolveCatalogDatabaseUrlFromEnv,
  } = await import('#/modules/catalog/infrastructure/supabase/index.server')

  const client = createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser()
  if (userError || !user) {
    throw new Error('not_authenticated')
  }

  const { data: membership, error: membershipError } = await client
    .from('membership')
    .select('role, status')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membership || !isRolePreset(membership.role)) {
    throw new Error('not_org_member')
  }

  const grants = permissionsForRole(membership.role)
  const can = (key: Parameters<typeof canCheck>[1]) => canCheck(grants, key)

  const databaseUrl = resolveCatalogDatabaseUrlFromEnv()
  if (!databaseUrl) {
    throw new Error('catalog_database_unavailable')
  }

  const repos = await createSupabaseCatalogRepos({
    client,
    actorUserId: user.id,
    organizationId,
    databaseUrl,
  })

  return createCatalogApplicationService({
    organizationId: repos.organizationId,
    userId: repos.actorUserId,
    can,
    ids: { next: () => crypto.randomUUID() },
    clock: { nowIso: () => new Date().toISOString() },
    events: createInMemoryEventCollector(),
    products: repos.products,
    brands: repos.brands,
    categories: repos.categories,
    priceLists: repos.priceLists,
    attributes: repos.attributes,
    units: repos.units,
    lifecycleAudit: repos.lifecycleAudit,
    priceHistory: repos.priceHistory,
  })
}

async function runCatalogRpc<T>(
  organizationId: string,
  run: (app: Awaited<ReturnType<typeof createServerCatalogApp>>) => Promise<T>,
): Promise<CatalogRpcResult<T>> {
  try {
    const app = await createServerCatalogApp(organizationId)
    const data = await run(app)
    return { ok: true, data }
  } catch (error) {
    const mapped = toCatalogRpcError(error)
    const rawMessage = error instanceof Error ? error.message : 'unknown'
    console.error('[catalog.rpc.failed]', {
      code: mapped.code,
      name: error instanceof Error ? error.name : 'unknown',
      message: rawMessage
        .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, 'postgresql://***')
        .replace(/password=[^&\s]+/gi, 'password=***'),
    })
    return { ok: false, error: mapped }
  }
}

export const catalogListProducts = createServerFn({ method: 'POST' })
  .validator((input: ListProductsInput) => input)
  .handler(async ({ data }): Promise<CatalogRpcResult<ListCatalogProductsResponse>> =>
    runCatalogRpc(data.organizationId, (app) => app.listProducts(data.query)),
  )

/**
 * ProductCreationOrchestrator entry point. PostgreSQL owns the transaction so
 * no product, price, ledger entry or valuation can commit partially.
 */
export const catalogCreateProductWithInitialSetup = createServerFn({ method: 'POST' })
  .validator((input: CreateProductWithInitialSetupInput) => input)
  .handler(async ({ data }): Promise<CatalogRpcResult<ProductCreationResult>> => {
    try {
      const { createServerSupabaseClient } = await import('#/lib/supabase/server.server')
      const client = createServerSupabaseClient()
      // Database types are regenerated with the migration; keep this boundary
      // explicit until generated types are refreshed in CI.
      const rpc = client.rpc.bind(client) as unknown as (
        name: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>
      const { data: result, error } = await rpc('create_product_with_retail_fiscal_setup', {
        p_organization_id: data.organizationId,
        p_payload: data.command,
        p_idempotency_key: data.idempotencyKey,
      })
      if (error) throw new Error(error.message)
      return { ok: true, data: result as unknown as ProductCreationResult }
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'unknown'
      const mapped = toCatalogRpcError(error)
      console.error('[catalog.product-creation.failed]', {
        code: mapped.code,
        message: rawMessage
          .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, 'postgresql://***')
          .replace(/password=[^&\s]+/gi, 'password=***'),
      })
      return { ok: false, error: mapped }
    }
  })

export type NcmSearchResult = {
  code: string
  description: string
}

type SearchNcmInput = {
  query: string
}

type OfficialNcmEntry = {
  code: string
  description: string
}

let ncmCatalogCache: NcmSearchResult[] | null = null
let ncmCatalogCacheExpiresAt = 0

function cleanOfficialNcmDescription(value: string) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/^[-–—]+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The official Siscomex export splits an NCM label across hierarchy levels.
 * For example, 61.09 names the article and 6109.10.00 only says
 * "- De algodão". Returning the terminal label alone makes the selector
 * ambiguous, so reconstruct the nearest complete commercial description.
 */
function buildFullNcmDescription(
  code: string,
  entries: OfficialNcmEntry[],
  terminalDescription: string,
) {
  const hierarchy = entries
    .filter((entry) => code.startsWith(entry.code) && entry.code.length >= 4)
    .sort((left, right) => left.code.length - right.code.length)

  const parent = hierarchy.find(
    (entry) => !entry.description.trim().startsWith('-'),
  )
  const suffixes = hierarchy
    .filter((entry) => entry.code.length > (parent?.code.length ?? 0))
    .map((entry) => cleanOfficialNcmDescription(entry.description))
    .filter(Boolean)

  const parts = [
    parent ? cleanOfficialNcmDescription(parent.description) : '',
    ...suffixes,
  ].filter(Boolean)

  return parts.length
    ? parts.join(' ')
    : cleanOfficialNcmDescription(terminalDescription)
}

async function loadOfficialNcmCatalog(): Promise<NcmSearchResult[]> {
  if (ncmCatalogCache && Date.now() < ncmCatalogCacheExpiresAt) {
    return ncmCatalogCache
  }

  const response = await fetch(
    'https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json',
    { signal: AbortSignal.timeout(12_000) },
  )
  if (!response.ok) throw new Error('ncm_catalog_unavailable')

  const payload = (await response.json()) as {
    Nomenclaturas?: Array<{ Codigo?: string; Descricao?: string }>
  }
  const entries = (payload.Nomenclaturas ?? [])
    .map((item) => ({
      code: (item.Codigo ?? '').replace(/\D/g, ''),
      description: (item.Descricao ?? '').trim(),
    }))
    .filter((item) => item.code.length > 0 && item.description.length > 0)

  ncmCatalogCache = entries
    .filter((item) => item.code.length === 8)
    .map((item) => ({
      code: item.code,
      description: buildFullNcmDescription(item.code, entries, item.description),
    }))
  ncmCatalogCacheExpiresAt = Date.now() + 60 * 60 * 1000
  return ncmCatalogCache
}

/** Search the current official NCM catalog without persisting a copy in Catalog. */
export const catalogSearchOfficialNcm = createServerFn({ method: 'POST' })
  .validator((input: SearchNcmInput) => input)
  .handler(async ({ data }): Promise<NcmSearchResult[]> => {
    const query = data.query.trim().toLocaleLowerCase('pt-BR')
    if (query.length < 2) return []
    const catalog = await loadOfficialNcmCatalog()
    const numericQuery = query.replace(/\D/g, '')
    return catalog
      .filter((item) =>
        numericQuery
          ? item.code.startsWith(numericQuery)
          : item.description.toLocaleLowerCase('pt-BR').includes(query),
      )
      .slice(0, 50)
  })

export const catalogListBrands = createServerFn({ method: 'POST' })
  .validator((input: CatalogOrgScope) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) => app.listBrands()),
  )

export const catalogListCategories = createServerFn({ method: 'POST' })
  .validator((input: CatalogOrgScope) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) => app.listCategories()),
  )

export const catalogCreateBrand = createServerFn({ method: 'POST' })
  .validator((input: CreateBrandInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.createBrand(data.command),
    ),
  )

export const catalogUpdateBrand = createServerFn({ method: 'POST' })
  .validator((input: UpdateBrandInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.updateBrand(data.command),
    ),
  )

export const catalogArchiveBrand = createServerFn({ method: 'POST' })
  .validator((input: ArchiveBrandInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.archiveBrand(data.command),
    ),
  )

export const catalogCreateCategory = createServerFn({ method: 'POST' })
  .validator((input: CreateCategoryInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.createCategory(data.command),
    ),
  )

export const catalogUpdateCategory = createServerFn({ method: 'POST' })
  .validator((input: UpdateCategoryInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.updateCategory(data.command),
    ),
  )

export const catalogMoveCategory = createServerFn({ method: 'POST' })
  .validator((input: MoveCategoryInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.moveCategory(data.command),
    ),
  )

export const catalogArchiveCategory = createServerFn({ method: 'POST' })
  .validator((input: ArchiveCategoryInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.archiveCategory(data.command),
    ),
  )

export const catalogListAttributes = createServerFn({ method: 'POST' })
  .validator((input: CatalogOrgScope) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) => app.listAttributes()),
  )

export const catalogCreateAttribute = createServerFn({ method: 'POST' })
  .validator((input: CreateAttributeInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.createAttribute(data.command),
    ),
  )

export const catalogUpdateAttribute = createServerFn({ method: 'POST' })
  .validator((input: UpdateAttributeInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.updateAttribute(data.command),
    ),
  )

export const catalogArchiveAttribute = createServerFn({ method: 'POST' })
  .validator((input: ArchiveAttributeInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.archiveAttribute(data.command),
    ),
  )

export const catalogDeleteAttribute = createServerFn({ method: 'POST' })
  .validator((input: DeleteAttributeInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.deleteAttribute(data.command),
    ),
  )

export const catalogCreateAttributeValue = createServerFn({ method: 'POST' })
  .validator((input: CreateAttributeValueInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.createAttributeValue(data.command),
    ),
  )

export const catalogUpdateAttributeValue = createServerFn({ method: 'POST' })
  .validator((input: UpdateAttributeValueInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.updateAttributeValue(data.command),
    ),
  )

export const catalogArchiveAttributeValue = createServerFn({ method: 'POST' })
  .validator((input: ArchiveAttributeValueInput) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) =>
      app.archiveAttributeValue(data.command),
    ),
  )

export const catalogListPriceLists = createServerFn({ method: 'POST' })
  .validator((input: CatalogOrgScope) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) => app.listPriceLists()),
  )

export const catalogListUnitsOfMeasure = createServerFn({ method: 'POST' })
  .validator((input: CatalogOrgScope) => input)
  .handler(async ({ data }) =>
    runCatalogRpc(data.organizationId, (app) => app.listUnitsOfMeasure()),
  )

export const catalogCreateProduct = createServerFn({ method: 'POST' })
  .validator((input: CreateProductInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<CreateProductResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.createProduct({
          name: data.command.name,
          description: data.command.description,
          brandId: data.command.brandId,
          primaryCategoryId: data.command.primaryCategoryId,
          sku: data.command.sku,
          unitOfMeasureId: data.command.unitOfMeasureId,
          barcode: data.command.barcode,
          tracksInventory: data.command.tracksInventory,
          axes: data.command.axes,
          skuPrefix: data.command.skuPrefix,
        }),
      ),
  )

export const catalogGetProduct = createServerFn({ method: 'POST' })
  .validator((input: GetProductInput) => input)
  .handler(async ({ data }): Promise<CatalogRpcResult<GetProductResponse>> =>
    runCatalogRpc(data.organizationId, (app) =>
      app.getProductDetail(data.productId),
    ),
  )

export const catalogUpdateProduct = createServerFn({ method: 'POST' })
  .validator((input: UpdateProductInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<UpdateProductResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.updateProduct({
          productId: data.command.productId,
          name: data.command.name,
          description: data.command.description,
          brandId: data.command.brandId,
          primaryCategoryId: data.command.primaryCategoryId,
        }),
      ),
  )

export const catalogPublishProduct = createServerFn({ method: 'POST' })
  .validator((input: LifecycleProductInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<LifecycleProductResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.publishProduct(data.command),
      ),
  )

export const catalogArchiveProduct = createServerFn({ method: 'POST' })
  .validator((input: LifecycleProductInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<LifecycleProductResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.archiveProduct(data.command),
      ),
  )

export const catalogRestoreProduct = createServerFn({ method: 'POST' })
  .validator((input: LifecycleProductInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<LifecycleProductResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.restoreProduct(data.command),
      ),
  )

export const catalogDeactivateProduct = createServerFn({ method: 'POST' })
  .validator((input: LifecycleProductInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<LifecycleProductResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.deactivateProduct(data.command),
      ),
  )

export const catalogGetLifecycle = createServerFn({ method: 'POST' })
  .validator((input: GetLifecycleInput) => input)
  .handler(async ({ data }): Promise<CatalogRpcResult<GetLifecycleResponse>> =>
    runCatalogRpc(data.organizationId, (app) =>
      app.getLifecycle(data.productId),
    ),
  )

export const catalogListProductVariants = createServerFn({ method: 'POST' })
  .validator((input: ListProductVariantsInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<ListProductVariantsResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.getProductVariants(data.query),
      ),
  )

export const catalogPreviewVariantCombinations = createServerFn({
  method: 'POST',
})
  .validator((input: PreviewVariantCombinationsInput) => input)
  .handler(
    async ({
      data,
    }): Promise<CatalogRpcResult<PreviewVariantCombinationsResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.previewVariantCombinations(data.command),
      ),
  )

export const catalogApplyVariantCombinations = createServerFn({
  method: 'POST',
})
  .validator((input: ApplyVariantCombinationsInput) => input)
  .handler(
    async ({
      data,
    }): Promise<CatalogRpcResult<ApplyVariantCombinationsRpcResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.applyVariantCombinations(data.command),
      ),
  )

export const catalogUpdateVariant = createServerFn({ method: 'POST' })
  .validator((input: UpdateVariantInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<UpdateVariantResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.updateVariant(data.command),
      ),
  )

export const catalogArchiveVariant = createServerFn({ method: 'POST' })
  .validator((input: VariantLifecycleInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<VariantLifecycleResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.archiveVariant(data.command),
      ),
  )

export const catalogRestoreVariant = createServerFn({ method: 'POST' })
  .validator((input: VariantLifecycleInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<VariantLifecycleResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.restoreVariant(data.command),
      ),
  )

export const catalogActivateVariant = createServerFn({ method: 'POST' })
  .validator((input: VariantLifecycleInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<VariantLifecycleResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.activateVariant(data.command),
      ),
  )

export const catalogGetPriceList = createServerFn({ method: 'POST' })
  .validator((input: GetPriceListInput) => input)
  .handler(async ({ data }): Promise<CatalogRpcResult<GetPriceListResponse>> =>
    runCatalogRpc(data.organizationId, (app) =>
      app.getPriceList(data.priceListId),
    ),
  )

export const catalogCreatePriceList = createServerFn({ method: 'POST' })
  .validator((input: CreatePriceListInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<CreatePriceListResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.createPriceList(data.command),
      ),
  )

export const catalogUpdatePriceList = createServerFn({ method: 'POST' })
  .validator((input: UpdatePriceListInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<UpdatePriceListResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.updatePriceList(data.command),
      ),
  )

export const catalogArchivePriceList = createServerFn({ method: 'POST' })
  .validator((input: PriceListLifecycleInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<PriceListLifecycleResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.archivePriceList(data.command),
      ),
  )

export const catalogRestorePriceList = createServerFn({ method: 'POST' })
  .validator((input: PriceListLifecycleInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<PriceListLifecycleResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.restorePriceList(data.command),
      ),
  )

export const catalogActivatePriceList = createServerFn({ method: 'POST' })
  .validator((input: PriceListLifecycleInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<PriceListLifecycleResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.activatePriceList(data.command),
      ),
  )

export const catalogAddPriceEntry = createServerFn({ method: 'POST' })
  .validator((input: AddPriceEntryInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<AddPriceEntryResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.addPriceEntry(data.command),
      ),
  )

export const catalogResolvePrice = createServerFn({ method: 'POST' })
  .validator((input: ResolvePriceInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<ResolvePriceResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.resolveCurrentPrice(data.command),
      ),
  )

export const catalogSearchVariants = createServerFn({ method: 'POST' })
  .validator((input: SearchVariantsInput) => input)
  .handler(
    async ({ data }): Promise<CatalogRpcResult<SearchVariantsResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.searchVariants(data.query),
      ),
  )

export const catalogGetVariantPriceSummary = createServerFn({ method: 'POST' })
  .validator((input: VariantPriceSummaryInput) => input)
  .handler(
    async ({
      data,
    }): Promise<CatalogRpcResult<VariantPriceSummaryRpcResponse>> =>
      runCatalogRpc(data.organizationId, (app) =>
        app.getVariantPriceSummary(data.variantId),
      ),
  )

// Re-export list type for hooks
export type { ListPriceListsResponse }
