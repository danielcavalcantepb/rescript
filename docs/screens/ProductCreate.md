# ProductCreate (inclui fluxo de variantes)

## Objetivo
Criar produto simples (variante padrão automática) ou com atributos/variantes em no máximo 2 passos.

## Usuário
Admin, operador catálogo.

## Frequência
Média; pico no onboarding/import.

## Dados exibidos / passos

**Passo 1 — Produto**  
Nome* · Unidade* · Preço* · Controla estoque · SKU opcional · Custo opcional · Estoque inicial opcional  

**Passo 2 — Variantes (só se “Tem variações”)**  
Atributos (Cor, Tamanho…) · opções · gerar combinações · SKU/preço por linha  

Prioridade: caminho simples default (sem passo 2).

## Componentes
Stepper (1–2) · Form · Switch “Tem variações” · Attribute editor · Variant matrix/table · Validation alerts · Buttons Voltar/Salvar · Desktop-first banner no mobile

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Salvar simples | Product + default Variant + price + entry opcional | products.create (+ inventory.move se entrada) | não | Detail |
| Gerar variantes | N variants | products.create | não | Detail |
| Cancelar | — | — | dirty | Lista |

## Estados
Loading · Error unique SKU · Empty N/A · No permission · Offline · Partial (falha entrada após create — mostrar aviso)

## Permissões
products.create; inventory.move se informar estoque inicial

## Navegação
Lista · Onboarding · ⌘K · **Desktop-first** para passo variantes

## Eventos
ProductCreated · VariantCreated · InventoryMoved (entrada)

## Regras
FD-06 unidades; FD-08; variante padrão obrigatória sem variações; AverageCost se entrada com custo

## Casos extremos
Duplicar combinação · SKU conflito com import paralelo · mobile → mensagem “use o computador”

## Design QA
- [ ] Default sem variações
- [ ] ≤2 passos
- [ ] Não wizard ERP
