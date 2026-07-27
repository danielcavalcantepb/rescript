---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0023-inventory-product-to-variant-cutover
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0023 — Migração do estoque Product→Variant com cutover único

**Status:** Aceito · **Reversibilidade:** BAIXA (cara de mudar)  
**Data:** 2026-07-25 · **Fase:** Catalog Phase 0 — Governance  
**Referência operacional:** `CatalogImplementationPlan.md` Fase 6.

## Contexto

O ledger e balances atuais usam `product_id`. O modelo canônico (ADR-0020, ADR-0005) exige `variant_id`. Dual-write Product+Variant é tentador e destrutivo.

## Problema

Como migrar a identidade estocável sem corromper saldo nem manter duas verdades?

## Alternativas

- **A. Dual-write** — gravar Product e Variant por um período; ler de um ou outro.
- **B. Expand-contract longo** — colunas paralelas com sync contínuo por semanas.
- **C. Expand → backfill → cutover único com freeze → reconcile 100% → contract; sem dual-write operacional.**

## Decisão

**(C).**

1. **Proibido dual-write** de movimentos/balances em Product e Variant.
2. Antes do cutover: criar default Variant por Product legado; mapa `product_id → default_variant_id`; **não** reutilizar IDs.
3. Cutover em janela com **write freeze** de Inventory.
4. Remapear `inventory_movement` e `inventory_balance` para `variant_id` na mesma operação controlada.
5. RPC/`register_inventory_movement` e locks passam a `variant_id`.
6. Critério de sucesso:  
   `∀ variant: balance.quantity == compute_variant_stock(variant)` e paridade de contagens/somas pré/pós.
7. Abortar e restaurar backup se reconcile ≠ 100% **antes** de reabrir writes.
8. Após writes em Variant, rollback = forward-fix (não reintroduzir Product stockable).
9. Sales real só após cutover estável (Fase 8 do plano).

## Justificativa

(A)/(B) criam divergência silenciosa e invalidam ledger. (C) aceita downtime curto em troca de uma verdade.

## Consequências positivas

- Uma identidade estocável a partir do go-live.
- Runbook e critérios objetivos de Go/No-Go.

## Consequências negativas

- Janela de manutenção.
- Exige ensaio em staging com dump realista.

## Riscos

- Downtime maior que o estimado — medir no ensaio.
- SKUs legados edge-case — relatório pré-cutover.
- Improvisação em produção — proibida; só runbook aprovado.

## Gatilhos de revisão

- Volume de movements que torne cutover single-TX inviável (estratégia batch/chunk com freeze estendido).
- Multi-local antes do cutover (não previsto; cortar escopo).
