import { createServerFn } from '@tanstack/react-start'
import type { ListCatalogProductsQuery } from '#/modules/catalog/application'
import type {
  ApplyVariantCombinationsInput,
  ApplyVariantCombinationsRpcResponse,
  CatalogOrgScope,
  CatalogRpcResult,
  CreateProductInput,
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
    return { ok: false, error: toCatalogRpcError(error) }
  }
}

export const catalogListProducts = createServerFn({ method: 'POST' })
  .validator((input: ListProductsInput) => input)
  .handler(async ({ data }): Promise<CatalogRpcResult<ListCatalogProductsResponse>> =>
    runCatalogRpc(data.organizationId, (app) => app.listProducts(data.query)),
  )

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
