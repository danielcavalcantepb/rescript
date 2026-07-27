# Catalog — Application & Persistence (Phase 3A / 3B)

Persistence-agnostic application layer over the Catalog domain (Phase 1), plus hardened Supabase adapters (Phase 3B).

## Boundaries

- **In:** Commands / Queries (DTOs), permission `can`, organization context  
- **Out:** Repository ports, in-memory event collector  
- **Server-only out:** Supabase/SQL concrete repositories (`infrastructure/supabase/index.server.ts`)  
- **Not in Phase 3:** Inventory/Sales cutover, dual-write  
- **Phase 4A (UI foundation):** React Query + Catalog routes under `ui/` — see [Catalog UI Foundation](#catalog-ui-foundation)

## Layout

```
application/          # ports + use cases (persistence-agnostic)
infrastructure/memory/
infrastructure/supabase/
  index.ts            # client-safe: mappers/errors/types only
  index.server.ts     # server-only: repos + SQL + factory
  sql.server.ts       # postgres pool / transactions
  *.ts                # adapters (import server-only)
```

Public `#/modules/catalog` does **not** export SQL repositories.

## Persistence Security Model

### Server-only boundary

- Concrete adapters import `server-only` (`assert-server-only.ts`).
- SQL lives in `sql.server.ts` (TanStack Start `.server.ts` convention).
- Compose via dynamic import inside `createServerFn` / loaders:
  `import('#/modules/catalog/infrastructure/supabase/index.server')`.
- Client bundle inspection test forbids `postgres`, connection strings, and factory symbols in `dist/client`.

### Authorization model

1. Factory `createSupabaseCatalogRepos` is **async**.
2. Verifies JWT via `client.auth.getUser()` — must equal `actorUserId`.
3. Verifies active `membership` for `organizationId` (RLS-backed read).
4. Every port method rejects `organizationId` ≠ trusted tenant (`organization_mismatch`).
5. Every `save(entity)` rejects `entity.organizationId` ≠ trusted tenant.

`actorUserId` / `organizationId` from the caller are **not** trusted alone.

### SQL direct behavior

| Fact | Evidence |
|---|---|
| Role | Owner/`postgres` on local Supabase (`probeSqlSecurityContext`) |
| RLS | Enabled on tables, **not FORCE** — owner connection bypasses RLS |
| `auth.uid()` | NULL on direct SQL (claims not injected) |
| Isolation | Explicit `organization_id` predicates + verified tenant context |
| Session | `SET LOCAL app.catalog_organization_id` / `actor_user_id` per transaction |

SQL is a privileged path for atomic multi-table writes. It is **not** a substitute for membership checks. Never expose `databaseUrl` via `VITE_*`.

### Tenant isolation strategy

- **Reads (PostgREST):** `.eq('organization_id', trustedOrg)` + JWT RLS.  
- **Writes (SQL):** `WHERE organization_id = $trusted` on select/update/delete; insert rows carry trusted org.  
- **Search:** forced to trusted org; query.organizationId must match.  
- **Brand/Category:** insert/update (no blind upsert) so PK collisions cannot transfer tenants.

### Domain reconstitution

- Row → Domain via `mapProductAggregate` / siblings (structural reconstitution).
- No create-domain factories / create events on load.
- Invalid lifecycle/currency/numeric → `CatalogConflictError` (no invented defaults).
- Cross-tenant children in a row set → rejected.

### Inferred fields (deterministic)

| Field | Source | Round-trip |
|---|---|---|
| `topology` | `axes.length > 0 ? variable : simple` | Yes for Application-created products |
| `defaultUnitOfMeasureId` | default variant UOM, else first variant | Yes when a default variant exists |

Not stored on `product` (Phase 2). Legacy `product.sku`/`unit`/`status` are coexistence columns, not Catalog source of truth.

### Transactions

`withCatalogTransaction(url, organizationId, actorUserId, fn)`:

- BEGIN/COMMIT via `postgres`
- rollback on throw
- SET LOCAL GUCs (no pool leak across concurrent txs)
- used for Product aggregate, Attribute+options, PriceList+entries+history

### Error sanitization

`mapSupabaseError` → `CatalogConflictError` | `CatalogNotFoundError` | `CatalogPermissionError`  
Redacts connection strings / JWTs (`redactSensitive`). Never returns SQL or credentials.

### Local tests

Require `npx supabase start` + local DB. Harness uses anon JWT + membership seed (not service-role for repo ops).

See `docs/validation/CatalogPhase3BValidation.md` for evidence and verdict.

## Use cases

Product, Variant, Brand, Category, Price List / Price, Search — see `catalog-application-service.ts`.

## Testing

- Application: `application/application.test.ts` (in-memory)
- Mappers / errors / tenant guards: unit tests under `infrastructure/supabase/`
- Integration: persistence, RLS isolation, transactions, contracts (local Supabase)
- Bundle: `client-bundle-safety.test.ts`
- UI foundation: `ui/catalog-ui.test.tsx`
- Product management UI: `ui/product-management*.test.tsx` (+ form/schema tests)

## Catalog UI Foundation

Phase 4A delivered the Catalog shell and product list. Phase 4B adds Product create / details / edit (see below).

### Fluxo

1. Route under `/_app/catalog/*` → `RequirePermission(products.read)`.
2. Page components in `ui/pages/` compose `CatalogShell` (header, breadcrumb, module nav).
3. Hooks in `ui/hooks/` call TanStack `createServerFn`s from `ui/catalog-api.ts` (client-safe RPC stubs).
4. Server handlers verify JWT + membership, build Application Service via dynamic import of `infrastructure/supabase/index.server` + `createCatalogApplicationService`, then run list use cases.
5. React Query caches with `catalogQueryKeys` (scoped by `organizationId`).
6. UI never imports repositories, SQL, or Supabase adapters directly.

### Estrutura

```
ui/
  catalog-api.ts          # createServerFn RPC → Application Layer (server-only deps via dynamic import)
  components/             # toolbar, filters, table, pagination, badges…
  layouts/                # CatalogShell, CatalogModuleNav
  pages/                  # home, products list, section placeholders
  hooks/                  # useCatalogProducts / Brands / Categories / PriceLists
  providers/              # reserved (later sprints)
  table/                  # re-exports CatalogTable
  filters/                # filter state → ListCatalogProductsQuery
  dialogs/                # reserved (no CRUD dialogs in 4A)
  empty-states/
  loading/
```

Routes: `/catalog`, `/catalog/products`, `/catalog/categories`, `/catalog/brands`, `/catalog/price-lists`, `/catalog/attributes`.

### Componentes

| Component | Responsibility |
|---|---|
| `CatalogShell` | Page chrome: breadcrumb, header, module nav, content slot |
| `CatalogModuleNav` | Local module navigation (ARIA current page) |
| `CatalogToolbar` | Section title + optional actions slot |
| `CatalogFilters` / `CatalogFilterPanel` / `CatalogSearchInput` | Text, status, brand, category, sort |
| `CatalogTable` | Read-only product rows; view action disabled until detail sprint |
| `CatalogPagination` | Page controls |
| `CatalogEmptyState` / `CatalogLoadingState` / `CatalogErrorState` | Non-happy paths + a11y announcements |
| `CatalogStatusBadge` | Lifecycle label via shared `StatusBadge` |

### Responsabilidades

- **UI:** presentation, filter UX, loading/error/empty, navigation.
- **Application:** list queries (`listProducts`, `listBrands`, `listCategories`, `listPriceLists`), permissions, DTO shaping.
- **Forbidden in UI:** variant/price/attribute editors, Inventory/Sales, direct repository or SQL access.

## Product Management UI

Phase 4B — create, details, and edit for basic Product fields. No Variant Editor, Price List Editor, Attribute Editor, Inventory, or Sales.

### Rotas

| Route | Permission | Purpose |
|---|---|---|
| `/catalog/products` | `products.read` | List + search (filters in URL search) |
| `/catalog/products/new` | `products.create` | Create simple product |
| `/catalog/products/$productId` | `products.read` | Details (read model) |
| `/catalog/products/$productId/edit` | `products.edit` | Edit name/description/brand/category |

(`products.write` implies create/edit via the permissions package.)

### Fluxo UI → Application

```
React page / ProductForm
  → hooks (useProduct, useCreateProduct, useUpdateProduct, useBrands, useCategories, useUnits)
  → catalog-api createServerFn (RPC stub on client)
  → server: JWT + membership → createSupabaseCatalogRepos → createCatalogApplicationService
  → use cases: createProduct | getProductDetail | updateProduct | list*
  → repository ports → Supabase adapters
```

`organizationId` from the browser is only a membership selection claim. Actor comes from JWT; tenant is pinned after membership verification (`repos.organizationId`).

### Contratos RPC

Defined in `ui/api/contracts.ts`, returned as `CatalogRpcResult<T>` (never raw Supabase/SQL errors):

- `CreateProductInput` / `CreateProductResponse`
- `GetProductInput` / `GetProductResponse` (`CatalogProductDetailResponse`)
- `UpdateProductInput` / `UpdateProductResponse`

Error codes: `validation` | `conflict` | `not_found` | `forbidden` | `unauthenticated` | `unavailable` | `unexpected`.

### Permissões

| Action | UI | Server |
|---|---|---|
| List / details | `products.read` | `requireProductRead` |
| Novo produto | `FeatureGate(products.create)` | `requireProductWrite` |
| Editar | `FeatureGate(products.edit)` | `requireProductEdit` |

Hiding a button never replaces server authorization.

### Cache

`catalogQueryKeys`: `productList`, `productDetail`, `brands`, `categories`, `units`.  
Mutations invalidate `products(org)` and the affected `productDetail`. No optimistic updates.

### Estados de erro

| Code | UX |
|---|---|
| validation | Field errors + form alert; focus first invalid field |
| conflict | Safe SKU/barcode conflict copy |
| not_found | Empty “produto não encontrado” (no cross-tenant leak) |
| forbidden | Access denied empty state |
| unexpected / unavailable | Error state + retry |

### Concorrência

Product aggregate / Application `updateProduct` has **no** revision/version token. Schema `updated_at` exists on rows but is not exposed on the domain aggregate. Limitation: last-write-wins; no optimistic concurrency in this sprint.

### ProductForm fields (supported only)

**Create:** name, sku, unitOfMeasureId, brandId?, primaryCategoryId?, description?, tracksInventory  
**Edit:** name, brandId?, primaryCategoryId?, description? (sku/unit read-only)  
Status starts as `draft` from the domain factory — not editable in this form.

### Application Layer changes (4B)

- Port `UnitOfMeasureRepository` + `listUnitsOfMeasure` / `getProductDetail`
- In-memory + Supabase UOM adapters
- Wired on `CatalogAppDeps` / `createCatalogApplicationService`

## Product Lifecycle

Phase 4C — formal Catalog Product lifecycle (soft archive). No Variant/Price/Inventory/Sales editors.

### Estados (domínio — não inventados)

| Status | Significado |
|---|---|
| `draft` | Rascunho (criação padrão) |
| `active` | Publicado / ativo |
| `archived` | Soft-archived (nunca hard-delete) |

### Transições permitidas

| De | Para | Use case / ação |
|---|---|---|
| draft | active | `publishProduct` / `activateProduct` (Publicar) |
| draft | archived | `archiveProduct` (Arquivar) |
| active | archived | `archiveProduct` / `deactivateProduct` (Desativar) |
| archived | draft | `restoreProduct` (Restaurar) |

### Transições proibidas

- `active` → `draft` (sem arquivar)
- `archived` → `active` (composto); deve restaurar depois publicar
- Hard delete de Product
- Lifecycle mutado via repository / UI / SQL ad hoc

### Regras (Application + Domain)

- Publicar exige SKU, UOM e preço efetivo (default price list) — `CatalogActivationPolicy`
- Arquivado não edita dados básicos (`updateProduct` → `product_archived`)
- Motivo opcional sanitizado (≤500); actor/tenant sempre do servidor
- Variantes acompanham o Product nas transições de domínio

### Use cases

`publishProduct`, `activateProduct`, `archiveProduct`, `deactivateProduct`, `restoreProduct`, `getLifecycle`

### Eventos

`ProductActivated`, `ProductArchived`, `ProductRestored` (+ variant activated/archived quando aplicável)

### Permissões

| Ação | Key | `products.write` implica? |
|---|---|---|
| Publicar | `products.publish` | sim |
| Arquivar / Desativar | `products.archive` | sim |
| Restaurar | `products.restore` | sim |

Roles `manager` / `inventory` recebem as keys explicitamente; `owner`/`admin` via `ALL`.

### Auditoria

Tabela append-only `catalog_product_lifecycle_event` (migration Sprint 020):

`from_status`, `to_status`, `action`, `reason`, `actor_user_id`, `occurred_at` — pinados ao tenant verificado.

Port: `CatalogLifecycleAuditPort` (in-memory + Supabase SQL adapter).

### Fluxo UI

Details → `getLifecycle` → ações válidas apenas → confirm dialog → RPC → invalidate `products` / `productDetail` / `productLifecycle`.

Listagem: filtro padrão **Ativos** (arquivados fora até o usuário escolher Arquivados/Todos).

### Limitações

- Sem Event Bus / outbox externo (collector in-memory + audit table)
- Sem concurrency token no aggregate
- `deactivate` = soft archive (mesmo estado `archived`)
- Motivo não é obrigatório nesta sprint

## Variant Management

Phase 4D — Product Variants, axes and option combinations inside the Product Aggregate.

### Modelo (já existente no domínio)

| Conceito | Valor |
|---|---|
| Topology | `simple` \| `variable` (inferida: `axes.length > 0`) |
| Variant | filho do Product Aggregate (SKU, barcode, combinationHash, status) |
| Axis | `ProductVariantAxis` → `attributeDefinitionId` + `allowedOptionIds` + `sortOrder` |
| Options | labels em `AttributeDefinition` (org); allow-list no eixo do Product |
| Status Variant | `draft` \| `active` \| `archived` (soft archive) |

Nomes de eixo/opção são livres (texto do usuário). Não há enum de Cor/Tamanho/Volume.

### Algoritmo de combinações

`VariantCombinationPolicy.cartesianOptionSets` — produto cartesiano ordenado por `sortOrder`.

- Hash canônico: `attributeDefinitionId=optionId` ordenados (`combinationHash`)
- Seleção UI/apply: `selectionKey` estável por nomes normalizados (`eixo=opcao|…`)
- Preserva variantes existentes (SKU/barcode intactos)
- Não exclui automaticamente combinações obsoletas
- Soft confirm UX: `> 24` combinações (`VARIANT_SOFT_CONFIRM_ABOVE`)

### Limites técnicos (servidor)

| Limite | Valor |
|---|---|
| Máx. eixos | 3 |
| Máx. combinações | 10_000 |
| Máx. variantes ativas | 500 |

### Use cases

`getProductVariants`, `getVariant`, `getVariantAxes`, `createVariant`, `updateVariant`, `activateVariant`, `archiveVariant` / `deactivateVariant`, `restoreVariant`, `previewVariantCombinations`, `applyVariantCombinations`, `defineVariantAxes`, `addVariantAxis`, `removeVariantAxis`, `addVariantOption`, `updateVariantOption`, `removeVariantOption`

### Eventos

`VariantCreated`, `VariantActivated`, `VariantArchived`, `VariantSkuChanged`

### Permissões

| Ação | Key | `products.write` implica? |
|---|---|---|
| Ler | `products.variants.read` | sim (+ `products.read`) |
| Criar | `products.variants.create` | sim |
| Editar | `products.variants.edit` | sim |
| Arquivar | `products.variants.archive` | sim |
| Restaurar | `products.variants.restore` | sim |
| Configurar eixos/matriz | `products.variants.configure` | sim |

### RPC

`catalogListProductVariants`, `catalogPreviewVariantCombinations`, `catalogApplyVariantCombinations`, `catalogUpdateVariant`, `catalogArchiveVariant`, `catalogRestoreVariant`, `catalogActivateVariant`

### UI

Product Details → seção **Variantes** (dialog de eixos + preview + apply). Sem rotas extras.

### Transações / atomicidade

`applyVariantCombinations` resolve atributos, atualiza eixos e cria variantes selecionadas em um único `products.save` (Supabase: replace agregado em transação).

### Migrations

Nenhuma nova — schema Phase 2 já cobre `product_variant*`, `attribute_*`.

### Limitações

- Ativação de Variant ainda exige preço na lista padrão (política já existente)
- Sem Attribute Management global separado (atributos são find-or-create no contexto do Product)
- Sem E2E Playwright/Cypress (lacuna; não introduzida nesta sprint)
- `hasOperationalHistory` ainda hardcoded `false` (Inventory/Sales futuros)
- Sem preço/estoque/imagens/importação na UI de variantes

## Price Engine

Phase 4E — Pricing domain, price policies and resolution (no Inventory/Sales/Promotions).

### Existente → Novo

| Área | Status |
|---|---|
| PriceList / PriceListEntry / Money(BRL) | Existente |
| `PriceResolutionPolicy` + `resolveCurrentPrice` | Existente (ampliado) |
| `price_history` append-only | Existente (agora com read port) |
| Priority / description | **Novo** (migration) |
| Permissões `prices.*` | **Novo** |
| RPC + UI Price Lists | **Novo** |
| Variant Price Summary | **Novo** |

### Modelo

- Preço **nunca** na Variant — apenas `PriceListEntry` (lista + variant + amount + currency + validFrom/validTo)
- Moeda via allowlist `MONEY_CURRENCIES` (hoje `BRL`; expansão aditiva)
- Vigência: `validFrom` / `validTo` (`null` = aberto)
- Soft archive de lista: `status = archived`

### Resolução

`PriceResolutionPolicy.resolveFromLists`:

1. Listas `active` apenas
2. Filtro opcional de moeda / lista explícita
3. Entrada vigente em `at` (`validFrom <= at` e `validTo` null ou `> at`)
4. Prioridade **maior** vence
5. Empate: lista `isDefault`, depois `validFrom` mais recente

### Use cases

`create/update/activate/deactivate/archive/restore/get PriceList`, `add/update/close PriceEntry`, `resolveCurrentPrice` / `getResolvedPrice`, `listPricesByVariant` / `getVariantPriceSummary`, `listPriceHistory`

### Permissões

`prices.read|create|edit|archive|restore|activate|resolve`  
(`products.write` implica; `products.read` → read/resolve)

### RPC / UI

RPC: list/get/create/update/archive/restore/activate list, add entry, resolve, variant summary  
Rotas: `/catalog/price-lists`, `/new`, `/$priceListId`  
Variant: `VariantPriceSummary` (somente leitura + link Gerenciar preços)

### Migration

`20260726020000_catalog_price_engine.sql` — `priority`, `description`, currency check expandável

### Limitações

- Sem promoções / cupons / descontos / canal / cliente
- Sem edição em massa de preços
- Lookup variant→product via listagem (otimizável)
- Sem E2E

## Inventory Foundation

Phase 5A — Stock locations, inventory items and availability (no movements / reservations / Sales).

### Existente → Novo

| Área | Status |
|---|---|
| Product-scoped ledger MVP (`/estoque`, `inventory_movement`) | Existente (paralelo; não expandido) |
| StockLocation / InventoryItem (variant × location) | **Novo** |
| AvailabilityPolicy (domínio puro) | **Novo** |
| InventoryVariantLookup (operacional) | **Novo** |
| Permissões `inventory.create|edit|archive|restore|locations.manage` | **Novo** |
| RPC + UI Catalog → Estoque | **Novo** |
| Variant Inventory Summary | **Novo** |

### Modelo

- Estoque pertence à **Variant**, nunca ao Product
- `StockLocation` (org): code, name, description, isDefault, priority, status `active|inactive|archived`
- `InventoryItem` (variant × location): qtyOnHand, qtyReserved (placeholder 0), available = onHand − reserved
- Soft archive only; sem hard delete; sem ledger nesta sprint

### Availability

`AvailabilityPolicy.check` (puro):

1. Location `active`
2. Product e Variant `active` (archived/draft → indisponível)
3. Item ativo presente
4. Quantidades ≥ 0
5. `requireTracksInventory` opcional

### Lookup operacional

Port `InventoryVariantLookupPort` retorna apenas:

`variantId, productId, organizationId, variantStatus, productStatus, unitOfMeasureId, sku, tracksInventory`

Sem reconstruir o aggregate Product.

### Use cases

Locations: create/update/activate/deactivate/archive/restore/list/get  
Items: create/update/get/list  
`getAvailability`, `getVariantInventorySummary`, `lookupVariant`

### Permissões

`inventory.read|create|edit|archive|restore|locations.manage` (+ existentes `move|adjust`)  
Server-side obrigatório via RPC.

### RPC / UI

RPC serializável em `inventory-api.ts` (createServerFn).  
Rotas: `/catalog/inventory`, `/locations`, `/items` (+ new/details).  
Variant: `VariantInventorySummary` (somente leitura).

### Migration

`20260726030000_inventory_foundation.sql` — `stock_location`, `inventory_item`, `inventory_item_history` + RLS

### Limitações

- Sem reservas reais (`qty_reserved` permanece 0)
- Sem picking / Sales / Purchase / Manufacturing
- MVP product-scoped `/estoque` permanece legado (não dual-write do Catalog Ledger)
- Sem E2E

## Inventory Ledger

Phase 5B — Append-only ledger, balance projection, stock transactions.

### Modelo antigo → novo → transição

| Antigo | Novo |
|---|---|
| Product ledger `/estoque` (`inventory_movement` + `inventory_balance`) | **Catalog Ledger** `inventory_ledger_movement` (variant × location) |
| Foundation `inventory_item.qty_on_hand` mutável via UpdateInventoryItem | `inventory_item` = **projeção** (só RPC SECURITY DEFINER) |
| Dualidade / risco de duplicidade | Um ledger ativo para Catalog Inventory |

**Plano de transição:** Catalog Inventory escreve apenas no ledger variant×location; Item começa em 0; abertura = ENTRY; `/estoque` product MVP permanece legado sem dual-write até cutover ADR-0023.

### Princípio

`CreateMovement → ProjectBalance → inventory_item`  
Nunca `onHand += x` pela UI/application.

### Tipos

`entry | exit | adjustment_in | adjustment_out | transfer_out | transfer_in | reversal`

### Policy / Idempotency / Concurrency

- `MovementPolicy` (puro): location/product/variant active, qty > 0, saldo suficiente
- `idempotency_key` unique por org
- RPC com `FOR UPDATE` em variant/location/item
- Transfer: OUT+IN atômicos, mesmo `correlation_id`
- Reversal: movimento compensatório (nunca delete)

### Permissões

`inventory.movements.read|create`, `inventory.transfer`, `inventory.reverse`  
(+ compat: `inventory.move` / `inventory.adjust`)

### Migration

`20260726040000_inventory_ledger.sql`  
`20260726040001_inventory_ledger_admin_wipe.sql` (GUC `inventory.allow_ledger_admin` only for test/ops wipe — never set by app RPCs)

### Limitações

- Sem Sales/Purchase/Reservations/Picking
- Product MVP `/estoque` ainda existe (legado)
- Reserved permanece 0
