---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: architecture / DomainContracts
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Domain Contracts (Catalog Phase 0)

> Contratos oficiais entre Bounded Contexts após aprovação do Catalog.
> Status: **Governança — normativo. Sem implementação nesta sprint.**
> Autoridade: `CatalogDomainStrategy.md`, ADRs 0020–0025, `CatalogImplementationPlan.md`.
> Em caso de texto legado conflitante (`SalesDomainDesign` D-01, trechos de preço em Retail/ModuleBoundaries), **este documento + ADRs 0020–0021 prevalecem**.

---

## 1. Propósito

Impedir que 20 engenheiros interpretem integrações de formas diferentes.
Toda comunicação cross-domain deve caber em um contrato abaixo.
Acesso a tabelas/repositórios internos de outro domínio é **violação**.

---

## 2. Ownership oficial (um dono por entidade)

| Entidade / conceito | Dono (Bounded Context) | Não é dono |
|---|---|---|
| Product | **Catalog** | Inventory, Sales, Metrics, Finance, Search, Workspace |
| Variant | **Catalog** (dentro do Aggregate Product) | idem |
| Brand | **Catalog** | idem |
| Category | **Catalog** | idem |
| Collection, Tag, AttributeDefinition, AttributeOption, UnitOfMeasure | **Catalog** | idem |
| Price List / PriceListEntry / PriceHistory (preço de lista) | **Catalog (Pricing)** | Sales, Finance, Inventory |
| Preço praticado / desconto na venda | **Sales** | Catalog |
| InventoryItem / Stock Balance | **Inventory** | Catalog, Sales, Metrics |
| Stock Movement (ledger) | **Inventory** | Catalog, Sales (Sales só orquestra via port) |
| Reservation | **Inventory** | Sales (Sales é `source`) |
| Custo médio / custo aplicado | **Inventory** | Catalog, Finance (Finance consome) |
| Sale / SaleItem | **Sales** | Catalog, Inventory, Finance |
| Customer | **Customers** | Sales (referencia + snapshot) |
| Receivable / Payment / Cash | **Finance** | Sales (origem), Catalog |
| Metrics / indicators / rankings | **Metrics** | Catalog (só dimensões/eventos) |
| Goals (metas) | **Metrics** (quando existir) | Catalog, Sales |
| Search document / índice operacional | **Search Projection** (owned pipeline; verdade = Catalog+Price+Inventory) | UI direta às tabelas |
| Supplier / PO / compra | **Procurement** (futuro) | Catalog (ADR-0025) |
| Workspace / Home / shell UI | **Workspace (presentation)** | nenhum dado canônico de negócio |
| Organization / Membership / Permission | **Platform** | domínios de negócio |

Nenhuma entidade da tabela possui dois donos.

---

## 3. Contratos por integração

### 3.1. Catalog ↔ Inventory

| Dimensão | Contrato |
|---|---|
| Quem inicia | Inventory inicia leitura de identidade estocável. Catalog **não** inicia escrita em Inventory. Eventos Catalog (`VariantActivated` etc.) podem notificar Inventory para habilitar item — sem criar saldo. |
| Quem consome | Inventory consome `StockableItemPort`. |
| Informações compartilhadas | `variant_id`, `organization_id`, status efetivo (sellable/stockable), UOM + precision, `tracks_inventory`. |
| Nunca compartilhar | Nome comercial, Brand, Category, preço, mídia, atributos de merchandising (Inventory não precisa para saldo). |
| Dono da verdade | Identidade/stockability → Catalog. Quantidade/movimento/reserva/custo → Inventory. |
| Dependências proibidas | Catalog → Inventory. Inventory → tabelas/repos internos de Catalog. Inventory alterar Product/Variant/Price. |

**Port:** `StockableItemPort`  
**Operações públicas:** `getStockableItem(variantId)`, `assertStockable(variantId)`  
**Internas Catalog:** CRUD Product/Variant, policies de ativação.

---

### 3.2. Catalog ↔ Sales

| Dimensão | Contrato |
|---|---|
| Quem inicia | Sales inicia. Catalog nunca chama Sales. |
| Quem consome | Sales consome `CatalogSnapshotPort` + `PriceResolutionPort`. Alocação de estoque via `StockAllocationPort` (**Inventory**, não Catalog). |
| Informações compartilhadas | Snapshot versionado: product/variant ids, display names, SKU, UOM, Brand, Category path, atributos (ids+labels), list price, currency, price list id, `tracks_inventory_at_confirm`, schema version. |
| Nunca compartilhar | Regras internas de CombinationPolicy, PriceHistory bruto, mutações de cadastro, saldo. |
| Dono da verdade | Cadastro/preço lista → Catalog. Linha confirmada/snapshots/desconto/total → Sales. |
| Dependências proibidas | Sales → SQL/tables Catalog. Catalog → Sales. Sales alterar PriceList ou Variant. Sales baixar estoque sem port Inventory / sem `confirm_sale` atômico. |

