# CustomersList

## Objetivo
Encontrar e abrir clientes rapidamente; iniciar cadastro.

## Usuário
Vendedor, admin.

## Frequência
Alta (várias/dia).

## Dados exibidos
Tabela/lista: nome · doc · cidade/contato · status · última compra (se houver).  
Prioridade: nome + busca. Tags opcionais.

## Componentes
Header + primary “Novo cliente” · Search · Filters (status) · Table · Status Badge · Empty State · Pagination/cursor · Command Palette (global)

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Novo cliente | → Create | customers.create | não | Create |
| Abrir row | → Detail | customers.read | não | Detail |
| Buscar/filtrar | query | read | não | — |
| Arquivar (bulk futuro) | — | — | — | MVP: no detail |

## Estados
Loading skeleton · Empty · Error · No permission · Offline · Partial (busca lenta)

## Permissões
Ver lista: customers.read. Criar: customers.create.

## Navegação
Sidebar Clientes · ⌘K · deep link filtros. → Detail/Create.

## Eventos
Nenhum ao listar.

## Regras
CustomerModel; unicidade doc por org quando informado; soft archive.

## Casos extremos
100k clientes → busca server-side + paginação. Sem clientes → empty CTA. Cliente arquivado → filtro.

## Design QA
- [ ] Busca < 2 cliques ao resultado
- [ ] Sem colunas fiscais densas
- [ ] Consistente Table pattern
- [ ] Parece Rescript (calma / precisão / organização)?
- [ ] Sem excesso de cor, bordas ou sombras?
- [ ] Tipografia Geist conversa com a logo?
