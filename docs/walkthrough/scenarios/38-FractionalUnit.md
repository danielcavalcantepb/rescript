---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 38-FractionalUnit
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 38 — Unidade Fracionada (kg)

## Cenário

Venda em kg qty 1,275; múltiplo mínimo; arredondamento; reserva; saída; custo.

### Objetivo
FD-06 Quantity decimal; precisão por unidade (**HYPOTHESIS** 3 casas; OQ-01).

### Atores
Vendedor; estoque

### Estado inicial
Variante unidade=kg; precision=3; min_sale_qty=0.100; multiple=0.025?; físico=10.000; média=8.50

### Pré-condições
tracks_inventory; sales.create

### Passos executados

#### 1. Add item qty=1.275
3. Valida precision≤3; qty≥min; múltiplo se configurado
5. SaleItem quantity exact decimal (não float binário)
#### 2. Pedido → reserva 1.275
6. reserved+=1.275; available-=1.275; physical same
#### 3. Confirm
6. exit movement qty=1.275; unit_cost_applied=8.50; cost_total=1.275×8.50

### Estado final esperado
Quantidades exactas; sem float; custo linha coerente com política de arredondamento Money.

### Invariantes verificadas
FD-06; FD-01; reserva≠movimento.

### Inconsistências encontradas
- OQ-01 precisão por unidade aberta.
- Arredondamento Money em 1.275×8.50 (10.8375 → 10.84?) não fechado (OQ-05).

### Ajustes recomendados
Política: arredondar Money half-up scale 2 BRL na linha; Quantity permanece exact.

### Classificação
**aprovado com ressalvas**
