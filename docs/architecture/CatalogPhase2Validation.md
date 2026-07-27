---
Status: Archived
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Archive
Scope: architecture / CatalogPhase2Validation
Supersedes: None
Superseded-By: README.md
Related-Modules: All
---

# Rescript — Catalog Phase 2 Validation Report

> Sprint 015.1 — Schema integrity, architectural compliance, clean-migration verification.  
> Sprint 015.2 — Runtime validation attempt (clean DB, RLS, multi-tenant).  
> Status: **Phase 2 NÃO APROVADA** — **PHASE 3 BLOQUEADA** (ambiente descartável indisponível).  
> Última atualização: 2026-07-25 (Sprint 015.2).

---

## 1. Escopo da validação

Validar exclusivamente a Phase 2 (persistência paralela do Catalog):

- `supabase/migrations/20260725050000_catalog.sql`
- correção `supabase/migrations/20260725180000_catalog_phase2_validation_fix.sql`
- tipos em `packages/database`
- não uso operacional pelo app
- alinhamento a `CatalogDomainStrategy`, `CatalogImplementationPlan`, ADRs 0020–0025, governança

**Fora de escopo:** Phase 3 (repos/use cases), cutover Inventory, UI, dual-write, migração de dados.

---

## 2. Ambiente utilizado

### 2.1. Sprint 015.1

| Item | Resultado |
|---|---|
| Docker Desktop / CLI `docker` | **Indisponível** neste host |
| `supabase db reset` local | **Não executado** |
| Banco PostgreSQL descartável | **Não disponível** |
| Validação via `db push` no vinculado | **Não equivalente** a reset completo |

### 2.2. Sprint 015.2 — tentativa de ambiente descartável

Pré-condição do sprint: ambiente seguro para reset completo. Verificação:

| Opção aceitável | Tentativa | Resultado |
|---|---|---|
| 1. Supabase local + Docker Desktop | `docker version` / path Docker Desktop | **Indisponível** — CLI `docker` não encontrado; Docker Desktop não instalado |
| 2. PostgreSQL descartável local | `psql` / PostgreSQL Program Files | **Indisponível** |
| 3. Projeto Supabase temporário só de desenvolvimento | `supabase projects create rescript-catalog-p2-val --org-id qdfqmoarkfouwaodkiec --region sa-east-1 --size nano` | **Falhou** — limite free tier: *“danielcavalcantepb (2 project limit)”* (projetos ativos: `Rescript` + `ars-guardian`) |
| Reset no projeto vinculado `Rescript` | — | **Proibido** pelo sprint (ambiente compartilhado / dados reais) |

**Conclusão pré-condição 015.2:** nenhum ambiente seguro disponível → validação runtime **continua bloqueada**. Nenhuma migration adicional, nenhum teste RLS runtime e nenhum reset foram executados nesta sprint.

---

## 3. Situação do projeto Supabase vinculado

| Campo | Valor (sem segredos) |
|---|---|
| Nome | `Rescript` |
| Project ref | `kdtbvgeymlizadsmigxj` |
| Região | `sa-east-1` |
| Status API | `ACTIVE_HEALTHY` |
| Linked | sim |
| Classificação dev/staging/production | **Não rotulada no projeto** — tratar como ambiente cloud compartilhado / primário do produto; **não** usar como banco de validação destrutiva |
| Migrations Catalog aplicadas | `20260725050000_catalog.sql` (aplicação Phase 2); `20260725180000_catalog_phase2_validation_fix.sql` (2026-07-25, Sprint 015.1) |
| Dados reais | Ambiente ativo com schema de Organizations/Customers/Products/Inventory — presumir dados de uso; **não** houve seed/migração Catalog de dados de negócio |
| Alteração funcional app | Nenhuma — app não lê/escreve tabelas Catalog novas |
| Backup / reversão | Supabase point-in-time / dashboard do projeto (operacional externo). Rollback destrutivo **não** executado nesta sprint |
| Apps com acesso às novas tabelas | Grants a `authenticated` + RLS; **nenhum** módulo de aplicação chama essas tabelas |