**Correção normativa:** SaleItem usa **`variant_id`** (ADR-0020). `product_id` só dimensão/snapshot.

---

### 3.3. Catalog ↔ Metrics

| Dimensão | Contrato |
|---|---|
| Quem inicia | Metrics inicia (leitura de eventos/dimensões / facts). Catalog não chama Metrics. |
| Quem consome | Metrics consome Published Language: eventos Catalog + **SaleItem snapshots** + facts Inventory. |
| Informações compartilhadas | Dimensões estáveis (Brand/Category/Product/Variant ids e labels via snapshot ou projeção de dimensão); eventos de classificação/preço para refresh de dimensões **atuais** (visões “catálogo atual” rotuladas). |
| Nunca compartilhar | Fórmulas de indicador dentro do Catalog; Metrics nunca escreve Catalog/Inventory/Sales/Finance. |
| Dono da verdade | Fatos históricos de venda → snapshots Sales. Indicadores → Metrics. Cadastro atual → Catalog (não reescreve história). |
| Dependências proibidas | Metrics → writes em qualquer BC de núcleo. Catalog → Metrics. Metrics ler preço atual para recalcular receita passada. |

---

### 3.4. Catalog ↔ Finance

| Dimensão | Contrato |
|---|---|
| Quem inicia | **Nenhuma dependência direta.** Finance não consulta Catalog. |
| Quem consome | Finance consome Sale (valores) + custo aplicado em InventoryMovement + eventos `SaleConfirmed` / pagamentos. |
| Informações compartilhadas | Indiretas: money da Sale, dimensões congeladas no snapshot da Sale se necessário para reporting. |
| Nunca compartilhar | PriceList atual, Variant mutável, qualquer “preço de catálogo” para recalcular recebível. |
| Dono da verdade | Recebível/pagamento/caixa → Finance. Preço lista → Catalog. Total da Sale → Sales. |
| Dependências proibidas | Finance → Catalog. Catalog → Finance. PriceList alterar Sale confirmada. |

---

### 3.5. Catalog ↔ Search

| Dimensão | Contrato |
|---|---|
| Quem inicia | Pipeline de projeção (sync/async) reagindo a eventos Catalog/Price; enrichment de availability pode puxar Inventory. UI/Sales iniciam **queries** via port. |
| Quem consome | Workspace, Sales balcão, listas — via `CatalogSearchPort` apenas. |
| Informações compartilhadas | Documento por Variant: textos, brand, category, attrs, sku, barcodes, preço denormalizado, hints de availability. |
| Nunca compartilhar | Índice como fonte de verdade de cadastro/saldo/preço; writes de negócio via search table. |
| Dono da verdade | Identidade → Catalog. Preço → PriceList. Saldo → Inventory. Índice → derivado (ADR-0024). |
| Dependências proibidas | UI → SELECT direto na projeção sem port (quando port existir). Search → mutar Catalog/Inventory. |

---

### 3.6. Catalog ↔ Workspace

| Dimensão | Contrato |
|---|---|
| Quem inicia | Workspace (shell/Home/commands) inicia leituras/navegação. |
| Quem consome | Workspace consome use cases/ports públicos do Catalog (e outros BCs) — **zero ownership de dados**. |
| Informações compartilhadas | DTOs de apresentação já autorizados (`can` + tenant). |
| Nunca compartilhar | Regras de domínio no componente de UI; bypass de use case; “fonte da verdade” em estado React. |
| Dono da verdade | Nenhum — Workspace é presentation. |
| Dependências proibidas | Workspace importar repositories de Inventory para montar Product; Workspace calcular preço/saldo. |

---

## 4. Ports públicos do Catalog (contrato — sem implementação)

### 4.1. Catálogo de Ports

| Port | Consumidores | Versão inicial |
|---|---|---|
| `CatalogSnapshotPort` | Sales (obrigatório), Metrics (opcional), Fiscal futuro | v1 |
| `PriceResolutionPort` | Sales, Search projection, UI preço | v1 |
| `StockableItemPort` | Inventory | v1 |
| `CatalogSearchPort` | Workspace, Sales UI, listas | v1 |
| `CatalogReadPort` (opcional fino) | Imports preview, Workspace detail | v1 |

`StockAllocationPort` **não** é Port de Catalog — é de **Inventory**, consumido por Sales.

### 4.2. Operações permitidas (públicas cross-domain)

