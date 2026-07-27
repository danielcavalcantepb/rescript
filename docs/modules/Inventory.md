---
Status: Active
Owner: Module Engineering
Last-Reviewed: 2026-07-27
Version: 2.0.0
Type: Reference
Scope: modules / Inventory
Supersedes: None
Superseded-By: None
Related-Modules: Catalog, Reservation, Picking, Packing, Shipment, Receiving
---

# Módulo Inventory

Inventory controla estoque físico multi-tenant por variante e local. A fonte de
verdade é `inventory_ledger_movement`; `inventory_item` é sua projeção de saldo
por `(organization_id, variant_id, location_id)`.

## Modelo vigente

| Objeto | Papel |
|---|---|
| `stock_location` | Local físico de estoque já implementado |
| `inventory_ledger_movement` | Ledger físico append-only e canônico |
| `inventory_item` | Projeção materializada de on-hand e reserved |
| `inventory_item_history` | Histórico append-only do item |
| `register_inventory_ledger_movement` | Única entrada pública para movimento físico |
| `register_inventory_ledger_transfer` | Transferência atômica entre StockLocations |
| `reconcile_inventory_ledger` | Diagnóstico read-only Ledger × projeção |

A unidade estocável é sempre `ProductVariant`, inclusive a variante padrão de
um produto simples. `Product` não é unidade estocável.

## Fluxo e invariantes

- Entrada, saída, ajuste, transferência e estorno são gravados no Ledger.
- `inventory_item.qty_on_hand` nunca é alterado diretamente.
- A criação direta da identidade de `inventory_item` só aceita projeção zero.
- Reservation altera `qty_reserved`, não o saldo físico.
- Picking e Packing não alteram o estoque.
- Shipment despacha o item, reduz a reserva e registra a saída física.
- Receiving registra a entrada física.
- Transferência produz `transfer_out` e `transfer_in` na mesma transação.
- Correção do Ledger é compensatória; movimentos nunca sofrem update/delete.

## Concorrência e atomicidade

As RPCs oficiais validam autenticação, permissão, tenant, variante e
StockLocation; adquirem locks antes do cálculo; registram Ledger e atualizam a
projeção na mesma transação. Idempotência é garantida por
`(organization_id, idempotency_key)`.

## Permissões

| Chave | Semântica |
|---|---|
| `inventory.read` | Ler locais e projeções |
| `inventory.movements.read` | Ler Ledger, histórico e reconciliação |
| `inventory.movements.create` | Registrar entrada/saída manual |
| `inventory.adjust` | Registrar ajuste positivo/negativo |
| `inventory.transfer` | Transferir entre StockLocations |
| `inventory.reverse` | Estornar movimento |
| `inventory.locations.manage` | Criar e alterar StockLocations |
| `inventory.create` / `inventory.edit` | Criar identidade zero e editar metadados |

`inventory.move` é alias legado de `inventory.movements.create`, mantido
somente para compatibilidade. Código novo não deve utilizá-lo.

## RLS e auditoria

RLS aplica permissão e membership ativa em StockLocation, InventoryItem,
InventoryItemHistory e InventoryLedgerMovement. Mutações físicas são FnOnly.
Criação/alteração de locais e itens e movimentos manuais geram `AuditEvent`
persistido e imutável.

## Legado product-scoped

`inventory_movement`, `inventory_balance`, `register_inventory_movement`,
`compute_product_stock`, `/estoque` e serviços que recebem `product_id`
pertencem à implementação anterior. Permanecem fisicamente nesta sprint para
compatibilidade, mas estão congelados: não podem receber novas integrações nem
ser usados como fonte canônica.

## Referências

- [Inventory Security Hardening](../INVENTORY_SECURITY_HARDENING.md)
- [Inventory Architecture](../architecture/InventoryArchitecture.md)
- [Inventory Model](../database/InventoryModel.md)
- [Inventory Ledger ADR](../architecture/adr/0005-inventory-ledger.md)
- [Variant cutover ADR](../architecture/adr/0023-inventory-product-to-variant-cutover.md)
