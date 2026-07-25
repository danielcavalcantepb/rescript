# ProductsList

## Objetivo
Localizar produtos/variantes; criar novo; ver preço e sinal de estoque.

## Usuário
Admin, estoque, vendedor.

## Frequência
Alta.

## Dados exibidos
Nome · SKU (variante default ou contagem de variantes) · preço · disponível (se controla) · status.  
Prioridade: nome/SKU/busca. Não listar matriz de atributos.

## Componentes
Header · “Novo produto” · Search · Filters (ativos, controla estoque) · Table · Status Badge · Empty · Link “Ver estoque”

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Novo produto | → Create | products.create | não | Create |
| Abrir | → Detail | products.read | não | Detail |
| Filtrar arquivados | query | read | não | — |

## Estados
Loading · Empty · Error · No permission · Offline · Volume alto (busca server-side)

## Permissões
products.read / products.create

## Navegação
Sidebar · ⌘K · Central CTA repor (deep product)

## Eventos
Nenhum ao listar.

## Regras
ProductModel; saldo na variante; arquivados ocultos por default.

## Casos extremos
Nenhum produto · produto arquivado · 100k SKUs

## Design QA
- [ ] Não misturar ledger nesta lista
- [ ] Busca SKU rápida
- [ ] Poucas colunas
- [ ] Parece Rescript? Sem excesso de cor/bordas?
