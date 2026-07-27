---
Status: Active
Owner: Product & Engineering
Last-Reviewed: 2026-07-27
Version: 2.0.0
Type: Reference
Scope: Sales Order Workspace 2.0
Supersedes: None
Superseded-By: None
Related-Modules: Sales, Customers, Catalog, Pricing, Inventory
---

# Sales Order Workspace 2.0

Este documento detalha a implementação operacional regida por
[Sales Workspace](./SALES_WORKSPACE.md) e
[Contextual Entity Creation](./INLINE_CREATE.md).

## Fluxo

`Pedido → buscar cliente → selecionar ou criar no Drawer → auto selecionar → itens → totais → salvar rascunho`

O estado do documento reside no componente do Workspace. React Query mantém
somente estado remoto e cache; Drawer, pickers e rotas não duplicam a fonte de
verdade do rascunho.

## Componentes

- `EntityPicker`: autocomplete acessível e paginado;
- `CustomerEntityPicker`: provider de Customers e criação contextual;
- `CustomerQuickCreateForm`: domínio oficial de Customers;
- `SalesProductPicker`: busca incremental de variantes vendáveis;
- `OrderHeader`, `WorkspaceSection` e `SalesTotals`: composição visual;
- `UnsavedChangesGuard`: bloqueio de navegação pelo dialog central.

O cabeçalho oferece **Concluir pedido** somente para `sales.confirm`. A ação salva
o rascunho e executa a transição canônica `draft → confirmed`; não cria efeitos
financeiros ou de estoque fora do lifecycle existente.

## Pricing, estoque e segurança

O valor visual ajuda o operador, mas Pricing e os snapshots são resolvidos
novamente no RPC. IDs de Customer e Variant são validados no tenant. A sprint não
cria reserva, movimento, Picking, Packing, Shipment ou efeitos financeiros.

## Pagamento e entrega

Os contratos atuais de Sales não persistem termos de pagamento ou entrega.
Essas áreas comunicam o limite vigente e não armazenam JSON paralelo, observações
codificadas ou títulos financeiros fictícios.

## Responsividade e acessibilidade

O Workspace empilha seções e ações em telas menores, mantém resumo sticky apenas
em desktop e usa primitivas Radix para foco, Escape, overlay e retorno de foco.
Pickers expõem combobox/listbox, `aria-busy`, alertas e seleção por teclado.