**Produção?** Sem label explícito. Por precaução: correções foram apenas `DROP COLUMN` de colunas nullable nunca usadas pela app (baixo risco de dados). Nenhum `TRUNCATE`/`RESET` remoto.

---

## 4. Validação do banco limpo

| Passo | Status |
|---|---|
| 1. Criar banco vazio | **BLOQUEADO** — sem Docker |
| 2. Aplicar todas as migrations desde a primeira | **NÃO EXECUTADO** |
| 3. Seeds oficiais | **NÃO EXECUTADO** |
| 4. Catalog na ordem histórica | **NÃO EXECUTADO** em limpo |
| 5. Regenerar tipos a partir do limpo | **NÃO EXECUTADO** (tipos regenerados do vinculado pós-fix) |
| 6. Comparar schema limpo ↔ vinculado | **NÃO EXECUTADO** |
| 7. Testes de banco (constraints/RLS) | **NÃO EXECUTADO** |
| 8. Segunda passagem determinística | **NÃO EXECUTADO** |

**Conclusão §4:** Phase 2 **não é verificável** quanto a reproducibilidade desde zero neste momento.

---

## 5. Análise das colunas adicionadas ao Product legado

### 5.1. `brand_id` — **MANTER**

| Pergunta | Resposta |
|---|---|
| Seção do plano | `CatalogImplementationPlan` **§5 Fase 2 Decision C**; **§8.2**; **§8.5** (`product.brand_id` → `brand.id`) |
| ADR | **ADR-0020** (Product Aggregate Root da família); Strategy **§6.2** (`brand_id` opcional) |
| Responsabilidade | Classificação comercial Brand do Product |
| Por que no Product existente | Decision C: Product legado **é** o Aggregate Product; Brand é relação do Product, não da Variant |
| Acoplamento legado↔novo | Nullable; legado ignora; acoplamento estrutural mínimo até Phase 3 escrever |
| Cutover | **Preservar** (campo canônico do Product) |
| Fase de uso | **Phase 3+** (repos Catalog) |

### 5.2. `primary_category_id` — **MANTER**

| Pergunta | Resposta |
|---|---|
| Seção do plano | **§8.5** FK `product.primary_category_id` → `category.id`; Strategy **§6.2** / **§6.5** |
| ADR | ADR-0020 (taxonomia no Product); ADR-0022 (contexto de atributos/categoria) |
| Responsabilidade | Categoria primária estruturada (substitui gradualmente `category` texto) |
| Por que no Product | Pertence à família comercial, não à Variant |
| Acoplamento | Nullable; texto legado permanece fonte do app |
| Cutover | **Preservar**; texto `category` removido depois (Fase 6–8) |
| Fase de uso | **Phase 3+** |

### 5.3. `lifecycle_status` — **MANTER** (forma transitória de “status draft”)

| Pergunta | Resposta |
|---|---|
| Seção do plano | **§8.2** “Adicionar … status `draft`” sem alterar `status` legado `active\|inactive` (clarificado na Sprint 015.1) |
| ADR | ADR-0020 lifecycle Product `draft\|active\|archived` (Strategy **§6.2**) |
| Responsabilidade | Ciclo Catalog sem quebrar `product.status` + `product_archive_status_chk` |
| Por que no Product | Lifecycle é do Aggregate Root Product |
| Acoplamento | Dual status até Phase 8; legado usa só `status` |
| Cutover | **Migrar/consolidar** depois; legado `inactive` ↔ `archived` |
| Fase de uso | **Phase 3+** |

### 5.4. `topology` — **REMOVIDA** (divergência)

| Pergunta | Resposta |
|---|---|
| Autorização explícita §8.2/§8.5 | **Não** |
| Decisão | Removida da migration base e dropada no vinculado via `20260725180000_*` |
| Alternativa normativa | Strategy/domain: topologia **derivável** dos eixos (`ProductTopologyPolicy.inferTopology`) |

### 5.5. `default_unit_of_measure_id` — **REMOVIDA** (divergência)

| Pergunta | Resposta |
|---|---|
| Autorização explícita §8.2/§8.5 | **Não** (Strategy §6.14 menciona default de factory; plano de banco não lista a coluna) |
| Decisão | Removida; UOM canônica permanece em `product_variant.unit_of_measure_id` (ADR-0020 / Strategy §6.14) |

