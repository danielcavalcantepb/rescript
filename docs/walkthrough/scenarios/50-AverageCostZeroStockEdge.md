# Cenário 50 — Custo Médio com Estoque Zerado (exploratório)

## Cenário

Físico vai a zero; nova entrada define nova média.

### Objetivo
FD-01 quando físico_atual=0.

### Atores
Operador estoque

### Estado inicial
físico=0 após saídas; média residual 15 (última vigente).

### Passos executados

#### 1. Entry 10 @ 20
3. Fórmula: se físico_atual=0 → novo_médio = custo_entrada (evitar divisão/resíduo)
6. média=20; físico=10
**Lacuna:** se média residual era 15, documentar reset explícito.

### Estado final esperado
Média=20; ledger registra cálculo.

### Invariantes verificadas
FD-01; append-only.

### Inconsistências encontradas
Comportamento com físico=0 e média antiga não numerado explicitamente nas regras FD (implícito na fórmula).

### Ajustes recomendados
Formalizar: se qty_before=0, avg=unit_cost_entrada (ou null se entrada sem custo).

### Classificação
**aprovado com ressalvas**