| Port | Operações |
|---|---|
| `CatalogSnapshotPort` | `getSellableVariant(variantId): SnapshotV1`; `getSellableVariants(ids): SnapshotV1[]` |
| `PriceResolutionPort` | `resolve(variantId, context): ResolvedPriceV1`; `resolveMany(...)` |
| `StockableItemPort` | `getStockableItem(variantId)`; `assertActiveStockable(variantId)` |
| `CatalogSearchPort` | `search(query, filters, page): SearchHit[]` (hit = variant-centric) |
| `CatalogReadPort` | `getProductSummary(productId)`; `listBrands`; `listCategories` (read model) |

SnapshotV1 / ResolvedPriceV1 são **Published Language** versionados; breaking change exige nova versão ou ADR.

### 4.3. Operações que NUNCA podem ser usadas por outros domínios

- Qualquer `create/update/archive/activate` de Product/Variant/Brand/Category/Price via import interno de modules/catalog.
- Acesso a `ProductRepository`, `PriceListRepository`, etc. fora do BC Catalog.
- SQL direto em tabelas `product*`, `price_*`, `brand`, `category`.
- Mutar `PriceListEntry` a partir de Sales/Finance “para corrigir margem”.
- Inventory “sincronizar nome” escrevendo de volta no Catalog.

### 4.4. Operações internas (só Catalog)

- `ProductFactory`, `VariantMatrixFactory`, Combination/Identifier/Topology/Activation policies.
- CRUD de eixos, barcodes, media memberships.
- Escrita de PriceHistory.
- Emissão de eventos de domínio Catalog.
- Comandos de Imports **dentro** dos use cases públicos do Catalog (Open Host), não via repos externos.

---

## 5. Invariantes obrigatórias (com justificativa)

| ID | Invariante | Justificativa |
|---|---|---|
| INV-C01 | Variant nunca existe sem Product | Variant não é Root; identidade comercial ancorada na família (ADR-0020) |
| INV-C02 | Todo Product ativo tem ≥1 Variant ativa (ou default) | CAT-P01 — uma identidade vendável |
| INV-C03 | SKU/Barcode únicos por organização na Variant | Identificadores operacionais (CAT-P05) |
| INV-C04 | Preço de lista só via PriceListEntry | ADR-0021 |
| INV-C05 | Variant ativa exige preço efetivo na lista padrão | Evita vender sem preço |
| INV-C06 | Inventory nunca altera Product/Variant/Price | CAT-P02; ledger não é PIM |
| INV-C07 | Catalog nunca altera saldo/movimento/reserva/custo | Dono Inventory; ADR-0005 |
| INV-C08 | Sales nunca altera Inventory diretamente (tabelas/repos) | Só via `StockAllocationPort` / `confirm_sale` (ADR-0007) |
| INV-C09 | Sales nunca altera Catalog (cadastro/preço lista) | Snapshots; CAT-P04 |
| INV-C10 | Metrics nunca altera nenhum domínio de núcleo | Read-model / cálculos; AP18 |
| INV-C11 | Price List nunca altera Sale confirmada | História imutável; Finance/Sales donos do passado |
| INV-C12 | SaleItem referencia `variant_id` | ADR-0020 |
| INV-C13 | Pós-confirmação, snapshots de linha são imutáveis | CAT-P04; confiança Metrics |
| INV-C14 | Sem dual-write Product/Variant no estoque | ADR-0023 |
| INV-C15 | Search projection reconstruível; nunca verdade canônica | ADR-0024; AP17 |
| INV-C16 | Supplier não é Aggregate do Catalog | ADR-0025 |
| INV-C17 | Finance não depende de Catalog | §3.4 |
| INV-C18 | Workspace não é dono de verdade | Presentation only |

---

## 6. Published Language — SnapshotV1 (shape normativo)

Campos mínimos do snapshot consumido por Sales (nomes lógicos):

- `schemaVersion: 1`
- `organizationId`, `productId`, `variantId`
- `productDisplayName`, `variantDisplayName`
- `sku`, `barcodes[]`
- `uomCode`, `uomPrecision`
- `brandId?`, `brandName?`
- `categoryId?`, `categoryPath?`
- `attributes: { definitionId, optionId, label }[]`
- `listPrice`, `currency`, `priceListId`, `priceAsOf`
- `tracksInventory`
- `status` (must be active to confirm, per policy)

Qualquer campo adicional exige bump de versão ou campo opcional documentado.

---

## 7. Checklist rápido de conformidade de contrato

- [ ] Dependência cross-domain passa por Port nomeado acima?
- [ ] Entidade tem um único dono na §2?
- [ ] Nenhuma escrita no BC errado?
- [ ] Sale usa `variant_id`?
- [ ] Preço de lista só via `PriceResolutionPort`?
- [ ] Metrics só lê?
- [ ] Finance sem import Catalog?

Se qualquer resposta for “não”, o PR está bloqueado (`EngineeringGovernance.md` § Quality Gates).
