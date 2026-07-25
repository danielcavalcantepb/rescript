# SalesList

## Objetivo
Encontrar vendas em qualquer estado; criar nova; filtrar abertas/confirmadas.

## Usuário
Vendedor, owner.

## Frequência
Muito alta.

## Dados exibidos
Número · cliente · status chip · total · data atualização · vendedor.  
Prioridade: status + busca número/cliente. Presets: Abertas · Hoje · Confirmadas.

## Componentes
Header · “Nova venda” · Search · Filter chips · Table · Status Badge · Empty · Pagination

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Nova venda | Wizard | sales.create | não | Wizard |
| Abrir | Detail/Wizard se rascunho | sales.read/edit | não | — |

## Estados
Loading · Empty · Error · No permission · Offline

## Permissões
sales.read/create

## Navegação
Sidebar · Central · Cliente histórico · ⌘K

## Eventos
nenhum ao listar

## Regras
Sale único FD-03; estados oficiais StateMachines

## Casos extremos
Volume alto · venda órfã (seller removido) · filtros vazios

## Design QA
- [ ] Um módulo só (não 3 menus Orçamento/Pedido/Venda)
- [ ] Chips legíveis
- [ ] Parece Rescript? Sem excesso de cor/bordas?
