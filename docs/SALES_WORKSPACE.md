---
Status: Active
Owner: Product & Engineering
Last-Reviewed: 2026-07-27
Version: 1.0.0
Type: Canonical
Scope: Sales Order Workspace
Supersedes: None
Superseded-By: None
Related-Modules: Sales, Customers, Catalog, Pricing, Inventory, Finance
---

# Sales Order Workspace

`/sales/orders/new` é o Workspace operacional para emissão de pedidos. Cliente,
itens, preços, descontos, totais e observações permanecem no mesmo contexto.

## Capacidades vigentes

- busca e criação contextual de Customer pelo fluxo canônico;
- seleção de variantes por SKU, código de barras, produto ou variante;
- resolução server-side de Pricing e snapshot comercial por item;
- edição inline de quantidade e desconto;
- cálculo visual em centavos inteiros e recálculo autoritativo no servidor;
- criação e edição de rascunho pelos RPCs oficiais de Sales;
- bloqueio de saída quando existem alterações não salvas;
- layout responsivo com resumo comercial persistente no desktop.

## Limites atuais

Sales ainda não possui contratos persistentes aprovados para vendedor, canal, loja,
condição de pagamento, parcelas, transportadora, frete, volumes ou endereço de
entrega. O Workspace comunica essas lacunas e não grava dados estruturados em
observações, não cria Receivable e não simula integrações.

## Segurança

Customer, variante, preço, desconto, tenant e permissões são revalidados pelo
servidor e pelo PostgreSQL. Totais e snapshots persistidos nunca dependem do
cálculo visual.

## Próxima evolução

Somente após contratos canônicos aprovados: seller/channel/store snapshots,
delivery terms, payment terms e integração explícita com Accounts Receivable.

