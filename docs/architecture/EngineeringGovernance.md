---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: architecture / EngineeringGovernance
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Engineering Governance (Catalog Phase 0)

> Camada de proteção arquitetural antes da implementação do Catalog.
> Status: **Normativo. Sem código, migration, banco, UI ou API nesta sprint.**
> Fontes de verdade: `CatalogDomainStrategy.md`, `CatalogImplementationPlan.md`, `DomainContracts.md`, `DependencyRules.md`, ADRs 0001–0025.
> A Fase 1 (domínio Catalog) **só inicia após aprovação formal deste pacote de governança**.

---

## 1. Executive Summary

Esta sprint não desenha o sistema — **protege** as decisões já aprovadas.

Para uma equipe grande trabalhando em paralelo, a unidade de controle é:

1. **Ownership** único por entidade (`DomainContracts.md` §2)
2. **Ports** como única fronteira cross-domain
3. **Dependency Rules** classificadas (P / PORT / X)
4. **Invariantes** com justificativa
5. **Anti-patterns** explícitos
6. **ADRs 0020–0025** formalizando Catalog
7. **Checklist de PR** + **Quality Gates** de merge

Nenhuma decisão crítica de Catalog/Variant/Price/cutover depende de interpretação individual.

---

## 2. Hierarquia de autoridade

Em conflito de documentos, aplicar nesta ordem:

1. ADRs com status **Aceito** (mais recente no tema prevalece se houver supersessão explícita)
2. `DomainContracts.md` + `DependencyRules.md` + este documento
3. `CatalogDomainStrategy.md` + `CatalogImplementationPlan.md`
4. `SalesDomainDesign.md`, `RetailDomainStrategy.md`, `ModuleBoundaries.md`, `DependencyMap.md`

### 2.1. Supersessões ativas (não são conflitos abertos)

| Texto legado | Prevalece |
|---|---|
| `SalesDomainDesign` D-01 / `product_id` como unidade da linha | ADR-0020 — `variant_id` |
| Retail / ModuleBoundaries “preço na variante/product” | ADR-0021 — Price List |
| ModuleBoundaries “custo no Products” | ADR-0016 + Inventory ownership |
| Supplier no Product | ADR-0025 — Procurement |

Se surgir **novo** conflito não coberto por ADR, **parar implementação** e abrir ADR — não improvisar.

---

## 3. Ownership (resumo executivo)

Ver tabela completa em `DomainContracts.md` §2.

| Dono | Entidades |
|---|---|
| Catalog | Product, Variant, Brand, Category, Attributes, UOM, Price List/Entry |
| Inventory | Balance, Movement, Reservation, Average cost |
| Sales | Sale, SaleItem, desconto praticado, snapshots da venda |
| Finance | Receivable, Payment, Cash |
| Customers | Customer |
| Metrics | Indicators, Goals |
| Search | Projection only (derivado) |
| Workspace | Nenhum dado canônico |
| Procurement (futuro) | Supplier, compras |

**Regra:** PR que escreve entidade fora do BC dono = rejeitado.

---

## 4. Invariantes (resumo)

Lista completa: `DomainContracts.md` §5 (INV-C01…C18).

Invioláveis no review:

- Variant sem Product — proibido
- Inventory altera Catalog — proibido
- Sales altera Inventory/Catalog direto — proibido
- Metrics escreve núcleo — proibido
- Price List muta Sale confirmada — proibido
- Dual-write estoque Product+Variant — proibido
- SaleItem sem `variant_id` (pós-cutover / código novo) — proibido

---

## 5. Anti-patterns oficiais

### AP-G01 — Repository de Inventory acessando tabelas de Catalog

| | |
|---|---|
| **Por que proibido** | Quebra ownership; acopla ledger ao schema PIM |
| **Como identificar** | Join/SQL `product`/`product_variant` dentro de `modules/inventory` repository; import de Catalog repo |
| **Como evitar** | `StockableItemPort`; denormalizar só o mínimo (variant_id, uom) via port na borda do use case |

### AP-G02 — Sales alterando saldo

| | |
|---|---|
| **Por que proibido** | Viola ADR-0005/0007; cria estado parcial |
| **Como identificar** | `update inventory_balance` / chamada a movement fora de `confirm_sale` / StockAllocationPort |
| **Como evitar** | Orquestração atômica no application service Sales + RPC dona do Inventory |

### AP-G03 — Frontend montando Product com Inventory direto