---

## 6. Conformidade por tabela

| Tabela | Conformidade | Notas |
|---|---|---|
| `brand` | OK | org-scoped, normalized unique, archive check |
| `category` | OK | tree, depth≤5, unique por irmãos/raiz |
| `unit_of_measure` | OK | platform + org; seed platform |
| `attribute_definition` / `attribute_option` | OK | ADR-0022 |
| `product_variant` | OK | FK product; sku unique org; hash; default unique; active⇒sku+uom |
| `product_variant_axis` | OK | |
| `product_variant_axis_option` | OK* | Não listada nominativamente em §8.1; necessária para allow-list do Axis (Strategy §6.9). Risco residual documental, não de domínio |
| `product_variant_attribute_value` | OK | |
| `product_variant_barcode` | OK | unique org; um primary |
| `price_list` / `price_list_entry` / `price_history` | OK | ADR-0021; sem preço em product/variant |
| `product` alter | OK pós-fix | Só `brand_id`, `primary_category_id`, `lifecycle_status` |
| Inventory / Sales tables | Intactas | Nenhuma alteração |

\* Documentar na Phase 3 se quiser alinhar §8.1 ao junction name.

---

## 7. Conformidade de constraints

| Invariante | No banco? | Na aplicação (Phase 1 domain)? |
|---|---|---|
| SKU unique org (variant) | Sim (partial unique) | IdentifierPolicy |
| Barcode unique org | Sim | IdentifierPolicy |
| combination_hash unique/product | Sim | VariantCombinationPolicy |
| Uma default variant/product | Sim (partial unique) | TopologyPolicy |
| Active ⇒ sku+uom | Sim (check) | ActivationPolicy |
| Preço não em product/variant | Sim (ausência de colunas) | ADR-0021 |
| Uma default price list ativa/org | Sim (partial unique) | — |
| Open entry única list+variant | Sim | setVariantPrice |
| price_history append-only | Sim (sem UPDATE/DELETE policy/grant) | — |
| Axis max 3 / 10k combos | **Não** (app) | CombinationPolicy |
| Opção pertence à definition correta | FK option→definition; **não** garante option∈axis allow-list no valor | CombinationPolicy |
| Org coerente Product↔Brand | **Não** (FK só por id) | App Phase 3 — risco residual |

---

## 8. Conformidade multi-tenant

| Relação | Isolamento DB | Residual |
|---|---|---|
| RLS `is_org_member(organization_id)` | Presente em todas as tabelas org-scoped | Não testado em runtime (sem banco limpo) |
| Product.brand_id → Brand | FK id only — **não** impede Brand de outra org | App deve validar `brand.organization_id = product.organization_id` (Phase 3) |
| Product.category | Idem | App Phase 3 |
| Variant ↔ product org | Ambos têm `organization_id`; **sem** constraint composta | App Phase 3 |
| Price entry ↔ list/variant | Idem | App Phase 3 |
| UOM platform (`organization_id` null) | SELECT aberto a authenticated | Conforme migration; insert org-only |

**Normativo:** `EngineeringGovernance` / `DomainContracts` colocam tenant + `can` na aplicação; RLS é última linha (AP10). Risco residual de FK cross-org **documentado**, não inventada trigger nova nesta sprint.

---

## 9. Conformidade de RLS

| Verificação | Status |
|---|---|
| Policies SELECT/INSERT/UPDATE por tabela | Presentes no SQL (revisão estática) |
| price_history sem UPDATE/DELETE | Confirmado no SQL |
| UOM platform SELECT | Confirmado no SQL |
| Testes runtime membro A vs B | **NÃO EXECUTADOS** |
| Testes anon / sem membership | **NÃO EXECUTADOS** |
| Testes cross-org insert/update | **NÃO EXECUTADOS** |

---

## 10. Conformidade de Pricing

| Critério | Status |
|---|---|
| Preço só em `price_list_entry` | OK |
| Sem `list_price` em product/variant | OK |
| `numeric(19,6)`, `amount >= 0`, currency BRL | OK |
| Entry → variant | OK |
| Open entry única | OK |
| `valid_to > valid_from` | OK |
| `price_history` append-only | OK (grants/policies) |

