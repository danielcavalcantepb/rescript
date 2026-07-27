---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / PaymentRegister
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# PaymentRegister (Drawer/Modal)

## Objetivo
Registrar pagamento (total ou parcial) contra parcela/recebível com idempotência.

## Usuário
Financeiro, vendedor autorizado.

## Frequência
Alta.

## Dados exibidos
Contexto: cliente · venda · parcela · saldo.  
Campos: valor (default=saldo) · método · data · obs opcional.  
Prioridade: valor ≤ saldo.

## Componentes
Drawer or Modal · Summary context · Money input · Select método · DatePicker · Button Registrar · Alert erro excedente · Loading

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Registrar | Payment+Allocation | payments.register | não (loading) | fecha; toast; atualiza pai |
| Cancelar UI | fecha | — | dirty | — |

## Estados
Loading · Error validation · No permission · Offline · Idempotent replay (toast “já registrado”)

## Permissões
payments.register

## Navegação
Receivables · SaleDetail · ⌘K · FinanceOverview

## Eventos
PaymentRegistered · Outbox

## Regras
amount > 0 · ≤ saldo · FD-07 BRL · walkthrough 15–16

## Casos extremos
Double submit · valor > saldo · receivable cancelado · org suspensa

## Design QA
- [ ] Default valor = saldo
- [ ] Mensagem excedente clara
- [ ] Não parecer gateway complexo
