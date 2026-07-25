# Cenário 42 — Reabrir Orçamento para Rascunho (exploratório)

## Cenário

Orçamento→Rascunho (StateMachines); liberar reserva se política excepcional tiver reservado.

### Objetivo
Transição reversível; liberação de reserva.

### Atores
Vendedor

### Estado inicial
Orçamento; **HYPOTHESIS** sem reserva; variante: política quote_reserves=true com Reservation active.

### Passos executados

#### 1. ReopenQuote
6. status→Rascunho; se Reservation active → Released; available restaurado
8–10. Audit + SaleReopened
13. Se já Confirmada — transição inválida

### Estado final esperado
Editável; sem compromisso estoque residual.

### Invariantes verificadas
Máquina de estados; reserva≠movimento.

### Inconsistências encontradas
Nenhuma grave.

### Ajustes recomendados
—
### Classificação
**aprovado**
