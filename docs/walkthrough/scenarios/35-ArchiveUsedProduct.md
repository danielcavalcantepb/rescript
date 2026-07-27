---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 35-ArchiveUsedProduct
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 35 — Arquivamento de Produto Utilizado

## Cenário

Produto com histórico é arquivado; some de novas vendas; histórico permanece; exclusão física bloqueada.

### Objetivo
Arquivar ≠ apagar; DeletionAndRetention.

### Atores
Admin catálogo

### Estado inicial
Produto P com Sales Confirmadas e movements.

### Pré-condições
catalog.product.archive

### Passos executados

#### 1. ArchiveProduct
6. archived_at set; status archived; variantes arquivadas em cascata lógica
5. Sem delete movements/sales
#### 2. Nova Sale tenta adicionar
3. Validação rejeita variante arquivada
#### 3. Hard delete
3. Bloqueado enquanto dependências operacionais existem (sempre para items movimentados)

### Estado final esperado
Histórico legível; não selecionável em UI de nova venda.

### Invariantes verificadas
Retenção operacional; snapshots intactos.

### Inconsistências encontradas
Nenhuma.

### Ajustes recomendados
UI “mostrar arquivados” só em consultas históricas.

### Classificação
**aprovado**
