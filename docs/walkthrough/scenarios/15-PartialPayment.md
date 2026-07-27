---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 15-PartialPayment
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 15 — Pagamento Parcial

## Cenário

Venda confirmada a prazo total R$ 1.400; pagamentos de R$ 1.000, depois R$ 400, depois tentativa de overpay; situações derivadas EmAberto → ParcialmenteRecebido → Quitado.

### Objetivo
Validar RN-50, RN-51, R1–R4, X3; rejeição de overpay; **HYPOTHESIS** Money storage undecided.

### Atores
- Financeiro (`payments.register`)
- Sistema (recálculo de situação)

### Estado inicial
Sale Confirmada R$ 1.400 a prazo; Receivable 1 parcela vencimento +30d; sem pagamentos; estoque já baixado.

### Pré-condições
- Receivable EmAberto
- Permissão registrar pagamento
- Moeda BRL (FD-07)

### Passos executados

#### 1. Primeiro pagamento R$ 1.000
1. **Comando:** `RegisterPayment` (amount=1000, installment_id, idempotency_key=P1)
2. **Autorização:** `payments.register`
3. **Validações:** amount > 0; amount ≤ saldo aberto parcela; mesma currency; idempotency única
4. **Consultadas:** Installment saldo, Receivable total
5. **Criadas:** Payment confirmed; PaymentAllocation; FinancialEntry (caixa +1000)
6. **Alteradas:** Installment→ParcialmentePaga; Receivable→ParcialmenteRecebido; saldo aberto 1400→400
7. **Locks:** receivable/installment row
8. **Auditoria:** método, data, responsável
9. **Eventos:** `PaymentRegistered`
10. **Outbox:** fluxo de caixa async
11. **Derivados:** R1 "pago" **não** booleano na Sale — situação derivada
12. **Insight:** recebimentos parciais / a vencer
13. **Falha:** idempotency replay P1 → no duplicate (R4)
14. **Recuperação:** retry mesma P1 ok

#### 2. Segundo pagamento R$ 400 (quita)
1. **Comando:** `RegisterPayment` (amount=400, idempotency_key=P2)
2. **Autorização:** `payments.register`
3. **Validações:** 400 ≤ saldo 400 restante
4. **Consultadas:** saldo aberto
5. **Criadas:** Payment + Allocation + FinancialEntry
6. **Alteradas:** Installment→Paga; Receivable→Quitado; saldo 0
7. **Locks:** receivable
8. **Auditoria:** quitação
9. **Eventos:** `PaymentRegistered`
10. **Outbox:** insight cliente em dia
11. **Derivados:** caixa +1400 total; parcela não vencida
12. **Insight:** n/a ou positivo
13. **Falha:** n/a
14. **Recuperação:** n/a

#### 3. Tentativa overpay R$ 0,01
1. **Comando:** `RegisterPayment` (amount=0.01)
2. **Autorização:** `payments.register`
3. **Validações:** amount > saldo aberto → **rejeição**
4. **Consultadas:** saldo=0
5. **Criadas:** nenhuma
6. **Alteradas:** nenhuma
7. **Locks:** n/a
8. **Auditoria:** tentativa opcional
9. **Eventos:** nenhum
10. **Outbox:** n/a
11. **Derivados:** inalterados
12. **Insight:** n/a
13. **Falha:** erro claro "valor excede saldo"
14. **Recuperação:** estorno se pagamento externo errado (ReversePayment)

#### 4. Pagamento único mal fracionado (validação extra)
1. **Comando:** RegisterPayment 1000 + 500 quando saldo após primeiro=400
2. **Autorização:** idem
3. **Validações:** segundo pagamento rejeitado (overpay parcial)
4–14. Mesmo comportamento overpay

### Estado final esperado
Receivable Quitado; 2 Payments confirmados; saldo aberto 0; caixa +1400; Sale permanece Confirmada (não "paga" boolean).

### Invariantes verificadas
R1, R2, R3, R4, X3, RN-50, RN-51, G4; soma alocações = payment amount.

### Inconsistências encontradas
- **HYPOTHESIS / OQ-05:** arredondamento se amounts em centavos vs NUMERIC — overpay de 0,001 deve ser impossível com scale 2 BRL.
- Multi-allocation 1 payment → N parcelas suportado no modelo; MVP UX pode restringir (PaymentsModel) — não exercitado.
- Juros/multa fora MVP (FD-04) — atraso não altera saldo.

### Ajustes recomendados
- Fechar OQ-05 antes de implementar validação de saldo.
- Teste idempotência + concorrência dois pagamentos simultâneos no último centavo de saldo.
- UI mostrar saldo aberto derivado, nunca campo editável "pago sim/não".

### Classificação
**aprovado com ressalvas**