---

## 11. Conformidade dos tipos

| Critério | Status |
|---|---|
| `generated.ts` via `supabase gen types typescript --linked` | OK (pós-fix) |
| Sem prefixo npm warn / lixo | OK |
| Contém tabelas Catalog; product sem topology/default_uom | OK |
| Aliases Catalog (`BrandRow`, etc.) | **Removidos** — não previstos na Phase 2; adiados à Phase 3 se necessário |
| `ProductRow` legado | Mantém só `status: ProductStatus`; colunas novas fluem de `Tables<'product'>` |
| Imports funcionais dos aliases Catalog | Nenhum (grep limpo) |

---

## 12. Evidência de não uso operacional

Busca em `apps/web/src` por `.from('brand'|…|product_variant|price_list|…)` e uso em modules products/inventory: **zero matches**.

- `modules/products/**` — sem brand_id/lifecycle/variant tables  
- `modules/inventory/**` — sem Catalog tables  
- Sem `supabase/functions`  
- `modules/catalog/**` — apenas domínio puro Phase 1 (sem I/O)  
- Build continua servindo Products/Inventory legados  

**Conclusão:** nenhum fluxo operacional usa o novo Catalog.

---

## 13. Divergências encontradas

1. Colunas `topology` e `default_unit_of_measure_id` no Product — **não autorizadas** em §8.2/§8.5.  
2. Aliases Catalog prematuros em `packages/database` — fora do escopo Phase 2.  
3. Banco limpo / RLS runtime / determinismo — **não verificáveis** sem Docker.  
4. Coerência organizacional cross-FK — não enforce no DB (risco residual aceito até Phase 3 app).  
5. Migration `20260725050000` foi **editada após apply** no vinculado; histórico remoto aplicou versão antiga + fix drop. Greenfield usa SQL corrigido. Risco: drift de checksum se a CLI validar hash do arquivo antigo — monitorar no próximo `db push`/`repair`.

---

## 14. Correções realizadas

| Ação | Arquivo |
|---|---|
| Remover topology e default_uom do SQL base | `20260725050000_catalog.sql` |
| Drop no ambiente vinculado | `20260725180000_catalog_phase2_validation_fix.sql` (aplicada) |
| Remover aliases Catalog | `packages/database/src/types.ts`, `index.ts` |
| Regenerar tipos | `packages/database/src/generated.ts` |
| Clarificar §8.2 / Decision C | `CatalogImplementationPlan.md` |
| Este relatório | `CatalogPhase2Validation.md` |

---

## 15. Riscos residuais

| Risco | Severidade | Mitigação |
|---|---|---|
| Reproducibilidade desde zero não comprovada | **Alta** | Bloquear Phase 3 até `supabase db reset` ×2 |
| RLS não testada em runtime | **Alta** | Suite SQL/pgTAP ou testes integração pós-Docker |
| FK cross-org | Média | Validação app Phase 3; considerar exclusion constraint depois se ADR autorizar |
| Checksum migration 50000 editada | Baixa/Média | `migration repair` se CLI reclamar |
| Ambiente vinculado sem label prod/staging | Média | Rotular projeto; não resetar remoto |

---

## 16. Veredito da Phase 2

### Aprovado parcialmente (documental / estático — 015.1)

- Schema Catalog alinhado ao plano após remoção das colunas indevidas  
- Pricing/Variant constraints estáticas OK  
- Tipos limpos regenerados do vinculado  
- Não uso operacional comprovado  
- Inventory/Sales/Products legado sem mudança funcional  
- Sem dual-write / sem migração de dados  
- Gates app (015.1): typecheck, lint, 185 tests, build — **OK**

### Não aprovado (obrigatório 015.1 + 015.2)