| | |
|---|---|
| **Por que proibido** | Workspace vira orquestrador de domínio; duplica regras; race conditions |
| **Como identificar** | Página de produto importa hooks/repos de estoque e “merge” local como verdade |
| **Como evitar** | Composition via ports/use cases; read models explícitos do BC dono ou BFF do módulo |

### AP-G04 — Duplicação de regras (preço, ativação, stockable)

| | |
|---|---|
| **Por que proibido** | Divergência silenciosa entre UI e domínio |
| **Como identificar** | Mesma validação em form e em outro BC; `if price` no Sales sem Port |
| **Como evitar** | Policies no dono; consumidores só interpretam Result do port |

### AP-G05 — Dependência circular Catalog ↔ Inventory ↔ Sales

| | |
|---|---|
| **Por que proibido** | Impede deploy/teste isolado; deadlock de mudança |
| **Como identificar** | Import graph cíclico; Catalog importando Inventory “só para validar” |
| **Como evitar** | Matriz `DependencyRules.md`; eventos unidirecionais |

### AP-G06 — Dual Write Product/Variant (estoque ou preço)

| | |
|---|---|
| **Por que proibido** | Duas verdades; ADR-0023 |
| **Como identificar** | Código grava movement com product_id e variant_id “por compatibilidade”; sync jobs bidirecionais |
| **Como evitar** | Expand → cutover → contract; feature flag só de UI Catalog, nunca dual ledger |

### AP-G07 — Snapshots inconsistentes / reconsulta pós-confirmação

| | |
|---|---|
| **Por que proibido** | Métricas e auditoria mentem (CAT-P04) |
| **Como identificar** | Job que “atualiza nome do produto nas sales”; UI de Sale confirmada buscando Catalog |
| **Como evitar** | SnapshotV1 imutável; navegação usa ids + snapshot, não live join para história |

### AP-G08 — Acoplamento temporal (Sales antes do cutover)

| | |
|---|---|
| **Por que proibido** | Constrói Sales no modelo morto (`product_id`) |
| **Como identificar** | PR de `modules/sales` persistindo product_id como stockable antes da Fase 8 |
| **Como evitar** | Gate explícito: Sales real só pós cutover (`CatalogImplementationPlan`) |

### AP-G09 — Preço em coluna Variant/Product

| | |
|---|---|
| **Por que proibido** | ADR-0021 |
| **Como identificar** | Migration `list_price` em product/variant; UI gravando preço no form de Variant sem PriceListEntry |
| **Como evitar** | PriceListRepository + PriceResolutionPort |

### AP-G10 — Supplier dentro do Catalog como Aggregate

| | |
|---|---|
| **Por que proibido** | ADR-0025 |
| **Como identificar** | Tabela `supplier` no módulo catalog; FK obrigatória Product→Supplier |
| **Como evitar** | Procurement futuro; referência opaca se inevitável |

### AP-G11 — Search como fonte de verdade

| | |
|---|---|
| **Por que proibido** | ADR-0024; AP17 |
| **Como identificar** | Update de nome só no índice; Sale lendo preço só do search doc |
| **Como evitar** | Reindex reconstruível; resolve price/stock nos donos |

### AP-G12 — Preset de segmento virando branch de domínio

| | |
|---|---|
| **Por que proibido** | R16 CatalogDomainStrategy; ADR-0022 |
| **Como identificar** | `if segment === 'fashion'` em domain service |
| **Como evitar** | Presets = dados; domínio genérico |

### AP-G13 — Reutilizar `product.id` como `variant.id`

| | |
|---|---|
| **Por que proibido** | ADR-0020/0023; ambiguidade eterna de FK |
| **Como identificar** | Migration `variant.id = product.id` |
| **Como evitar** | Novos UUIDs + mapa explícito |

### AP-G04b — Money float

| | |
|---|---|
| **Por que proibido** | Erro financeiro silencioso |
| **Como identificar** | `number` JS para dinheiro; `real` sem decimal tipado |
| **Como evitar** | Money decimal no shared kernel antes de Pricing |

---

## 6. Checklist obrigatório de Code Review (PRs)

Todo reviewer deve marcar. Qualquer **FAIL** bloqueia approve.

### 6.1. Fronteiras e ownership

- [ ] O PR respeita o BC dono da entidade alterada?
- [ ] Existe violação de bounded context (escrita/leitura interna alheia)?
- [ ] Existe quebra de ownership (dois módulos mutando a mesma verdade)?

### 6.2. Dependências

- [ ] Imports respeitam matriz P/PORT/X (`DependencyRules.md`)?
- [ ] Existe dependência circular nova?
- [ ] Cross-domain usa Port nomeado (`DomainContracts.md` §4)?
- [ ] Há acesso direto a tabelas/repos de outro domínio?

