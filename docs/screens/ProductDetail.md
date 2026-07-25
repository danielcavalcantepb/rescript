# ProductDetail

## Objetivo
Gerir produto e variantes; ver preços; atalho estoque; arquivar.

## Usuário
Admin catálogo; operador.

## Frequência
Média.

## Dados exibidos
Nome · descrição · unidade · controla estoque · ativo.  
Variantes: combinação · SKU · preço · disponível · status.  
Se 1 variante padrão sem atributos: UI simplificada (não falar “variante” sem necessidade).  
Prioridade: vender/estoque; atributos só se existirem.

## Componentes
Header · Breadcrumb · Status Badge · Tabs (Dados · Variantes · opcional Histórico preço) · Table variantes · Button editar/adicionar variante · Link estoque · Alert se arquivado · Empty variantes N/A

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Salvar dados | update product | products.edit | não | toast |
| Nova variante | cria variant | products.edit | não | row |
| Editar preço | Pricing | products.edit | não | histórico preço futuro |
| Arquivar produto/variante | archive | products.edit | sim se reservas | some de picks |
| Ver estoque | InventoryOverview filtrado | inventory read | não | — |
| Entrada rápida | Movement | inventory.move | não | — |

## Estados
Loading · Error · No permission · Arquivado · Offline · Reserva ativa ao arquivar (erro domínio)

## Permissões
products.read/edit; inventory.* para atalhos

## Navegação
Lista · Sale item link · back

## Eventos
ProductUpdated · VariantCreated · ProductArchived

## Regras
FD-08 anti-caos; imutabilidade combination após movimento; VariantModel; walkthrough 04, 35, 46

## Casos extremos
Alterar atributo pós-movimento → bloqueado. Duplicar combinação → erro. Produto usado em vendas → só arquivar.

## Design QA
- [ ] Simples se sem variações
- [ ] Desktop-first se muitas variantes
- [ ] Copy sem jargão
