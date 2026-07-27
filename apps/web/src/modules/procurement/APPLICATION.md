# Procurement — Supplier Aggregate (Phase 6B)

## Existente → Novo

| Existente | Novo |
|---|---|
| Nenhum schema/código Supplier (ADR-0025) | Aggregate `supplier` + contacts/addresses/history/search |
| Docs apontavam Procurement futuro | Módulo `/procurement/suppliers` via RPC |

## Aggregate

- **Supplier** (root): PF | PJ (imutável), legalName, tradeName, document digits, email/phone, status
- **SupplierContact** / **SupplierAddress**: espelham Customer
- **Documentos:** reutilizam **exatamente** `#/modules/customers/domain/document` (CPF/CNPJ VOs)
- **SupplierHistory:** append-only
- **SupplierSearch:** projeção — list/search não reconstrói aggregate

## Lifecycle

`Create (draft|active) → Activate → Deactivate → Archive → Restore`  
Sem delete físico.

## Permissões

`suppliers.read|create|edit|write|archive|restore|contacts.manage|addresses.manage`  
Autorização no servidor (RPC).

## RPC

Contratos em `modules/suppliers/ui/api/contracts.ts`.  
Bridge: `supplier-api.ts`. Sem SQL/Supabase no client.

## Migration

`20260726060000_supplier_aggregate.sql`

## Limitações

- Sem Receiving / Sales / Financeiro / Fiscal / Marketplace
- Catalog não possui Aggregate Supplier (ADR-0025)

---

# Procurement — Purchase Aggregate (Phase 7A / Sprint 027)

## Existente → Novo

| Existente | Novo |
|---|---|
| Supplier aggregate (Phase 6B) | PO referencia `supplier_id` + snapshot congelado no header |
| Price Engine (Catalog) | `resolvePriceSnapshot` opcional ao adicionar item |
| Nenhum receiving/ledger | Aggregate `purchase_order` — intenção de compra apenas |

## Aggregate

- **PurchaseOrder** (root): number (`PO-000001`), supplier snapshot, status, currency, totals (servidor)
- **PurchaseItem**: variant snapshot, quantity, unitPrice, discount, line totals; soft-remove only
- **PurchaseHistory:** append-only audit
- **PurchaseSearch:** projeção para list/search com cursor

## Lifecycle

`draft → approved | cancelled | archived`  
`approved → cancelled | closed | archived`  
Sem receiving, sem movimentação de estoque.

## Permissões

`purchase.read|create|edit|approve|cancel|archive|restore|items.manage`  
`purchase.items.manage` implica via `purchase.edit` no pacote `@rescript/permissions`.

## RPC

Contratos em `modules/purchase/ui/api/contracts.ts`.  
Bridge: `purchase-api.ts`. Repos Supabase em `infrastructure/index.server.ts` (server-only).

## Migration

`20260726070000_purchase_order.sql`

## Limitações (Sprint 027)

- Sem inventory ledger / receiving
- Totais calculados no domínio/servidor — UI exibe valores do servidor
- Itens removidos apenas com soft-delete (`status = removed`)

---

# Procurement — Receiving / Goods Receipt (Phase 7B / Sprint 028)

## Existente → Novo

| Existente | Novo |
|---|---|
| Purchase aggregate (Sprint 027) | PO `received_quantity` por linha; recebimento referencia PO aprovado |
| Inventory Ledger (ENTRY) | `post_goods_receipt` cria ENTRY por linha — único caminho purchase→estoque |
| Nenhum receiving UI | Aggregate `goods_receipt` + itens + history + search |

## Aggregate

- **GoodsReceipt** (root): number (`GR-000001`), snapshot PO/fornecedor, `location_id`, status, idempotency key no post
- **GoodsReceiptItem**: snapshot variante, qty pedida/recebida, divergência, `ledger_movement_id` após post
- **GoodsReceiptHistory:** append-only audit
- **GoodsReceiptSearch:** projeção para list/search com cursor

## Lifecycle

`draft → posted | cancelled | archived`  
Post exige local, qty > 0 em ao menos uma linha, PO `approved`.  
Recebimento parcial ou completo ajusta qty em rascunho; **post** é atômico (RPC).

## Recebimento parcial vs completo

- **Parcial:** editar `receivedQuantity` por linha (ou `receivePartial`) antes do post; PO permanece `approved`, `purchase_item.received_quantity` incrementa
- **Completo:** `receiveComplete` preenche qty pedida; se todas as linhas ativas forem cobertas, PO → `closed` no post
- **Ledger:** apenas no post — `register_inventory_ledger_movement` type `entry` por linha com qty recebida

## Idempotency

- Post usa `post_idempotency_key` (unique por org) + idempotency por linha no ledger (`gr:{receiptId}:item:{itemId}`)
- Retry seguro: RPC retorna receipt já postado se a key existir

## Permissões

`receiving.read|create|receive|post|cancel|archive|restore`  
Autorização no servidor (RPC).

## RPC

Contratos em `modules/receiving/ui/api/contracts.ts`.  
Bridge: `receiving-api.ts`. Repos Supabase em `infrastructure/index.server.ts` (server-only).  
Post **somente** via `post_goods_receipt` — sem updates manuais de ledger/PO no app.

## Migration

`20260726080000_goods_receipt.sql`

## Limitações (Sprint 028)

- Sem AP / Fiscal / Sales
- Recebimento `posted` não pode ser cancelado (reversal futuro)
- Over-receive bloqueado por padrão (`allowOverReceive: false`)
- Divergência inferida no post quando qty ≠ pendente
