---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 21-Return
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 21 — Devolução

## Cenário

Venda confirmada; item devolvido; entrada compensatória; impacto financeiro e de custo; vínculo com venda original.

### Objetivo
Validar se devolução está no MVP (MVP.md e FD-01.4 sim) e se o caminho financeiro está especificado.

### Atores
Operador (`inventory.return` / `sales.return` — nome a formalizar)

### Estado inicial
Sale S1 Confirmada; saída qty=5 custo aplicado 15; Receivable quitado ou aberto.

### Pré-condições
Sale confirmada; item controla estoque; qty devolvida ≤ vendida líquida.

### Passos executados

#### 1. Registrar devolução parcial qty=2
1. **Comando:** `RegisterReturn(sale_id=S1, item, qty=2, reason)`
2. **Autorização:** permissão de devolução (precisa existir no catálogo RBAC)
3. **Validações:** qty; sale Confirmada; não cancelada
4. **Consultadas:** SaleItem snapshot, Movement original, AverageCost, Receivable
5. **Criadas:** Movement(return/entry) com custo da venda original (FD-01.4); vínculo source=Sale/Return; Audit; Outbox
6. **Alteradas:** físico↑; média recalculada com custo da devolução; **financeiro:** crédito/estorno parcial? **subespecificado**
7. **Locks:** Balance; Sale; Receivable se financeiro
8–10. Audit + eventos ReturnRegistered / InventoryMoved
11. disponível↑; margem ajustada analiticamente
12. Insight possível
13. Falha: qty > líquida; org suspensa
14. Recuperação: retry idempotente

#### 2. Impacto financeiro
- Se receivable aberto: reduzir obrigação ou gerar crédito?
- Se pago: estorno de pagamento parcial?
- **Lacuna:** MVP lista estorno e devolução de estoque, mas fluxo unificado Return↔Payment não está fechado.

### Estado final esperado
Estoque corrigido com custo rastreável; Sale original permanece Confirmada (não apagada); documento de devolução ou movimento vinculado.

### Invariantes verificadas
FD-01.4; ledger append-only; sem editar saída original.

### Inconsistências encontradas
- Agregado/comando `Return` vs só `InventoryMovement.type=return` — responsabilidade ambígua.
- Financeiro da devolução **não** tem walkthrough oficial equivalente a ConfirmSale.
- Permissão nomeada ausente em AuthorizationDataModel (verificar).

### Ajustes recomendados
Definir: MVP = devolução de estoque + estorno financeiro manual separado **OU** operação atômica Return; documentar em Commands/UseCases.

### Classificação
**decisão do fundador necessária** (escopo financeiro da devolução no MVP)
