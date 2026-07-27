---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 24-ImportVsManualConcurrency
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 24 — Importação vs Cadastro Manual Concorrente

## Cenário

Importação e usuário criam o mesmo SKU simultaneamente; constraint impede duplicata.

### Objetivo
Validar unicidade `(organization_id, sku)` como defesa de concorrência.

### Atores
Admin (import); Vendedor (UI create product)

### Estado inicial
SKU-XYZ inexistente; dois fluxos paralelos.

### Pré-condições
Ambos autorizados.

### Passos executados

#### 1. Corrida
1. **Comandos:** `CreateProduct(SKU-XYZ)` ∥ `CommitImportRow(SKU-XYZ)`
2. **Autorização:** respectivas permissões
3. **Validações:** SKU formato
4–7. Ambos tentam INSERT; um commit; outro recebe unique violation
8–10. Vencedor audita create; perdedor erro mapeado “SKU já existe”
11. Um produto apenas
13. Falha do segundo → UX retry/update
14. Recuperação: abrir produto existente

### Estado final esperado
Exatamente uma variante com SKU-XYZ.

### Invariantes verificadas
C-SKU unique por org; sem cross-tenant.

### Inconsistências encontradas
Nenhuma estrutural — depende de constraint no schema físico futuro.

### Ajustes recomendados
Mapear erro de constraint para código de domínio estável.

### Classificação
**aprovado**
