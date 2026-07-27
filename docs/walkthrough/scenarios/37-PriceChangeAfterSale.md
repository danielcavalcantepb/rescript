---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 37-PriceChangeAfterSale
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 37 — Alteração de Preço Após Venda / Rascunho

## Cenário

Preço do catálogo muda; venda histórica imutável; rascunho existente exige regra explícita de freeze vs recalc.

### Objetivo
Fechar comportamento de preço em Rascunho.

### Atores
Admin preços; Vendedor

### Estado inicial
Sale Rascunho com item unit_price=100 (copiado); catálogo muda para 120; Sale Confirmada antiga com 90.

### Pré-condições
pricing.update; sales.update

### Passos executados

#### 1. Venda Confirmada antiga
4. Snapshot unit_price=90 permanece — **OK documentado**

#### 2. Rascunho aberto após mudança de catálogo
Opções:
- **A Freeze:** mantém 100 até usuário “atualizar preços”
- **B Recalc automático:** vira 120 ao reabrir/salvar
- **C Recalc só ao confirmar:** mostra 100 na UI mas confirma com 120 (perigoso)
3. Documentação atual: preço copiado ao adicionar item; **não define** A vs B

### Estado final esperado
Histórico imutável; rascunho com regra explícita e UX previsível.

### Invariantes verificadas
Confirmada não muda; totais calculados não digitados livremente.

### Inconsistências encontradas
**Gap explícito:** política de preço em Rascunho/Orçamento não está em PricingModel/SaleSnapshots como decisão.

### Ajustes recomendados
Recomendação técnica: **A (freeze)** + ação “sincronizar preços do catálogo”; nunca C.

### Classificação
**decisão do fundador necessária**
