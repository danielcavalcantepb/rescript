import type { PermissionKey } from '@rescript/permissions'
import type { CatalogAppDeps } from '#/modules/catalog/application/deps'
import { createInMemoryEventCollector } from '#/modules/catalog/application/ports/event-collector'
import { createInMemoryLifecycleAudit } from '#/modules/catalog/application/ports/lifecycle-audit'
import { createInMemoryPriceHistory } from '#/modules/catalog/application/ports/price-history'
import { createCatalogApplicationService } from '#/modules/catalog/application/catalog-application-service'
import {
  createFixedClock,
  createSequentialIdGenerator,
  InMemoryCatalogStore,
} from '#/modules/catalog/infrastructure/memory/in-memory-catalog-store'
import {
  createInMemoryCatalogRepos,
  seedInMemoryPlatformUnits,
} from '#/modules/catalog/infrastructure/memory/in-memory-repositories'
import { createAttributeDefinition } from '#/modules/catalog/domain/factories/taxonomy-factory'

const ALL_PRODUCT_PERMS: PermissionKey[] = [
  'catalog.products.read',
  'catalog.products.write',
  'catalog.categories.read',
  'catalog.categories.write',
  'catalog.brands.read',
  'catalog.brands.write',
  'catalog.attributes.read',
  'catalog.attributes.write',
  'catalog.variants.read',
  'catalog.variants.write',
  'products.read',
  'products.create',
  'products.edit',
  'products.write',
  'products.publish',
  'products.archive',
  'products.restore',
  'products.variants.read',
  'products.variants.create',
  'products.variants.edit',
  'products.variants.archive',
  'products.variants.restore',
  'products.variants.configure',
  'prices.read',
  'prices.create',
  'prices.edit',
  'prices.archive',
  'prices.restore',
  'prices.activate',
  'prices.resolve',
]

export function createCatalogTestApp(options?: {
  organizationId?: string
  permissions?: PermissionKey[]
}) {
  const organizationId = options?.organizationId ?? 'org-1'
  const permissions = new Set(options?.permissions ?? ALL_PRODUCT_PERMS)
  const store = new InMemoryCatalogStore()
  seedInMemoryPlatformUnits(store)
  const repos = createInMemoryCatalogRepos(store)
  const events = createInMemoryEventCollector()
  const lifecycleAudit = createInMemoryLifecycleAudit()
  const priceHistory = createInMemoryPriceHistory()
  const ids = createSequentialIdGenerator('t')
  const deps: CatalogAppDeps = {
    organizationId,
    userId: 'user-1',
    can: (key) => permissions.has(key),
    ids,
    clock: createFixedClock(),
    events,
    products: repos.products,
    brands: repos.brands,
    categories: repos.categories,
    priceLists: repos.priceLists,
    attributes: repos.attributes,
    units: repos.units,
    lifecycleAudit,
    priceHistory,
  }
  const app = createCatalogApplicationService(deps)
  return { app, deps, store, repos, events, lifecycleAudit }
}

export async function seedColorAttribute(
  deps: CatalogAppDeps,
  labels = ['Preto', 'Branco'],
) {
  const def = createAttributeDefinition(
    deps.organizationId,
    'Cor',
    'option',
    labels,
    () => deps.ids.next(),
  )
  if (!def.ok) throw new Error(def.error.message)
  await deps.attributes.save(def.value)
  return def.value
}
