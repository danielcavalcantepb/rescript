---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 14-CancelAfterPayment
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 14 — Cancelar Após Pagamento

## Cenário

Venda confirmada com pagamento total registrado; tentativa de cancelamento exige **estorno financeiro explícito** ou bloqueio; ordem das operações e consistência estoque/financeiro.

### Objetivo
Validar RN-46, R7, R8, StateMachines T9 "pagamentos exigem estorno explícito" — lacunas de ordem operacional.

### Atores
- Gerente Financeiro
- Gerente Comercial

### Estado inicial
Sale Confirmada R$ 2.000 à vista; Payment confirmed R$ 2.000; Receivable Quitado; saída estoque qty=8; caixa reflete entrada.

### Pré-condições
- Pagamento não estornado
- Permissões `sales.cancel`, `payments.reverse`

### Passos executados

#### 1. Tentativa CancelSale sem estorno prévio
1. **Comando:** `CancelSale` sem `ReversePayment`
2. **Autorização:** `sales.cancel`
3. **Validações:** recebível quitado com pagamentos ativos → **bloqueio** ou fluxo composto (lacuna)
4. **Consultadas:** Payment status=confirmed, Receivable Quitado
5. **Criadas:** nenhuma (se bloqueado corretamente)
6. **Alteradas:** nenhuma
7. **Locks:** sale + receivable
8. **Auditoria:** tentativa negada
9. **Eventos:** nenhum
10. **Outbox:** n/a
11. **Derivados:** caixa intacto
12. **Insight:** n/a
13. **Falha esperada:** erro claro "estorne pagamentos antes" **ou** cancelamento atômico composto
14. **Recuperação:** fluxo 2

#### 2. Fluxo composto (recomendado — uma TX)
1. **Comando:** `CancelSale` com flag `reverse_payments=true` **ou** sequência atômica: `ReversePayment` → `CancelSale`
2. **Autorização:** `sales.cancel` + `payments.reverse`
3. **Validações:** ordem dentro da **mesma transação** (X2): (a) estorno pagamento; (b) estorno estoque; (c) cancel recebível; (d) Sale Cancelada
4. **Consultadas:** Payment, Allocation, FinancialEntry, movimentos saída
5. **Criadas:** Payment estorno (`reverses_payment_id`); movimento estorno estoque; FinancialEntry negativo
6. **Alteradas:** Payment→reversed; Receivable→Cancelado; Sale→Cancelada; físico restaurado
7. **Locks:** ordered: receivable → payment → inventory variants
8. **Auditoria:** trilha completa estorno + cancelamento
9. **Eventos:** `PaymentReversed`, `SaleCancelled`, estorno estoque
10. **Outbox:** caixa/insights async
11. **Derivados:** caixa net zero para a venda; histórico pagamento preservado (R7 append-only)
12. **Insight:** recebimento estornado
13. **Falha:** estorno ok + cancel falha → **inaceitável**; deve rollback
14. **Recuperação:** TX única

#### 3. Ordem inversa proibida (anti-pattern)
1. **Comando:** CancelSale estoque primeiro, pagamento depois (jobs separados)
2. **Autorização:** n/a
3. **Validações:** viola RN-80/X2 se caixa inconsistente temporariamente exposto
4–14. **Rejeitar arquitetura** — documentar como failure mode

### Estado final esperado
Sale Cancelada; pagamento estornado (não apagado); recebível Cancelado; estoque compensado; caixa consistente; histórico completo.

### Invariantes verificadas
G2, R7, R8, I7, X2, RN-46; estorno é compensação, não delete.

### Inconsistências encontradas
- **UNDERSPECIFIED:** StateMachines diz "pagamentos exigem estorno explícito" mas não define se CancelSale **orquestra** estorno automaticamente ou exige passo manual — **decisão do fundador necessária**.
- Pagamento parcial + cancelamento (overlap cenário 15) não totalmente fechado: cancelar com saldo parcial pago exige estorno proporcional?
- **HYPOTHESIS** Money storage (centavos vs NUMERIC) impacta arredondamento em estorno — OQ-05 aberto.
- Concorrência Cancel vs novo Payment (ConcurrencyModel) — lock receivable obrigatório.

### Ajustes recomendados
- FD ou ADR: CancelSale com pagamentos = operação composta atômica única API.
- UX: wizard "Cancelar venda e estornar R$ X" com confirmação dupla.
- Teste: pagamento gateway externo (futuro) — status pending.

### Classificação
**decisão do fundador necessária**
