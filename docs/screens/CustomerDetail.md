# CustomerDetail

## Objetivo
Ver e editar um cliente; histórico de vendas; iniciar venda.

## Usuário
Vendedor, admin.

## Frequência
Média-alta.

## Dados exibidos
Nome · tipo PF/PJ · doc · contatos · endereço principal · observações · tags · status.  
Histórico: últimas vendas (número, data, total, status).  
Prioridade: identidade + CTA nova venda. Endereços extras em disclosure.

## Componentes
Header · Breadcrumb · Status Badge · Button “Nova venda” · Form sections / Inline edit · Tabs ou sections (Dados · Vendas) · Table vendas · Empty histórico · Drawer opcional edit

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Editar/salvar | atualiza cadastro | customers.edit | não | toast; **não** muda snapshots de vendas |
| Nova venda | SaleWizard pré-preenchido | sales.create | não | wizard |
| Arquivar | archived_at | customers.edit | sim leve | some de picks |
| Ver venda | SaleDetail | sales.read | não | — |

## Estados
Loading · Error · No permission · Empty histórico · Offline · Cliente arquivado (banner)

## Permissões
read/edit conforme keys. Export: futuro.

## Navegação
Lista · busca · SaleDetail cliente link · back lista.

## Eventos
CustomerUpdated · CustomerArchived

## Regras
SaleSnapshots imutáveis; CustomerModel; walkthrough 36.

## Casos extremos
Cliente “excluído”/arquivado aberto por URL → read-only banner. Doc duplicado na edição → erro. Sem histórico → empty.

## Design QA
- [ ] Edit não assusta histórico
- [ ] CTA venda óbvio
- [ ] Poucos campos acima da dobra
