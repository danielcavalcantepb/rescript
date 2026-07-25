# InventoryMovement (lista + registrar entrada/ajuste)

## Objetivo
Registrar entrada/ajuste com motivo; consultar ledger recente (append-only).

## Usuário
Operador estoque.

## Frequência
Média-alta.

## Dados exibidos
**Form:** variante · qty · custo (entrada) · motivo* · local (oculto se 1).  
**Lista:** data · tipo · variante · qty · custo aplicado · origem · usuário.  
Prioridade: form rápido; histórico secundário.

## Componentes
Header · Tabs ou modos (Entrada · Ajuste · Histórico) · Autocomplete variante · Quantity/Money inputs · Textarea motivo · Confirm button · Table histórico · Empty · Alert política

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Registrar entrada | movement + avg cost se custo | inventory.move | não (leve) | toast + saldo |
| Ajuste +/− | movement adjust | inventory.adjust | sim + motivo | toast |
| Ver origem | deep link Sale/etc | read | não | — |

## Estados
Loading · Empty histórico · Error (qty, reserved>físico) · No permission · Offline · Entrada sem custo (aviso margem)

## Permissões
inventory.move / inventory.adjust

## Navegação
Overview · ⌘K “Entrada” · ProductDetail

## Eventos
InventoryMoved · AverageCostRecalculated

## Regras
FD-01; RN-36 motivo; ledger imutável; compensação não edita passado

## Casos extremos
Ajuste abaixo do reservado → bloqueado. Devolução: se MVP A, atalho futuro / tipo return. Concorrência locks.

## Design QA
- [ ] Motivo obrigatório em ajuste
- [ ] Sem editar movimento antigo
- [ ] Copy humana tipos
