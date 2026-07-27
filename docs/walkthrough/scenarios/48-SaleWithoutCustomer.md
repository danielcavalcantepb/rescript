---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 48-SaleWithoutCustomer
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 48 — Venda sem Cliente (exploratório)

## Cenário

Venda avulsa se política permitir; customer_id null; snapshot mínimo.

### Objetivo
RN/policy venda avulsa.

### Atores
Vendedor

### Estado inicial
Policy allow_sale_without_customer=true.

### Passos executados

#### 1. CreateSale sem customer
3. Permitido pela policy
5. Sale customer_id null; snapshot “Consumidor não identificado” ou vazio
#### 2. Se policy false
13. rejeita

### Estado final esperado
Confirmável; insights de cliente inativo não aplicam.

### Invariantes verificadas
Policy org; tenant.

### Inconsistências encontradas
Texto do snapshot padrão não especificado.

### Ajustes recomendados
Seed policy default conforme beachhead (B2B: false recomendado).

### Classificação
**aprovado com ressalvas**
