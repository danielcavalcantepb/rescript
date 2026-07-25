# ADR-0005 — Estoque como Ledger

**Status:** Aceito · **Reversibilidade:** BAIXA (cara de mudar) — decisão estrutural

## Contexto
Estoque é área crítica; a confiança nos dados é a tese do produto. Precisamos de saldo auditável, reconstruível e correto sob concorrência. Detalhes em `../InventoryArchitecture.md`.

## Problema
Como representar o saldo de estoque de forma auditável, reconstruível e consistente sob concorrência?

## Alternativas
- **A. Ledger append-only de movimentações + saldo derivado/materializado.**
- **B. Saldo como coluna mutável** (UPDATE direto).
- **C. Event sourcing completo do estoque.**

## Decisão
**(A) Ledger de movimentações físicas/compensatórias como fonte de verdade** do saldo físico; **Reservation é entidade distinta** (não é tipo de movimento físico — ADR-0017). Saldos físico/reservado/disponível são **derivados** e reconstruíveis. Unidade estocável = **ProductVariant** (variante padrão se não houver variações). Custeio = **custo médio ponderado** (ADR-0016 / FD-01). Concorrência: lock pessimista por variante.

## Justificativa
(B) é impossível de auditar e frágil sob concorrência — proibido (AP17). (C) event sourcing universal é complexo demais. Reserva como movimento físico contaminaria o ledger. Custo médio (FD-01) fecha o método de custeio sem PEPS no MVP.

## Consequências positivas
- Auditoria e rastreabilidade totais; base para insights confiáveis.
- Reconstrução/reconciliação de saldo e de custo aplicado.
- Correção auditável (compensação, nunca edição silenciosa).

## Consequências negativas
- Mais escrita (uma linha por movimento) e volume no ledger.
- Precisa de materialização para leitura rápida.
- Ciclo de reserva a manter (expiração/liberação).

## Riscos
R2 (inconsistência), R8 (performance em escala — mitigada por particionamento/materialização, `../Scalability.md`).

## Gatilhos de revisão
- Exigência de PEPS ou método alternativo (ADR-0016).
- Multi-depósito/transferências.
- Volume exigindo particionamento do ledger.
