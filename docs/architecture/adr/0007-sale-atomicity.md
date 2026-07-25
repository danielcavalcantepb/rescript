# ADR-0007 — Atomicidade da Transação de Venda

**Status:** Aceito · **Reversibilidade:** BAIXA (cara de mudar) — decisão estrutural

## Contexto
Confirmar venda é a operação mais crítica: afeta estoque, financeiro, histórico e eventos. Detalhes em `../SaleTransaction.md`.

## Problema
Como garantir que confirmar venda seja atômica, idempotente, auditável e resistente a falhas parciais e cliques duplos?

## Alternativas
- **A. Transação única de banco** para os efeitos essenciais + outbox na mesma transação + efeitos secundários assíncronos.
- **B. Orquestração por passos assíncronos** (cada efeito em um job).
- **C. Saga distribuída.**

## Decisão
**(A)** Dentro de uma transação: validações (incl. política de desconto — ADR-0019), **conversão de reserva em saída** (ou baixa direta se não houver reserva), geração de recebível, pagamento à vista, mudança de situação para **Confirmada**, histórico/auditoria e **gravação dos eventos na outbox**. Efeitos secundários (insights, notificações, fiscal) ocorrem **depois**. Idempotência por chave. **Estoque e financeiro nunca dependem de job posterior.**

Sale **não** edita ledgers de Inventory/Receivable diretamente — coordenação via `SaleConfirmationService` / serviços de domínio (ADR-0018: Sale único no MVP, sem Order).

## Justificativa
(B) arrisca estado parcial — inaceitável (AP20). (C) saga desnecessária no monólito. Reserva no MVP (ADR-0017) exige que a confirmação consuma reserva e gere saída no mesmo ato atômico.

## Consequências positivas
- Sem estado parcial; sem duplicação (idempotência).
- Operação diária correta mesmo se o assíncrono cair.
- Ciclo orçamento/pedido → confirmada com compromisso de estoque.

## Consequências negativas
- Transação concentra complexidade (encapsulada, AP19).
- Locks de estoque introduzem contenção pontual.

## Riscos
R6 (complexidade da venda), R2 (consistência) — cobertos por testes obrigatórios (`../TestingStrategy.md` §4).

## Gatilhos de revisão
- Contenção de locks em escala.
- Extração de Order (ADR-0018).
- Novos efeitos que exijam repensar a linha síncrono/assíncrono.
