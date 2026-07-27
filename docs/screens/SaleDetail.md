---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / SaleDetail
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# SaleDetail

## Objetivo
Ver Sale em qualquer estado com snapshots, timeline, estoque/financeiro derivados; ações de estágio (pagar, cancelar).

## Usuário
Vendedor, financeiro, owner.

## Frequência
Alta.

## Dados exibidos
- Cabeçalho: número · status · datas · vendedor · canal  
- Cliente **snapshot** + link cadastro atual  
- Itens com snapshots (desc, SKU, unit, attrs, preços, qty, totais)  
- Totais imutáveis se Confirmada  
- Painel estoque: reserva (se Pedido) ou movimentos (se Confirmada/Cancelada)  
- Painel financeiro: recebível · parcelas · pagamentos · saldo  
- Timeline: status history · pagamentos · movimentos  
- Notas  

Prioridade: status + o que fazer agora (CTA contextual).

## Componentes
Header · Status Badge · Breadcrumb · Summary cards · Items table read-only (pós-confirm) · Timeline · Insight inline raro · Buttons contextuais · Modal cancel · Drawer pagamento · Alert banners (expirada reserva, suspensa, parcial pago)

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Editar | → Wizard se pré-confirm | sales.edit | dirty | Wizard |
| Confirmar | igual Wizard | sales.confirm | modal | refresh Detail |
| Registrar pagamento | PaymentRegister | payments.register | não | painel fin |
| Cancelar | OP-CancelSale / bloqueio se pago (FQ-01) | sales.cancel | modal+motivo | status Cancelada + compensações |
| Estornar pagamento | ReversePayment | payments.reverse | modal | fin |
| Reabrir orçamento | → Rascunho | sales.edit | sim | Wizard |
| Copiar link | clipboard | read | não | — |

## Estados
Loading · Error · No permission · Offline · Reserva expirada (Pedido sem reserva) · Parcialmente paga · Recebível cancelado · Insight expirado N/A · Read-only terminal

## Permissões
read + ações contextuais

## Navegação
Lista · Central · Receivable · Reserva · deep link `/vendas/:id`

## Eventos
Consome histórico. Produz conforme ações (Cancel, Payment…).

## Regras
SaleSnapshots · StateMachines · Receivables · Cancel compensação RN-33 · FD-04 sem juros UI

## Casos extremos
Cancel após pago · estorno parcial (FQ-02) · seller removido · snapshot ≠ cliente atual · org suspensa

## Design QA
- [ ] Timeline clara
- [ ] Snapshot vs atual explícito
- [ ] CTA único dominante
- [ ] Sem editar confirmada “por engano”
