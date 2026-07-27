---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-27
Version: 1.0.0
Type: Canonical
Scope: Inventory security, authorization, reconciliation and canonical model
Supersedes: None
Superseded-By: None
Related-Modules: Inventory, Reservation, Picking, Packing, Shipment, Receiving
---

# Inventory Security & Canonicalization

## Autoridade canônica

Inventory é variant-scoped. `inventory_ledger_movement` é a fonte de verdade
física; `inventory_item` é a projeção por variante e StockLocation.
Implementações product-scoped são legadas e não podem receber novos
consumidores.

## Fronteira de escrita

- Identidades `inventory_item` podem nascer com on-hand, reserved e version
  iguais a zero.
- Toda alteração física passa por `register_inventory_ledger_movement` ou
  `register_inventory_ledger_transfer`.
- Ajustes e estornos possuem permissões próprias.
- Reservation é o único fluxo que projeta reserved; não cria movimento físico.
- O Ledger é append-only e sua projeção é atualizada na mesma transação.

## Autorização

Autenticação e membership são necessárias, mas não suficientes. RLS e RPCs
validam as permissões específicas:

| Operação | Permissão |
|---|---|
| Ler saldo/local | `inventory.read` |
| Ler Ledger/reconciliar | `inventory.movements.read` |
| Entrada/saída manual | `inventory.movements.create` |
| Ajuste | `inventory.adjust` |
| Transferência | `inventory.transfer` |
| Estorno | `inventory.reverse` |

`inventory.move` é um alias de compatibilidade para
`inventory.movements.create`. Ele não é autorizado em novos contratos.

## Reconciliação

`reconcile_inventory_ledger(organization_id, only_inconsistent)` é uma função
read-only. Ela compara a soma de `signed_delta` com `qty_on_hand` e relata:

- `missing_projection`;
- `missing_ledger_movement`;
- `balance_divergence`;
- `movement_chain_invalid`.

A função nunca corrige, atualiza ou remove dados. A reparação exige investigação
e movimento compensatório ou procedimento administrativo aprovado.

## Auditoria

`audit_event` é o mecanismo persistido oficial, append-only. Inventory registra
criação/alteração de StockLocation e InventoryItem, além de movimentos e
estornos. O Ledger continua sendo a evidência de domínio; AuditEvent registra
ator, ação, contexto e instante.

## Legado congelado

São product-scoped e legados:

- `inventory_movement`;
- `inventory_balance`;
- `register_inventory_movement`;
- `compute_product_stock`;
- rotas e serviços que recebem `product_id` como identidade estocável.

Não removê-los sem uma sprint de contract/cutover. Não criar dual-write.

## Evidência

A migration `20260727180000_inventory_security_canonicalization.sql` contém as
políticas, wrappers autorizados, auditoria e reconciliação. Testes transacionais
validam bypass direto, permissionamento SQL, tenant, concorrência, rollback e
idempotência.
