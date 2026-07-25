# Receivables

## Objetivo
Gerir contas a receber: parcelas, vencimentos, registrar/estornar pagamentos.

## Usuário
Financeiro, owner, vendedor (consulta).

## Frequência
Alta.

## Dados exibidos
Cliente · venda · parcela · vencimento · valor · saldo · situação (Em aberto / Parcial / Quitado / Vencido / Cancelado).  
Prioridade: vencidos e saldo. Filtros presets.

## Componentes
Header · Search · Filter chips · Table · Status Badge · Row actions “Registrar pagamento” · Empty · Link Sale

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Registrar pagamento | PaymentRegister | payments.register | não | saldo↓ |
| Estornar | ReversePayment | payments.reverse | modal | saldo↑ |
| Abrir venda | SaleDetail | sales.read | não | — |
| Filtrar vencidos | query | read | não | — |

## Estados
Loading · Empty · Error · No permission · Offline · Recebível cancelado (read) · Parcialmente pago

## Permissões
read implícito operacional; register/reverse

## Navegação
FinanceOverview · Central · SaleDetail painel · `?status=vencido`

## Eventos
PaymentRegistered · PaymentReversed · (status derivados)

## Regras
ReceivablesModel · PaymentsModel · sem juros MVP · overpay bloqueado

## Casos extremos
Pagamento duplicado idempotente · parcela quitada · venda cancelada · 100k rows paginação

## Design QA
- [ ] Situações ricas (não boolean)
- [ ] CTA pagamento óbvio em abertas
