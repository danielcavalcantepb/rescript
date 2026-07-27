---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0018-sale-without-order-aggregate
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0018 — Sale Único no MVP (sem agregado Order)

**Status:** Aceito · **Reversibilidade:** média (Order pode ser extraído depois)

## Contexto
Orçamento, pedido e venda poderiam ser agregados distintos. FD-03 decide consolidar no MVP.

## Problema
Como modelar o ciclo comercial pré e pós-confirmação sem fragmentação prematura nem um “god aggregate”?

## Alternativas
- **A. Sale único** com máquina de estados rica (rascunho → orçamento → pedido → confirmada → cancelada + terminais).
- **B. Order + Sale** como agregados separados desde o MVP.
- **C. Documentos distintos sem relação de domínio clara.**

## Decisão
**(A)** Um agregado **Sale** no MVP. Sem agregado Order. UI pode rotular fases (Orçamento/Pedido). Sale **não** edita ledgers de Inventory/Receivable diretamente — coordenação via serviços de domínio. Extração de Order só com necessidade operacional comprovada.

## Justificativa
Obsessão por simplicidade; orçamento/pedido são fases da mesma intenção até a confirmação. Extrair Order cedo cria sincronização e fronteiras sem ganho.

## Consequências positivas
- Modelo comercial único e coerente.
- Menos coordenação entre agregados no pré-confirmação.

## Consequências negativas
- Máquina de estados da Sale mais elaborada; disciplina para não inchá-la com fulfillment futuro.

## Riscos
Sale virar agregado gigante — mitigado por manter Inventory/Receivable separados e regras de fase encapsuladas.

## Gatilhos de revisão
Fulfillment complexo, múltiplas entregas, backorder, aprovação comercial, picking avançado, canais externos.
