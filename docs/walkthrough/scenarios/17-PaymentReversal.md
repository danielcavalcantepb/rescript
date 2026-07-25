# Cenário 17 — Estorno de Pagamento

## Cenário

Pagamento confirmado é estornado integralmente; avaliar estorno parcial no MVP; recebível reabre; auditoria completa.

### Objetivo
Validar `OP-ReversePayment`, status `reversed` / `partially_reversed`, impacto em Installment/Receivable.

### Atores
- Operador financeiro (`finance.payment.reverse`)
- Sistema

### Estado inicial
Payment P1 R$ 1.000 confirmado alocado a I1; I1 Quitado; Sale Confirmada.

### Pré-condições
Membership; permissão de estorno; org ativa.

### Passos executados

#### 1. Estorno integral
1. **Comando:** `ReversePayment(P1, amount=1000, reason, idempotency_key=R1)`
2. **Autorização:** `finance.payment.reverse`
3. **Validações:** P1 confirmed; amount ≤ líquido estornável; não já reversed
4. **Consultadas:** Payment, Allocations, Installment
5. **Criadas:** Payment estorno (reverses_payment_id=P1) + allocations de reabertura; Audit; Outbox
6. **Alteradas:** P1→reversed; I1 saldo 1000; status Em aberto (derivado)
7. **Locks:** Payment + Installment
8–10. Audit + PaymentReversed outbox na TX
11. Caixa/projeção recalculados
12. Insight: recebível reaberto
13. Falha: estorno > líquido → rejeita
14. Recuperação: retry com R1

#### 2. Estorno parcial (futuro / fronteira)
1. **Comando:** `ReversePayment(P1, amount=400)` após pagamento 1000
2–3. Modelo tem `partially_reversed`; **MVP.md** menciona estorno, sem detalhar parcial
4–14. Se MVP só integral: rejeitar parcial com mensagem clara; senão aplicar e status partially_reversed

### Estado final esperado
Após estorno integral: um payment de estorno; recebível reaberto; histórico preservado.

### Invariantes verificadas
Sem apagar Payment original; saldos coerentes; tenant.

### Inconsistências encontradas
- Escopo de **estorno parcial no MVP** ambíguo (status no modelo vs. UX/MVP).
- Ordem cancel Sale + estorno (cenário 14) acoplada.

### Ajustes recomendados
Fechar: MVP = estorno integral obrigatório; parcial = V1 explícito **ou** parcial no MVP com regras.

### Classificação
**decisão do fundador necessária** (parcial vs integral no MVP)
