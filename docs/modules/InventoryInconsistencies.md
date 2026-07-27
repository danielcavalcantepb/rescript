---
Status: Archived
Owner: Module Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Archive
Scope: modules / InventoryInconsistencies
Supersedes: None
Superseded-By: README.md
Related-Modules: All
---

# Inventory — Divergências conscientes

| Tópico | Brief / docs longos | Decisão |
|--------|---------------------|--------|
| Permissões `read/create/edit/write` | Brief sugeria criar se não existissem | Já existiam `inventory.move` / `inventory.adjust`; adicionado só `inventory.read` para visualização |
| Variante / depósito | ADR-0005 / InventoryModel | MVP no **Product** flat; sem location/variant (Products COMPLETE sem variantes) |
| Tipos `adjustment_plus/minus` | InventoryModel | Brief da sprint: `adjustment_in` / `adjustment_out` |
| Baixo estoque | Screens | **Adiado** — sem `min_stock` no product; UI só `available` / `out_of_stock` |
| INSERT client no ledger | — | **Negado**; escrita apenas via RPC atômica |
| Reservas / custo médio | ADR-0017 / FD-01 | Fora desta sprint |

---

# Revisão arquitetural (pré-marco INVENTORY COMPLETE)

Nenhuma alteração de modelagem foi necessária. Confirmações abaixo referem-se a `supabase/migrations/20260725040000_inventory.sql`.

## 1. Por que `FOR UPDATE` em `product` além de `inventory_balance`

A RPC faz, nesta ordem:

1. `SELECT … FROM product … FOR UPDATE` (mesmo `organization_id`)
2. upsert + `SELECT … FROM inventory_balance … FOR UPDATE`

**Papel do lock em `product`:**

- Serializa **todas** as movimentações daquele SKU/org, inclusive a **primeira** (quando ainda não existe linha em `inventory_balance`).
- Garante sob lock que o produto existe na org e está `active` (evita TOCTOU com arquivamento concorrente).
- Âncora estável: todo produto catalogado tem linha; balance pode ser ausente até o primeiro movimento.

**Papel do lock em `inventory_balance`:**

- Seção crítica da quantidade materializada: leitura do saldo → checagem `qty + delta >= 0` → `UPDATE`.

Manter os dois é intencional: product = fila por SKU + invariantes de catálogo; balance = consistência numérica do saldo.

## 2. Como `inventory_balance` é atualizado

| Mecanismo | Usado? |
|-----------|--------|
| Trigger em `inventory_movement` | **Não** |
| RPC `register_inventory_movement` | **Sim** — única mutação |
| Transação | **Sim** — corpo da função PL/pgSQL (atômica) |
| Cliente INSERT/UPDATE direto | **Não** — sem policies; só `SELECT` |

Fluxo na RPC: `INSERT` no ledger → `UPDATE inventory_balance SET quantity = v_balance + v_delta`.  
Fonte de verdade continua sendo o ledger; balance é materialização.

## 3. Reconstruir `inventory_balance` a partir do ledger

Fórmula oficial: `inventory_movement_delta` + soma via `compute_product_stock(org, product)`.

Rebuild completo (ops / reconciliação), exemplo:

```sql
-- por produto
update public.inventory_balance b
set
  quantity = public.compute_product_stock(b.organization_id, b.product_id),
  updated_at = now();

-- inserir ausentes (produtos com movimentos mas sem linha)
insert into public.inventory_balance (organization_id, product_id, quantity)
select m.organization_id, m.product_id, public.compute_product_stock(m.organization_id, m.product_id)
from public.inventory_movement m
group by m.organization_id, m.product_id
on conflict (organization_id, product_id) do update
set quantity = excluded.quantity, updated_at = now();
```

App: mesma regra em `domain/balance.ts` (`movementDelta`) — não duplicar lógica divergente na UI.

## 4. Concorrência — duas saídas simultâneas

1. Tx A e Tx B entram na RPC para o mesmo produto.
2. Uma obtém o `FOR UPDATE` do `product`; a outra **espera**.
3. Vencedora: lock balance → se `qty + delta < 0` falha; senão grava movement + balance → commit → libera locks.
4. Perdedora: lê o balance já atualizado; segunda saída com saldo insuficiente → `insufficient_stock`.

Não há lost update: a decisão de sair usa o saldo sob lock na mesma transação do INSERT.

## 5. `inventory_movement` é totalmente imutável

| Camada | Garantia |
|--------|----------|
| RLS | só `SELECT` para `authenticated` |
| Grants | só `SELECT` (sem INSERT/UPDATE/DELETE client) |
| Triggers | `BEFORE UPDATE` e `BEFORE DELETE` → `inventory_movement_immutable` |
| Correção | novo movimento compensatório (não editar linha) |

Escrita do ledger: apenas a RPC (SECURITY DEFINER).

## 6. `quantity > 0` (não apenas `>=`)

Confirmado:

- CHECK na tabela: `quantity numeric(18,6) not null check (quantity > 0)`
- RPC: rejeita `p_quantity is null or p_quantity <= 0` → `invalid_quantity`
- Validação app: mesma regra em `validateCreateMovement`

Zero e negativo **não** são movimentos válidos. Ajuste “para zerar” usa `adjustment_out` / `exit` com quantidade positiva ≤ saldo.

## 7. UNIQUE `(organization_id, product_id)` em `inventory_balance`

Confirmado via **`PRIMARY KEY (organization_id, product_id)`** — implica unicidade.  
`ON CONFLICT (organization_id, product_id) DO NOTHING` na RPC depende dessa chave.
