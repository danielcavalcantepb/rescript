# Módulo Inventory

Ledger de estoque multi-tenant. Fonte de verdade = movimentações; saldo materializado e reconstruível.

## Objetivo

Registrar entradas, saídas e ajustes com auditoria, saldo consistente sob concorrência e isolamento por organização.

## Limites (fora de escopo)

Sales · Purchases · Finance · multi-depósito · transferências · lotes · séries · validade · inventário físico em lote · reservas · custo médio · KPIs.

## Modelo

| Objeto | Papel |
|--------|--------|
| `inventory_movement` | FT append-only (ledger) |
| `inventory_balance` | Materialização `(org, product)` qty ≥ 0 |
| `register_inventory_movement` | RPC atômica (única escrita) |
| `inventory_movement_delta` | Fórmula oficial de sinal |
| `compute_product_stock` | Soma do ledger (reconciliação) |

Unidade estocável no MVP = **Product** (catálogo flat; sem variantes).

## Cálculo de saldo (oficial)

```
entry, adjustment_in  → +quantity
exit, adjustment_out  → −quantity
saldo = Σ deltas (por organization_id + product_id)
```

Implementação canônica no banco: `inventory_movement_delta` / `compute_product_stock`.  
App: `domain/balance.ts` (`movementDelta`) — mesma regra; UI não recalcula à parte.

## Concorrência

RPC `register_inventory_movement` (SECURITY DEFINER):

1. `is_org_member`
2. `SELECT product … FOR UPDATE` (mesmo org)
3. rejeita produto arquivado
4. upsert + `SELECT balance FOR UPDATE`
5. rejeita se `qty + delta < 0`
6. INSERT movement + UPDATE balance

Serializa movimentos por produto. Clientes **não** têm INSERT direto no ledger.

## Estoque negativo

**Proibido** nesta sprint. Garantia no banco (RPC + `CHECK quantity >= 0` no balance).

## Produto arquivado

| Caso | Comportamento |
|------|----------------|
| Nova movimentação | Negada (`product_archived`) |
| Histórico / saldo | Consultáveis |
| Restaurar produto | Não altera saldo |

## Permissões

| Chave | Uso |
|-------|-----|
| `inventory.read` | listar saldos, histórico |
| `inventory.move` | entrada / saída |
| `inventory.adjust` | ajuste + / − |

Reutiliza gramática existente (`move`/`adjust`); `read` adicionado para visualização (viewer/manager/inventory).

## RLS

| Objeto | SELECT | INSERT/UPDATE/DELETE |
|--------|--------|---------------------|
| `inventory_movement` | membro | negado (RPC only) |
| `inventory_balance` | membro | negado (RPC only) |
| Triggers | — | bloqueiam UPDATE/DELETE no ledger |

## UI

| Rota | Conteúdo |
|------|----------|
| `/estoque` | saldos, filtros, dialogs entrada/saída/ajuste |
| `/estoque/movimentacoes` | histórico filtrável |

Status de exibição: **Disponível** (`qty > 0`) · **Sem estoque** (`qty ≤ 0`).  
**Baixo estoque** adiado — não há campo de mínimo no product.

## Query keys

```
['rescript','inventory', orgId, 'stock', filters]
['rescript','inventory', orgId, 'product', productId]
['rescript','inventory', orgId, 'movements', filters]
```

Mutations invalidam `queryKeys.inventory.all(orgId)`.

## Migration

`supabase/migrations/20260725040000_inventory.sql`

## Testes

Unitários: balance, validation, use cases, repository helpers, permissions.  
RLS/smoke: ver `docs/development/InventoryRLSSmoke.md`.
