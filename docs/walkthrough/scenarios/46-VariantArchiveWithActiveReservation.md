---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 46-VariantArchiveWithActiveReservation
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 46 — Arquivar Variante com Reserva Ativa (exploratório)

## Cenário

Tentativa de arquivar variante com Reservation active.

### Objetivo
Definir bloqueio vs liberação forçada.

### Atores
Admin catálogo

### Estado inicial
Reservation active qty=3; Sale Pedido.

### Passos executados

#### 1. ArchiveVariant
3. **Recomendação:** bloquear enquanto reserved>0 ou Sale não terminal
13. Erro has_active_reservations
Alternativa perigosa: archive + keep reservation — UI venda nova bloqueada OK, mas Pedido segue

### Estado final esperado
Arquivamento só após liberar/consumir/cancelar compromisso.

### Invariantes verificadas
Integridade operacional.

### Inconsistências encontradas
Regra não explícita em ProductModel/VariantModel.

### Ajustes recomendados
Constraint de domínio: archive exige reserved=0 e sem SaleItem em estados não terminais (ou só bloquear reserved>0).

### Classificação
**aprovado com ressalvas**
