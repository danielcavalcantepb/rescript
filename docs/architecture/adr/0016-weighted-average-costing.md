# ADR-0016 — Custeio por Custo Médio Ponderado

**Status:** Aceito · **Reversibilidade:** média (método pode evoluir; histórico de custo aplicado é permanente)

## Contexto
Saídas precisam de custo para margem. PEPS, custo por entrada e médio foram avaliados. Decisão do fundador: FD-01 (`docs/domain/FounderDecisions.md`).

## Problema
Como atribuir custo a saídas de forma auditável, reconstruível e sem edição silenciosa de histórico?

## Alternativas
- **A. Custo médio ponderado** recalculado a cada entrada com custo.
- **B. Custo da última entrada.**
- **C. PEPS (FIFO).**

## Decisão
**(A)** Custo médio ponderado por variante. Saídas gravam o custo médio vigente no movimento. PEPS fora do MVP. Histórico de custo aplicado é imutável; correções via movimentos compensatórios.

## Justificativa
Simplicidade operacional + rastreabilidade suficiente para o beachhead. PEPS adiciona camadas sem benefício no MVP.

## Consequências positivas
- Margem explicável; ledger + histórico de média reconstruíveis.
- Devoluções/estornos tratáveis sem reescrever o passado.

## Consequências negativas
- Entradas sem custo e ajustes exigem regras explícitas (FD-01).

## Riscos
Cálculo incorreto de média sob concorrência — mitigado por lock na entrada/saída do InventoryItem.

## Gatilhos de revisão
Exigência de PEPS; multi-depósito com custeio distinto; demanda contábil específica.
