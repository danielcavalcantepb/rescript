---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 08-ConfirmSale
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 08 — Confirmar Venda (Atomicidade)

## Cenário

Pedido com reserva ativa é confirmado; validar que consumo de reserva, saída física, custo histórico, recebível e pagamento à vista ocorrem **dentro de uma transação**; outbox na mesma TX; falha parcial impossível no núcleo.

### Objetivo
Validar RN-44, RN-80, S3, X1, ADR-0007 — atomicidade síncrona vs. assíncrono apenas para secundários.

### Atores
- Vendedor
- SaleConfirmationService (domínio)

### Estado inicial
Sale Pedido; Reservation active qty=4; físico=10, reservado=4, disponível=6; condição à vista; idempotency_key gerada.

### Pré-condições
- `sales.confirm`
- Desconto autorizado (FD-05)
- Entitlement ativo

### Passos executados

#### 1. ConfirmSale — transação única (ADR-0007 opção A)
1. **Comando:** `ConfirmSale` (idempotency_key)
2. **Autorização:** `sales.confirm`; recheck membership início TX
3. **Validações:** estado ∈ {Rascunho, Orçamento, Pedido}; S2; desconto S7; estoque conforme política; totais recalculados (snapshot preços no confirm)
4. **Consultadas:** Sale+items, Reservation, balances, avg cost, DiscountPolicy, idempotency store
5. **Criadas (mesma TX):** InventoryMovement(s) saída com **custo unitário aplicado** (= média vigente — FD-01); Receivable + Installment; Payment + Allocation + FinancialEntry (à vista); AuditEntry; Outbox rows
6. **Alteradas (mesma TX):** Reservation→Consumed; físico 10→6; reservado 4→0; disponível 6→6; Sale→Confirmada
7. **Locks:** pessimista balances variant_ids **ordenados**; sale row; receivable creation
8. **Auditoria:** trilha completa confirmação (RN-03)
9. **Eventos (outbox):** `SaleConfirmed`, `InventoryMoved`, reservation consumed, `ReceivableCreated`, `PaymentRegistered`
10. **Outbox:** gravado **na mesma transação** que efeitos essenciais (ADR-0009)
11. **Derivados:** margem por linha; situação recebível Quitado (à vista); caixa atualizado
12. **Insight:** vendas do dia (job assíncrono pós-commit)
13. **Falha:** qualquer passo falha → **rollback total**; Sale permanece Pedido
14. **Recuperação:** retry com mesma idempotency_key (cenário 09)

#### 2. Delimitação síncrono vs assíncrono
| Efeito | Dentro da TX | Após commit |
|---|---|---|
| Consumir reserva | ✓ | |
| Saída física + custo aplicado | ✓ | |
| Receivable/Payment | ✓ | |
| Sale=Confirmada | ✓ | |
| Outbox insert | ✓ | |
| Insights/notificações/fiscal | | ✓ (workers) |

1. **Comando:** n/a (documentação de fronteira)
2. **Autorização:** n/a
3. **Validações:** estoque/financeiro **nunca** dependem de job posterior (ADR-0007)
4. **Consultadas:** ADR-0007, Invariants X1
5–14. **Nucleo:** falha assíncrona não desfaz confirmação — aceitável para insights; inaceitável se estoque pendesse de job.

#### 3. Cenário de falha simulada (rollback)
1. **Comando:** ConfirmSale com erro forçado após movimento (teste)
2. **Autorização:** idem
3. **Validações:** TX aborta
4. **Consultadas:** estado pós-rollback
5. **Criadas:** nenhuma parcial persistida
6. **Alteradas:** Sale ainda Pedido; reserva ainda active; saldos inalterados
7. **Locks:** liberados no rollback
8. **Auditoria:** falha registrada
9. **Eventos:** nenhum publicado
10. **Outbox:** nenhuma row órfã
11. **Derivados:** nenhum recebível fantasma
12. **Insight:** nenhum
13. **Falha:** parcial impossível — **pass**
14. **Recuperação:** retry idempotente

### Estado final esperado
Sale Confirmada; Reservation Consumed; físico=6, reservado=0, disponível=6; movimento saída imutável com custo; recebível quitado; outbox pendente processamento.

### Invariantes verificadas
S3, S6, I5, I6, I8, R1, R5, X1, RN-80, G3; custo na saída ≠ alteração da média (FD-01 regra 3).

### Inconsistências encontradas
- Confirmação direta de Rascunho sem reserva prévia: ADR-0007 permite baixa direta — caminho alternativo não exercitado aqui; deve validar lock de disponível igualmente.
- **HYPOTHESIS** negative FORBIDDEN: confirmação sem reserva prévia com disponível insuficiente falha; RN-34 default alerta only.

### Ajustes recomendados
- Teste explícito ConfirmSale from Rascunho sem reservation.
- Métrica de duração TX e contenção de locks (ADR-0007 riscos).

### Classificação
**aprovado com ressalvas**
