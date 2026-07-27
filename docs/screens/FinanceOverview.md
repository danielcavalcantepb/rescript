---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / FinanceOverview
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# FinanceOverview

## Objetivo
Pulso financeiro operacional: a receber, vencidos, recebidos hoje — sem contabilidade.

## Usuário
Owner, financeiro.

## Frequência
Diária / várias vezes.

## Dados exibidos
Cards: a receber · vencido · recebido hoje · a vencer 7 dias (texto).  
Lista curta top vencidos.  
Prioridade: vencidos + CTA. Sem gráficos obrigatórios.

## Componentes
Header · Metric Cards quiet · List/Table preview · Button “Ver recebíveis” · Empty · Alert suspensa · Link Central

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Ver recebíveis | Receivables | payments/read | não | — |
| Registrar pagamento (atalho) | PaymentRegister picker | payments.register | não | — |
| Abrir venda | SaleDetail | sales.read | não | — |

## Estados
Loading · Empty (sem recebíveis) · Error · No permission · Offline · Tudo em dia (mensagem calma)

## Permissões
Leitura financeira operacional; register para CTA

## Navegação
Sidebar Financeiro · Central insight vencidos

## Eventos
nenhum ao ver; derivados de Payment/Receivable

## Regras
FD-04; FinancialProjectionModel; não GL

## Casos extremos
Tudo vencido → ainda lista curta + ver todos. Moeda só BRL display.

## Design QA
- [ ] Não parecer BI
- [ ] Não usar “Pago: sim/não”
- [ ] Parece Rescript? Sem excesso de cor/bordas?
