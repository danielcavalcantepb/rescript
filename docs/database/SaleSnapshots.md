---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / SaleSnapshots
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Snapshots Comerciais na Sale

> Histórico da venda não muda quando cadastro muda.

---

## 1. Estratégia: referência + snapshot

| Dado | Na Sale | Motivo |
|---|---|---|
| customer_id | ref nullable | navegação / vínculos |
| nome, documento, endereço cobranca | **snapshot** | histórico comercial |
| variant_id | ref | estoque/analytics |
| descrição, SKU, unidade, atributos | **snapshot no item** | NF/UX histórica |
| unit_price, list_price, discounts | **snapshot** | imutável após confirm |
| unit_cost_applied | no **InventoryMovement** (não no item obrigatoriamente) | FT de custo |
| seller_user_id | ref + nome snapshot opcional | |
| currency | snapshot | |

---

## 2. Quando capturar

| Momento | O que congela |
|---|---|
| Criação/edição linha | preços e desc do catálogo (atualizáveis até confirmar) |
| **Confirmar Venda** | freeze final de todos snapshots + totais |
| Cancelar | não altera snapshots; gera compensações |

---

## 3. Representação lógica
- Colunas tipadas preferíveis para campos críticos (name, document, sku, unit_price)
- JSON controlado aceitável para attributes map + address blob versionado
- `snapshot_schema_version`

---

## 4. Invariantes
- Pós-Confirmada: snapshots imutáveis
- Relatórios históricos leem snapshot, não Customer/Product atuais
- Anonimização LGPD de Customer atualiza cadastro; snapshots podem exigir política própria (OQ retenção — ver DeletionAndRetention)
