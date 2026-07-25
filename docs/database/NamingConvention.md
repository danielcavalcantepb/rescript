# Convenção de Nomenclatura (Lógica → Física futura)

> Sem SQL. Nomes lógicos estáveis para schema futuro.

---

## 1. Princípios

- Inglês para identificadores técnicos; labels UX em pt-BR  
- Singular para entidade/tabela lógica (`sale`, não `sales`) — decisão recomendada alinhada a Postgres comum  
- `snake_case` no físico futuro  
- Prefixo de contexto só se ambíguo (`inventory_movement` vs `financial_*`)  
- Evitar nomes de planos comerciais no domínio (`plan_code`, não `is_pro`)

---

## 2. Sufixos padrão

| Sufixo | Uso |
|---|---|
| `_id` | FK / referência UUID |
| `_at` | instante |
| `_on` | data civil |
| `_count` / `_total` | derivado numérico |
| `_status` | enum lógico |
| `_key` | idempotency / external |
| `_snapshot` | cópia imutável |
| `_version` | optimistic lock |

---

## 3. Campos transversais (quando aplicáveis)

`id` · `organization_id` · `created_at` · `created_by` · `updated_at` · `updated_by` · `archived_at` · `version` · `idempotency_key` · `correlation_id` · `source` · `external_id` · `metadata` (JSON controlado, raro)

Não aplicar todos a todas as tabelas — ver SoftDelete / LogicalModel.

---

## 4. Enums

PascalCase ou snake no lógico documentado; físico futuro: text + check ou enum PG — decisão na fase SQL.

---

## 5. Proibido

- Abreviações opacas (`tbl_vnd`)  
- Sequencial global como “código de segurança”  
- Colunas `paid boolean` para Sale/Receivable  
