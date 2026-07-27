---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / FinancialProjectionModel
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Modelo Lógico — Projeção Financeira / Caixa

---

## 1. O que o MVP precisa

| Conceito | Representação |
|---|---|
| Evento comercial | Sale |
| Obrigação | Receivable / Installment |
| Liquidação | Payment confirmed + Allocation |
| Previsão de entrada | installments open/partial/overdue por due_date |
| Realizado | payments confirmed no período |

**Não é contabilidade** (plano de contas, partidas dobradas).

---

## 2. Persistência

| Dado | Persistir? |
|---|---|
| open_balance | materializado ok, reconstruível |
| cash projection snapshot | opcional cache; FT = installments + payments |
| “conta caixa” GL | **não** no MVP |

---

## 3. Consultas derivadas (Decision Center)
- A receber hoje / 7 dias / vencidos
- Recebido no dia/mês
- Sem juros projetados no MVP

---

## 4. Evolução V1
- Interest/fine as additional installment lines or charge documents
- Bank reconciliation boundary
- FinancialCashMovement ledger se necessário
