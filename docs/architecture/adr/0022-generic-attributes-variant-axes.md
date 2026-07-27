---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0022-generic-attributes-variant-axes
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0022 — Sistema genérico de atributos e Variant Axes

**Status:** Aceito · **Reversibilidade:** MÉDIA  
**Data:** 2026-07-25 · **Fase:** Catalog Phase 0 — Governance

## Contexto

Varejo moda exige Cor/Tamanho; outros segmentos exigem Volume, Aroma, Material. Colunas fixas por segmento acoplariam o schema ao beachhead.

## Problema

Como modelar variação sem schema por vertical?

## Alternativas

- **A. Colunas fixas** (`color`, `size`, …) no Product/Variant.
- **B. JSON livre** de atributos na Variant.
- **C. AttributeDefinition/Option org-scoped + Variant Axes por Product + valores na Variant.**

## Decisão

**(C).**

1. `AttributeDefinition` e `AttributeOption` são Aggregate Roots (ou agregado de definição) no Catalog, escopo organização.
2. Product declara **eixos** (`ProductVariantAxis`) referenciando definitions.
3. Cada Variant materializa uma combinação de opções; `combination_hash` garante unicidade no Product.
4. Presets de segmento (moda etc.) são **dados/config de onboarding**, nunca branches de domínio.
5. Limits de eixos/combinações são policy/entitlement (CAT-P07).
6. Sales congela labels/IDs de atributos no snapshot; não reconsulta definição para história.

## Justificativa

(A) não escala entre segmentos. (B) inviabiliza unicidade, facetas e validação. (C) é genérico e queryable.

## Consequências positivas

- Mesmo núcleo para moda, perfumaria, limpeza, etc.
- Busca faceted e Metrics por dimensão de atributo via snapshot.

## Consequências negativas

- Complexidade de UI (matrix wizard).
- Risco de explosão combinatória — limits obrigatórios.

## Riscos

- Preset virar regra de código — proibido (anti-pattern documentado).
- Mudança de topologia após vendas — ProductTopologyPolicy / lock histórico.

## Gatilhos de revisão

- Necessidade de atributos no Product (não-eixo) além do modelo atual.
- Escala enterprise com milhares de Variants por Product.
