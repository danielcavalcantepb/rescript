# Cenário 18 — Entrada de Estoque com Custo

## Cenário

Entrada com custo recalcula média ponderada; saída posterior captura custo histórico imutável.

### Objetivo
Validar FD-01 com exemplo numérico: 10@10 + 10@20 → média 15; saída usa 15.

### Atores
- Operador de estoque (`inventory.entry`)

### Estado inicial
- Org A; local padrão L1; variante V1; físico=0; sem média.
- **HYPOTHESIS:** custo médio por (org, location, variant) — OQ-09.

### Pré-condições
Produto com controle de estoque; membership; org ativa.

### Passos executados

#### 1. Entrada 10 × R$ 10,00
1. **Comando:** `RecordStockEntry(V1, qty=10, unit_cost=10.00, reason=compra)`
2. **Autorização:** `inventory.entry`
3. **Validações:** qty>0; cost≥0; unit precision
4. **Consultadas:** Variant, Balance, AverageCostCurrent
5. **Criadas:** InventoryMovement(entry); AverageCostLedger; Audit; Outbox
6. **Alteradas:** físico=10; média=10; Balance materializado
7. **Locks:** Balance (L1,V1)
8–10. Audit + InventoryMoved
11. disponível=10; reservado=0
12. Insight: estoque baixo pode limpar
13. Falha: variante arquivada
14. Recuperação: N/A

#### 2. Entrada 10 × R$ 20,00
1. **Comando:** `RecordStockEntry(V1, qty=10, unit_cost=20.00)`
2–3. Idem auth/validações
5–6. Movement entry; média = (10×10 + 10×20)/(10+10) = **15,00**; físico=20
7–14. Locks balance; ledger custo

#### 3. Saída 5 (via ConfirmSale ou ajuste saída)
1. **Comando:** saída qty=5
2–6. Movement exit com **unit_cost_applied=15,00** imutável; média permanece 15; físico=15
11. custo total linha = 75,00

### Estado final esperado
físico=15; média vigente=15; movimento de saída com custo aplicado 15 gravado.

### Invariantes verificadas
FD-01 fórmulas; ledger append-only; custo saída imutável; tenant.

### Inconsistências encontradas
- FD-01 “por variante” vs hipótese por local (OQ-09 / CR-04).
- OQ-05 Money afeta representação de 15,00.

### Ajustes recomendados
Fechar OQ-09 antes do schema físico das chaves de AverageCost.

### Classificação
**aprovado com ressalvas**
