---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / SaleWizard
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# SaleWizard (criação/edição pré-confirmação)

## Objetivo
Montar e evoluir a Sale (Rascunho → Orçamento → Pedido) com mínimo fricção até confirmar.

## Usuário
Vendedor.

## Frequência
Muito alta.

## Dados exibidos
- Status chip + ajuda “o que este estado significa”  
- Cliente (autocomplete)  
- Itens: variante, qty, preço unit (copiado), desconto linha, total linha  
- Totais: subtotal, desconto, total  
- Validade (orçamento) · notas  
- Indicadores estoque: disponível por linha (se controla)  
- Banner reserva quando Pedido  

Prioridade: itens + total + CTA de transição válida.

**Preço:** freeze ao adicionar; ação “Atualizar do catálogo” (FQ-05 recomendado).

## Componentes
Header sticky (status + actions) · Autocomplete cliente · Autocomplete produto/variante · Table itens editável · Money/Quantity inputs · Discount control · Alert auth desconto · Summary sidebar/footer · Buttons transição · Modal confirmar · Version conflict dialog · Permission tooltips · Desktop-first hint mobile

## Ações e transições

| Ação | De → Para | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|---|
| Salvar | — | persiste | sales.edit | não | toast |
| Emitir orçamento | Rascunho→Orçamento | validade | sales.edit | não | chip Orçamento; **sem reserva** padrão |
| Converter pedido | Orçamento→Pedido | **cria reserva** | sales.edit | se qty alta leve | banner reserva+TTL |
| Ir a pedido | Rascunho→Pedido | reserva | sales.edit | leve | idem |
| Confirmar venda | *→Confirmada | OP-ConfirmSale atômica | sales.confirm | **modal resumo** | SaleDetail confirmada |
| Descartar | →Descartada | libera reserva se houver | sales.edit | sim | lista |
| Recusar orçamento | →OrçamentoRecusado | libera | sales.edit | sim | detalhe read |
| Cancelar pedido | →PedidoCancelado | libera reserva | sales.cancel | sim | detalhe |
| Aplicar desconto | — | SaleDiscount | sales.discount | auth se acima | pending/applied |
| Solicitar autorização | — | DiscountAuthorization | sales.discount | não | espera aprovador |
| Autorizar (outro user) | — | approve | sales.discount.authorize | não | aplica |

### Modal Confirmar venda
Mostra: total · efeito “baixa estoque / gera recebível” · pagamento à vista opcional.  
Primary: **Confirmar venda**. Loading + idempotency. Erros: estoque, desconto, version, org suspensa, entitlement.

## Estados
Loading · Empty itens · Error validação · No permission · Offline · Partial (cliente arquivado) · Conflict version · Auth desconto pending · Reserva falhou · Primeiro acesso N/A

## Permissões
create/edit/confirm/discount/authorize/cancel conforme ação. Recheck no confirm.

## Navegação
Lista Nova · Cliente · ⌘K · Detail “Editar” se pré-confirm. Back: dirty guard.

## Eventos
SaleCreated · SaleUpdated · SaleQuoted · ReservationCreated · SaleConfirmed · DiscountAuthorization* · Outbox

## Regras
StateMachines · FD-02/03/05/06 · SaleModel · Reservation · Confirm atômico · Invariants S* · walkthrough 05–10, 39

## Casos extremos
Double click confirm · dois vendedores estoque · permissão removida · membership removida · preço catálogo mudou · qty fracionada · disponível insuficiente · 100 itens (perf) · self-auth desconto

## Design QA
- [ ] CTAs só válidos no estado
- [ ] Não 3 apps separados
- [ ] Modal confirm claro
- [ ] Disponível visível
- [ ] Mobile limitado documentado
