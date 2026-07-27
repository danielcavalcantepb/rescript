---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0024-operational-search-projection
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0024 — Busca operacional por projeção

**Status:** Aceito · **Reversibilidade:** MÉDIA  
**Data:** 2026-07-25 · **Fase:** Catalog Phase 0 — Governance

## Contexto

Balcão varejo exige localizar Variant por nome, marca, SKU, barcode e atributos. Consultar joins transacionais ad hoc não escala e mistura disponibilidade (Inventory) com identidade (Catalog).

## Problema

Como servir busca operacional sem tornar o índice fonte de verdade nem acoplar Catalog a Inventory?

## Alternativas

- **A. Queries ad hoc** nas tabelas transacionais a cada keystroke.
- **B. Motor externo obrigatório** (Elastic/Meilisearch) desde o MVP.
- **C. Projeção `CatalogSearchPort` por Variant (PostgreSQL FTS/trigram no MVP); disponibilidade enriquecida via batch Inventory; índice reconstruível.**

## Decisão

**(C).**

1. Documento de busca é **projeção** por Variant — não Aggregate Root.
2. Catalog permanece fonte da identidade; Inventory da disponibilidade; Pricing do preço atual.
3. Consumo externo apenas via `CatalogSearchPort`.
4. Reindex por eventos (`CatalogItemReindexRequested`, price/variant changes); MVP pode ser sync na mesma TX se volume permitir.
5. Disponibilidade **não** é verdade canônica no documento; pode ser denormalizada com TTL/enrichment e sempre reconciliável.
6. Evolução para motor externo é troca de adapter por trás do mesmo port.
7. Tenant isolation / RLS aplicam-se à projeção.

## Justificativa

(A) degrada UX e acopla. (B) é infra prematura. (C) honra AP17 (derivado ≠ verdade) e CAT-P08.

## Consequências positivas

- Troca tecnológica sem mudar Sales/UI contracts.
- Facetas Brand/Category/atributos estáveis.

## Consequências negativas

- Risco de índice stale — fallback SQL + jobs.
- Custo de manutenção de projeção.

## Riscos

- Vazamento multi-tenant — testes obrigatórios.
- UI ler tables de search direto — proibido (anti-pattern).

## Gatilhos de revisão

- p95 acima do SLO com PostgreSQL.
- Necessidade de ranking ML / sinônimos enterprise.
