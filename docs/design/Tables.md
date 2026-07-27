---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: design / Tables
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Tabelas

---

## 1. Quando usar

Listas operacionais densas (vendas, recebíveis, movimentos). Não na Central de Decisão.

---

## 2. Anatomia

- Colunas: identidade · status · valor · data · ação  
- Row click → drawer/detalhe  
- Bulk actions: só se houver caso MVP claro (senão adiar)  
- Empty: Empty State, não tabela vazia crua  

---

## 3. Densidade

Compact default em Vendas/Estoque. Padding row `space-3`.

---

## 4. Estados na coluna

Status chip do domínio (Confirmada, Em aberto, Vencido…). Tooltip com definição se termo ambíguo.

---

## 5. Performance percebida

Skeleton de 8 rows · virtualização futura se > 500 (não desenhar agora).
