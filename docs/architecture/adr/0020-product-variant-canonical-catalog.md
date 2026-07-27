---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0020-product-variant-canonical-catalog
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0020 — Product/Variant como modelo canônico do Catalog

**Status:** Aceito · **Reversibilidade:** BAIXA (cara de mudar)  
**Data:** 2026-07-25 · **Fase:** Catalog Phase 0 — Governance  
**Supersede (parcial):** `SalesDomainDesign.md` D-01 e trechos que usam `product_id` como unidade vendável/estocável da linha; interpretações flat de `ModuleBoundaries.md` §4.2–4.3 quanto à identidade operacional.

## Contexto

O código legado modela um `product` flat (SKU, unit, category texto) e o Inventory referencia `product_id`. Documentos de domínio aspiracional e ADR-0005 já apontam estoque na **ProductVariant**. O beachhead varejo (moda) exige cor/tamanho. `CatalogDomainStrategy.md` fechou o modelo; falta formalização ADR para impedir implementação divergente.

## Problema

Qual é a identidade canônica comercial, vendável e estocável no Rescript?

## Alternativas

- **A. Manter Product flat** — SKU/estoque/venda no Product; variantes depois.
- **B. Dual model** — Product simples flat + Variant só quando necessário.
- **C. Product (família) + Variant (única identidade vendável/estocável/precificável), com default Variant invisível para produtos simples.**

## Decisão

**(C).**

1. **Catalog** é Bounded Context; Product é Aggregate Root da família comercial.
2. **Variant** é a única unidade vendável, precificável e estocável.
3. Todo Product tem ≥1 Variant; produto simples usa default Variant (UI pode ocultá-la).
4. **SKU e Barcode** pertencem à Variant, nunca ao Product.
5. **SaleItem** referencia `variant_id`; `product_id` permanece apenas como dimensão/snapshot.
6. **Inventory** (ledger, balance, reservation, locks) opera por `variant_id` após cutover (ADR-0023).
7. Novos Variant IDs são gerados; **proibido** reutilizar `product.id` como `variant.id`.
8. Sales real **não inicia** antes do cutover Inventory → Variant (`CatalogImplementationPlan` Fase 8).

## Justificativa

(A) bloqueia o beachhead moda e contradiz ADR-0005. (B) cria duas identidades estocáveis e dual-write eterno. (C) unifica simples e variável sob um contrato estável para Sales, Inventory, Search e Metrics.

## Consequências positivas

- Um contrato para todos os consumidores operacionais.
- Default Variant preserva UX simples.
- Alinha InventoryArchitecture, RetailDomainStrategy e CatalogDomainStrategy.

## Consequências negativas

- Cutover obrigatório do ledger legado (ADR-0023).
- Rework de UI/repos Products e Inventory.
- SalesDomainDesign deve ser lido com esta correção até republicação.

## Riscos

- Implementação parcial deixando Product stockable — **gate de merge** em `EngineeringGovernance.md`.
- Antecipar Sales no flat — proibido pelo plano de implementação.

## Gatilhos de revisão

- Multi-local / transferências exigindo identidade composta além de Variant.
- Catálogo compartilhado entre organizações (enterprise).
