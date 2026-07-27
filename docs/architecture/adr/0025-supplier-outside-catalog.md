---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0025-supplier-outside-catalog
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0025 — Supplier fora do Catalog

**Status:** Aceito · **Reversibilidade:** MÉDIA  
**Data:** 2026-07-25 · **Fase:** Catalog Phase 0 — Governance

## Contexto

Cadastros de produto frequentemente embutem fornecedor. Compras, POs e custos de aquisição pertencem a outro ciclo de vida. Incluir Supplier no Catalog misturaria merchandising com procurement.

## Problema

Onde vive o relacionamento com fornecedor?

## Alternativas

- **A. Supplier como entidade do Catalog** ligada a Product.
- **B. Supplier como campo texto em Product.**
- **C. Supplier no futuro Bounded Context Procurement; Catalog só aceita `SupplierReference` opcional via ACL, sem dono de verdade de compras.**

## Decisão

**(C).**

1. Catalog **não** modela Aggregate Supplier no MVP nem no modelo canônico.
2. Compras, cotações, lead time e custo de aquisição são **Procurement** (futuro).
3. Se necessário vínculo leve, Catalog guarda apenas referência opaca (`supplier_ref`) via port ACL — sem regras de compra.
4. Custo médio de estoque permanece **Inventory** (ADR-0016), não “custo do fornecedor” no Catalog.
5. Imports de planilha com coluna fornecedor mapeiam para Procurement ou ignoram até existir o contexto.

## Justificativa

(A)/(B) criam falso dono e atrasam um BC de compras correto. (C) preserva CAT-P02 (um dono por verdade).

## Consequências positivas

- Catalog permanece sobre “o que se vende”.
- Procurement pode evoluir sem remodelar Product.

## Consequências negativas

- Lojas que hoje anotam fornecedor no produto perdem campo até Procurement/campo auxiliar explícito de produto (não-Supplier).

## Riscos

- Pressão de produto para “só um campo fornecedor” no Catalog — exige ADR se reabrir.

## Gatilhos de revisão

- Primeiro cliente com fluxo de compra recorrente exigindo PO.
- Integração com marketplace/vendor catalogs.
