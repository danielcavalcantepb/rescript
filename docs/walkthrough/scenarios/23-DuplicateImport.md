# Cenário 23 — Importação Duplicada (SKU/Documento)

## Cenário

Reimportação encontra SKU ou documento de cliente já existente; política ignore/update/ask.

### Objetivo
Verificar se a política de conflito de importação está definida.

### Atores
Admin importador

### Estado inicial
Produto SKU-ABC já existe; CSV contém SKU-ABC com preço diferente.

### Pré-condições
ImportJob em commit; policy de conflito selecionada ou default.

### Passos executados

#### 1. Commit com conflito
1. **Comando:** `CommitImportJob` linha SKU-ABC
2. **Autorização:** catalog.import
3. **Validações:** unique (org, sku)
4. **Consultadas:** ProductVariant by SKU
5–6. Conforme política:
   - **skip/ignore:** marca row skipped; não altera preço
   - **update:** atualiza preço futuro; **não** reescreve Sales históricas
   - **ask:** job fica awaiting_decision (estrutura?)
7. Locks na variant
8–10. Audit da decisão
13. Sem política → comportamento indefinido (**gap**)

### Estado final esperado
Sem duplicata de SKU; histórico de vendas intacto.

### Invariantes verificadas
Unicidade SKU; snapshots Sale imutáveis.

### Inconsistências encontradas
- ImportModel menciona duplicidade mas **não fecha** default MVP (skip vs update vs ask).
- “Ask” pode exigir entidade ImportConflictDecision ausente/explícita.

### Ajustes recomendados
Default MVP: **skip** + relatório; update só com flag explícita; ask = V1.

### Classificação
**decisão do fundador necessária** (política default de conflito)
