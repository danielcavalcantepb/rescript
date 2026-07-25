# Busca Global e Command Palette

---

## 1. Entrada

- Topbar: campo “Buscar…” abre a mesma palette  
- Atalho: `⌘K` / `Ctrl+K`  
- Em listas: busca local **não** substitui a global  

---

## 2. O que pesquisa (global)

| Grupo | Entidades | Campos |
|---|---|---|
| Clientes | Customer | nome, nome fantasia, documento, email, código |
| Produtos | Product / Variant | nome, SKU, código de barras |
| Vendas | Sale | número, cliente (snapshot), status |
| Financeiro | Receivable / Installment | número, cliente, status |
| Navegação | rotas | labels |
| Ações | commands | “Nova venda”, etc. |
| Recentes | last opened | ids visitados |

Escopo: **sempre** `organization_id` ativa. Nunca cross-tenant.

---

## 3. Ordenação / prioridade

1. Ações exatas (“nova venda”)  
2. Recentes  
3. Match prefix no código/SKU/número  
4. Match nome  
5. Match parcial secundário  

Limite: ~8 por grupo, “Ver todos” → lista filtrada.

---

## 4. Resultados vazios

“Nada encontrado para ‘X’.”  
CTAs se permitido: Criar cliente · Criar produto · Nova venda.

---

## 5. Command Palette — comandos MVP

| Comando | Destino / efeito | Permissão |
|---|---|---|
| Criar cliente | CustomerCreate | customers.create |
| Nova venda | SaleWizard | sales.create |
| Novo produto | ProductCreate | products.create |
| Registrar pagamento | abre Receivables ou picker | payments.register |
| Entrada de estoque | InventoryMovement mode=entry | inventory.move |
| Abrir produto… | busca produto | products.read |
| Abrir cliente… | busca cliente | customers.read |
| Abrir venda… | busca venda | sales.read |
| Ir para Central | `/` | — |
| Ir para Estoque | `/estoque` | — |
| Importar | ImportWizard | imports.run |
| Configurações | Settings | — |
| Trocar empresa | org switcher | multi-membership |
| Convidar pessoa | Users invite | members.invite |

Digitar texto livre sem comando = busca entidades.

---

## 6. Teclado

↑↓ seleciona · Enter executa · Esc fecha · Tab entre grupos (opcional).
