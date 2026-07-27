---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: design / Search
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Busca

---

## 1. Camadas

| Camada | Escopo |
|---|---|
| Command Palette | Global: entidades + ações + recentes |
| Search de lista | Filtra a tabela atual |
| Autocomplete de campo | Cliente/produto dentro do form |

---

## 2. Comportamento

- Debounce ~200ms  
- Min 1–2 caracteres  
- Resultados: nome em destaque + meta (SKU, doc, status)  
- Sem resultado: CTA criar se permitido  

---

## 3. Copy

Placeholder palette: “Buscar ou digitar um comando…”  
Lista: “Buscar cliente…”