| Critério | 015.1 | 015.2 |
|---|---|---|
| Reset 1 desde zero | Não | **Bloqueado** (sem ambiente) |
| Reset 2 / determinismo | Não | **Bloqueado** |
| RLS runtime | Não | **Bloqueado** |
| Multi-tenant runtime | Não | **Bloqueado** |
| Constraints runtime | Não | **Bloqueado** |
| Schema drift limpo ↔ remoto | Não | **Bloqueado** |
| Seeds determinísticos | N/A (sem seed Catalog além de UOM na migration) | **Bloqueado** |

### Sprint 015.2 — resultados por etapa

| Etapa | Resultado |
|---|---|
| 1. Banco limpo | **NÃO EXECUTADO** |
| 2. Segunda execução | **NÃO EXECUTADO** |
| 3. Schema verification runtime | **NÃO EXECUTADO** |
| 4. Testes multi-tenant | **NÃO EXECUTADO** |
| 5. Coerência entre orgs | **NÃO EXECUTADO** |
| 6. Invariantes runtime | **NÃO EXECUTADO** |
| 7. Legado runtime em limpo | **NÃO EXECUTADO** |
| 8. Schema drift | **NÃO EXECUTADO** |
| 9. Tipos a partir do limpo | **NÃO EXECUTADO** |

---

## 17. Autorização da Phase 3

# **PHASE 3 BLOQUEADA**

A Phase 3 **não pode iniciar** até:

1. Ambiente descartável disponível — **uma** das opções:
   - instalar/iniciar Docker Desktop e `npx supabase start` + `db reset` ×2; **ou**
   - liberar slot free tier (pausar/apagar `ars-guardian` se descartável) e criar projeto temporário `rescript-catalog-p2-val`; **ou**
   - fornecer PostgreSQL descartável oficialmente aceito pela equipe;
2. Duas execuções limpas determinísticas com todas as migrations;
3. Suite RLS + multi-tenant + constraints em runtime verdes;
4. Tipos gerados do limpo alinhados ao remoto;
5. Este documento atualizado com veredito **PHASE 3 LIBERADA**.

**Desbloqueio sugerido (ordem preferida):** instalar Docker Desktop → `npx supabase start` → `npx supabase db reset` (×2) → suite de testes SQL/SDK → regenerar tipos → reabrir Sprint 015.2.

---

## Apêndice A — Gates

### A.1 Sprint 015.1

| Gate | Resultado |
|---|---|
| typecheck | OK |
| lint | OK |
| test (185) | OK |
| build | OK |
| db reset ×2 | **NÃO EXECUTADO** |
| RLS runtime | **NÃO EXECUTADO** |
| multi-tenant runtime | **NÃO EXECUTADO** |

### A.2 Sprint 015.2

| Gate | Comando / ação | Resultado |
|---|---|---|
| Pré-condição Docker | `docker version` | **FAIL** — comando não encontrado |
| Pré-condição projeto temp | `supabase projects create rescript-catalog-p2-val …` | **FAIL** — free project limit (2) |
| Reset 1 | — | **NÃO EXECUTADO** |
| Reset 2 | — | **NÃO EXECUTADO** |
| Testes RLS / multi-tenant / constraints | — | **NÃO EXECUTADO** |
| typecheck / lint / test / build | Não reexecutados (sem mudança de código) | N/A nesta sprint |

## Apêndice B — Arquivos

**Revisados (015.1 + 015.2):** CatalogDomainStrategy, CatalogImplementationPlan, EngineeringGovernance, DomainContracts, DependencyRules, ArchitectureDecisionLog, CatalogPhase2Validation, ADRs 0020–0025, migrations `20260725010000`…`20260725180000`, modules/catalog, packages/database/\*, docs/development/DatabaseLive.md.

**Alterados 015.1:**  
`supabase/migrations/20260725050000_catalog.sql`,  
`supabase/migrations/20260725180000_catalog_phase2_validation_fix.sql`,  
`packages/database/src/generated.ts`,  
`packages/database/src/types.ts`,  
`packages/database/src/index.ts`,  
`docs/architecture/CatalogImplementationPlan.md`,  
`docs/architecture/CatalogPhase2Validation.md`.

**Alterados 015.2:**  
somente `docs/architecture/CatalogPhase2Validation.md` (registro do bloqueio runtime).  
Nenhuma migration, tipo, domínio ou app alterados.