### 6.3. Catalog / Inventory / Sales

- [ ] Identidade operacional é `variant_id` (código novo / pós-cutover)?
- [ ] Preço de lista só via Price List / `PriceResolutionPort`?
- [ ] Inventory não altera Product/Variant?
- [ ] Sales não altera saldo/cadastro direto?
- [ ] Não há dual-write Product↔Variant?
- [ ] Snapshots de Sale não são reescritos após confirmação?

### 6.4. Regras e qualidade

- [ ] Existe duplicação de regra de domínio em UI ou outro BC?
- [ ] Invariantes INV-C\* preservadas?
- [ ] Acoplamento desnecessário / abstração especulativa (AP6)?
- [ ] Multi-tenancy (`organization_id`) + `can(...)` presentes?
- [ ] Operação crítica é atômica/idempotente quando aplicável?
- [ ] Testes cobrem a fronteira nova (unit/integration conforme fase)?

### 6.5. Documentação

- [ ] Se a mudança altera contrato/port/ownership → ADR ou atualização normativa anexada?
- [ ] Anti-pattern da §5 não introduzido “temporariamente”?

**Template de comentário de rejeição:**  
`ARCH-GATE: violação <ID> — ver EngineeringGovernance / DomainContracts.`

---

## 7. Quality Gates (merge)

### 7.1. Gates atuais do repositório (permanecem)

- typecheck, lint, test, build verdes (conforme CI do monorepo).

### 7.2. Gates arquiteturais (bloqueiam merge mesmo com CI verde)

| Gate | Falha quando |
|---|---|
| **G-ARCH-01** | Escrita em entidade fora do BC dono |
| **G-ARCH-02** | Import/SQL cross-domain sem Port |
| **G-ARCH-03** | Dependência classificada **X** na matriz |
| **G-ARCH-04** | Dual-write estoque/preço Product+Variant |
| **G-ARCH-05** | `list_price` (ou equivalente) em Product/Variant como fonte |
| **G-ARCH-06** | SaleItem / movement novo em `product_id` como identidade estocável/vendável |
| **G-ARCH-07** | Metrics/UI alterando fato de núcleo |
| **G-ARCH-08** | Sales real antes do Go da Fase 8 do plano |
| **G-ARCH-09** | Cutover sem ensaio/reconcile documentado (PRs da Fase 6) |
| **G-ARCH-10** | Port público com breaking change sem versionamento/ADR |

### 7.3. Enforcement progressivo

| Fase | Enforcement |
|---|---|
| Phase 0 (agora) | Review humano + este documento |
| Phase 1+ | Path lint / boundaries checklist no PR template |
| Pós-cutover | Testes de contrato dos ports; forbidlist de colunas/APIs legadas |

---

## 8. Papéis e responsabilidades de governança

| Papel | Responsabilidade |
|---|---|
| Tech Lead / Architect | Go/No-Go de fase; interpretação final da hierarquia §2 |
| Code owners (por BC) | Approve PRs do próprio ownership |
| Reviewer qualquer | Checklist §6 obrigatório |
| Migration specialist | Runbook cutover (Fase 6); abort authority |
| EM | Impede trilhos paralelos que violem AP-G08 |

**Regra de equipe:** dúvida de fronteira → consultar `DomainContracts` antes de codificar. Se ainda dúbio → ADR draft, não “decidir no PR”.

---

## 9. Definition of Done — Phase 0

- [x] `EngineeringGovernance.md`
- [x] `DependencyRules.md`
- [x] `DomainContracts.md`
- [x] `ArchitectureDecisionLog.md`
- [x] ADRs 0020–0025 Aceitos
- [x] Ownership explícito
- [x] Contratos Catalog↔Inventory/Sales/Metrics/Finance/Search/Workspace
- [x] Anti-patterns
- [x] Checklist de PR
- [x] Quality gates
- [ ] **Aprovação formal humana** desta governança (bloqueia Fase 1)

---

## 10. Condição de partida da Fase 1

Permitido iniciar código de domínio Catalog **somente** quando:

1. Este pacote estiver aprovado;
2. ADRs 0020–0025 permanecerem Aceitos;
3. Equipe conhecer a hierarquia §2 e o checklist §6;
4. Nenhum trilho de Sales real estiver aberto em paralelo ao flat.

Até lá: **nenhuma** migration Catalog, nenhuma alteração de modules/products ou inventory “no caminho do Variant”.
