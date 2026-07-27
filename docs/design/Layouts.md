---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: design / Layouts
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Layouts

---

## 1. Shell do aplicativo

- Sidebar + Topbar + Main  
- Main: padding `space-8` / `space-12`  
- Título sticky opcional com ações à direita  

---

## 2. Padrões de página

### Lista + (Drawer detalhe)
Clientes, Vendas, Recebíveis — scan rápido.

### Lista + Página detalhe
Produto com variantes; Sale em edição rica.

### Canvas de decisão
Central — blocos verticais, max-width ~800–960 para leitura (não full-bleed de BI).

### Form estreito
Cadastros simples: coluna ~560px centrada ou left-aligned no main.

### Split (avançado, raro)
Importação: preview | erros.

---

## 3. Wireframe lista

```
Título                    [Nova venda]
[Busca] [Filtros chips]
────────────────────────────────────
Tabela…
```

---

## 4. Hierarquia visual

Ver `VisualHierarchy.md`. Regra: **ação primária** sempre no canto superior direito da página ou no fim do form (mobile: sticky bottom).
