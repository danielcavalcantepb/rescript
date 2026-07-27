---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: design / Navigation
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Navegação

---

## 1. Modelo mental

```
Global (sempre)     → Sidebar + Topbar + ⌘K
Contextual          → Ações da página + drawer
Local               → Tabs só quando estados irmãos reais
```

---

## 2. Sidebar (IA)

| Item | Destino | Nota |
|---|---|---|
| Central | `/` | Home / Decision Center |
| Clientes | `/clientes` | |
| Produtos | `/produtos` | Inclui variantes no detalhe |
| Estoque | `/estoque` | Saldos + movimentos; não duplicar Produtos |
| Vendas | `/vendas` | Ciclo Sale único |
| Financeiro | `/financeiro` | Receber / pagar visão operacional |
| Importar | `/importacoes` | Secundário |
| Configurações | `/config` | Fundo |

Badge na Central ou Financeiro **só** com contagem curada (atenção), não vanity.

**Org switcher:** no topo da sidebar ou topbar — sempre visível se multi-org.

---

## 3. Topbar

- Busca / hint ⌘K  
- (Opcional) notificações leves — não feed  
- Avatar / conta  

---

## 4. Command Palette

Grupos: **Ir para** · **Criar** · **Recentes** · **Ações** (se contexto).  
Exemplos: “Nova venda”, “Café 500g”, “Cliente ACME”, “Recebíveis vencidos”.

---

## 5. Breadcrumb / Recentes / Favoritos

- Breadcrumb: profundidade ≥ 3  
- Recentes: na palette  
- Favoritos: **não MVP** (FutureIdeas)  

---

## 6. Quando usar cada superfície

| Padrão | Usar | Não usar |
|---|---|---|
| Página | Fluxos core | Detalhe rápido |
| Drawer | Detalhe Sale/Cliente | Formulário de variantes complexo |
| Modal | Confirmar / destruir / auth desconto | Cadastro longo |
| Popover | Filtros, menus | — |
| Inline | Editar rascunho simples | Preço pós-confirmada |

---

## 7. Wireframe navegação

```
┌──────┬────────────────────────────┐
│ Logo │  Buscar          Org User  │
│ ——   ├────────────────────────────┤
│ Home │  Conteúdo                  │
│ Cli  │                            │
│ Prod │                            │
│ Est  │                            │
│ Vend │                            │
│ Fin  │                            │
│ ···  │                            │
└──────┴────────────────────────────┘
```
