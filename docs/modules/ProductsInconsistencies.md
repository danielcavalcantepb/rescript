---
Status: Archived
Owner: Module Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Archive
Scope: modules / ProductsInconsistencies
Supersedes: None
Superseded-By: README.md
Related-Modules: All
---

# Products — Decisões arquiteturais (revisão pré-marco)

Revisão antes do marco **PRODUCTS COMPLETE**. Nenhuma alteração de modelagem foi necessária; as decisões abaixo ficam canônicas.

---

## 1. Tabela singular `product`

| Alternativa | Motivo de rejeição |
|-------------|-------------------|
| `products` (plural, brief da sprint) | Quebra o padrão físico do banco |

**Decisão:** `public.product` (singular).

**Justificativa:** o módulo de referência usa `public.customer`, não `customers`. Manter singular por aggregate evita dois estilos de naming no mesmo schema (`organization`, `membership`, `customer`, `product`). O path de UI permanece pt-BR `/produtos`; o nome da tabela segue o domínio em inglês singular.

---

## 2. Permissões `products.read|create|edit|write`

| Alternativa (brief) | Motivo de rejeição |
|---------------------|-------------------|
| `products.view` / `update` / `archive` | Chaves novas paralelas ao package já existente |

**Decisão:** reutilizar as chaves já definidas em `@rescript/permissions` e nos roles.

**Justificativa:**

- Mesma gramática de Customers (`*.read|create|edit|write`).
- `write` continua sendo o atalho owner/admin/manager; `edit` cobre editar **e** arquivar/restaurar (não há `*.archive` no sistema).
- Command palette, roles e Foundation já referenciam `products.read` / `products.create`.
- Criar `view`/`update`/`archive` exigiria migrar o package, roles e docs sem ganho de isolamento — autorização continua sendo `can()`, não um mecanismo novo.

---

## 3. Coexistência de `status` + `archived_at`

**Decisão:** manter ambos, com o mesmo CHECK de Customers:

- ativo: `status = 'active'` ∧ `archived_at`/`archived_by` nulos  
- arquivado: `status = 'inactive'` ∧ `archived_at` preenchido  

**Justificativa:**

| Campo | Papel |
|-------|--------|
| `status` | filtro de listagem, índice `(organization_id, status)`, semântica estável na app |
| `archived_at` / `archived_by` | auditoria de *quando* / *quem* arquivou |

Só `archived_at` forçaria `IS NULL` em toda query e perderia o enum explícito de estado. Só `status` perderia o carimbo temporal. A constraint impede estados incoerentes (`active` com archive preenchido, etc.). Soft-archive; sem hard delete e sem policy DELETE.

---

## 4. Reutilização de SKU após arquivamento

**Decisão:** **SKU permanece único por organização em todas as linhas**, inclusive arquivadas.  
Índice atual: `UNIQUE (organization_id, sku)` sem filtro por `status`.

**Política:**

1. Arquivar **não** libera o SKU.
2. Criar/editar outro produto com o mesmo SKU falha com conflito (23505 → mensagem de SKU duplicado).
3. Para “reaproveitar” o código: restaurar o produto arquivado, ou restaurar → alterar SKU → arquivar de novo, e só então criar outro com o SKU antigo.

**Justificativa:**

- Alinha à unicidade de `document` em Customers (também vale para clientes arquivados).
- Soft-archive significa que a identidade comercial ainda existe no tenant; liberar SKU geraria ambiguidade humana e risco em histórico futuro (Sales/Inventory).
- Índice parcial `WHERE status = 'active'` seria mudança consciente futura se o negócio exigir reciclagem de códigos — **não** nesta sprint.

---

## 5. `unit` como texto livre (não enum / não FK)

**Decisão:** `unit text NOT NULL` (≤32), validado na app (obrigatório, não vazio).

**Justificativa:**

- Catálogo MVP: sem tabela `unit_of_measure` nem Inventory.
- Enum Postgres fecharia cedo demais (`un`, `kg`, `cx`, `m`, `L`, unidades setoriais).
- FK para cadastro de unidades é evolução natural do model longo (`ProductModel.md`); aqui seria escopo inventado.
- Texto livre espelha a escolha de `category` nesta sprint (sem `product_category`).

---

## 6. Validação custom em vez de Zod

**Decisão:** `domain/validation.ts` (funções + `FieldErrors`), igual Customers.

**Justificativa:**

- Zod **não** é dependência direta do app; aparece só como transitivo de tooling de router.
- Introduzir Zod só em Products criaria dois estilos de validação no monorepo.
- “Não duplicar padrões” / “seguir Customers” prevalece sobre o brief que citava Zod.
- Contratos de erro (`ProductValidationError.fieldErrors`) e testes já seguem o mesmo shape de Customers.

---

## 7. Consistência com Customers

| Concern | Customers | Products |
|---------|-----------|----------|
| Tabela | `customer` | `product` |
| Camadas | domain → application → infra → ui | idêntico |
| Soft archive | `inactive` + `archived_at` | idêntico |
| Unicidade natural | `document` (org) | `sku` (org), inclusive arquivados |
| Permissões | `customers.*` | `products.*` (mesma gramática) |
| RLS | `is_org_member` SELECT/INSERT/UPDATE | idêntico |
| Org context | nunca do form | idêntico |
| Query keys | org-scoped + invalidate all | idêntico |
| UI | lista + detalhe + dialogs | idêntico |
| Validação | custom | custom |
| DELETE | inexistente | inexistente |

**Divergências aceitas (domínio, não arquitetura):** campos do aggregate (SKU/unit vs documento/PF-PJ); ausência de atalho Sales no detalhe de produto nesta sprint.

---

## Outras decisões já registradas (sem mudança)

| Tópico | Decisão |
|--------|---------|
| Modelo longo (variants/preço/estoque) | Fora de escopo; catálogo flat |
| UI create/edit | Dialogs (não páginas dedicadas) |
| StatusBadge | Componente da Platform Foundation |
| RLS vs permissões granulares | Banco = membership; app = `can()` |
