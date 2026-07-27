---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 19-StockEntryWithoutCost
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 19 — Entrada sem Custo

## Cenário

Entrada aumenta físico sem alterar custo médio; origem obrigatória; riscos de margem.

### Objetivo
Validar FD-01 regra 2: entrada sem custo não muda média.

### Atores
Operador estoque (`inventory.entry`)

### Estado inicial
V1: físico=10; média=15,00; local L1.

### Pré-condições
Permissão; motivo/origem informados.

### Passos executados

#### 1. Entrada qty=5 sem unit_cost
1. **Comando:** `RecordStockEntry(V1, qty=5, unit_cost=null, source=importação inicial)`
2. **Autorização:** `inventory.entry`
3. **Validações:** qty válida; origem obrigatória; política permite null cost
4. **Consultadas:** Balance, AverageCostCurrent
5. **Criadas:** Movement(entry, cost null); Audit (flag sem custo)
6. **Alteradas:** físico 10→15; **média permanece 15**
7. **Locks:** Balance
8–10. Audit + outbox InventoryMoved
11. disponível↑
12. Insight: possível “lacuna de dados / margem frágil”
13. Falha: origem ausente → rejeita
14. Recuperação: reenviar com origem

### Estado final esperado
físico=15; média=15; movimento rastreável sem custo.

### Invariantes verificadas
FD-01.2; ledger; sem edição de média silenciosa.

### Inconsistências encontradas
- Margem em saídas futuras usa média “diluída em quantidade” sem custo — risco analítico (DataTrust).
- Importação inicial frequentemente sem custo — precisa UX de alerta.

### Ajustes recomendados
Insight/alerta de “entradas sem custo recentes”; não inventar custo 0 como média.

### Classificação
**aprovado**
