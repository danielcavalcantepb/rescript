---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: design / LoadingStates
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Loading States

---

## 1. Hierarquia

| Tipo | Quando |
|---|---|
| **BrandLoader** (3 barras) | Loading global / splash / rota |
| Skeleton de página | Primeira carga de lista/Central |
| Skeleton de seção | Refresh de bloco “Requer atenção” |
| Spinner no botão | Submit / Confirmar (discreto) |
| Progress determinado | Importação / jobs |
| Optimistic UI | Edits locais de rascunho (com rollback) |

Default de marca: **BrandLoader** — opacity stagger nas três barras do “E”. Não usar spinner redondo como identidade.

---

## 2. Regras

- Skeleton imita layout real  
- Não bloquear shell inteiro por um card  
- Confirmar venda: botão loading + disable — evita double click visual  
- Timeout longo: mensagem “Ainda trabalhando…” + manter navegação  

---

## 3. Central de Decisão

Carregar **Hoje** e **Requer atenção** primeiro; Visão geral pode atrasar um frame.
