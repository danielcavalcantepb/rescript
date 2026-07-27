---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0021-price-lists-single-source
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0021 — Price Lists como fonte única de preço

**Status:** Aceito · **Reversibilidade:** BAIXA (cara de mudar)  
**Data:** 2026-07-25 · **Fase:** Catalog Phase 0 — Governance  
**Supersede (parcial):** `RetailDomainStrategy.md` trechos que colocam preço “na variante” ou `list_price` como coluna canônica; `ModuleBoundaries.md` §4.2 quanto a “definir preço” no Product.

## Contexto

Não existe preço no schema atual. Retail e ModuleBoundaries sugerem preço no Product/Variant. CatalogDomainStrategy CAT-D05 fechou: preço pertence a Price List.

## Problema

Onde vive o preço de lista e quem é dono da verdade de preço atual?

## Alternativas

- **A. Coluna `list_price` em Product.**
- **B. Coluna `list_price` em Variant.**
- **C. `PriceList` + `PriceListEntry` endereçada por `variant_id`; org tem exatamente uma lista padrão no MVP.**

## Decisão

**(C).**

1. Preço **não** é coluna de Product nem de Variant.
2. Toda organização possui exatamente uma **Price List padrão** no MVP.
3. Preço efetivo = `PriceListEntry` vigente para `(price_list_id, variant_id)`.
4. Resolução externa apenas via `PriceResolutionPort`.
5. Ativação de Variant/Product exige preço efetivo na lista padrão (`CatalogActivationService`).
6. Histórico = novos intervalos / `PriceHistory`; não reescreve passado.
7. Preço praticado na Sale (desconto, unit_price) é de **Sales**; lista é input via port + snapshot.
8. Permissão `products.price` governa alteração de preço (nomenclatura legada de keys).

## Justificativa

(A)/(B) impedem múltiplas listas, vigência e auditoria limpa. (C) escala para canal/região sem remodelar Variant e impede “preço secreto” em colunas.

## Consequências positivas

- Evolução para múltiplas listas sem breaking change de identidade.
- Finance/Metrics nunca recalculam receita pelo preço atual do catálogo.
- Fronteira clara Catalog Pricing ↔ Sales.

## Consequências negativas

- Join/port obrigatório para exibir preço.
- Backfill de preço no cutover/ativação.

## Riscos

- Variant ativa sem entry — mitigado por ActivationService + constraint/app gate.
- Money float — Money decimal obrigatório antes de Pricing (`CatalogImplementationPlan` Fase 4).

## Gatilhos de revisão

- Múltiplas Price Lists / vigência por canal (Catalog V2).
- Preço promocional temporário além de lista.
