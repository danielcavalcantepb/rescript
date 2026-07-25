# Cenário 22 — Importação de Produtos

## Cenário

CSV válido com erros por linha; preview; commit parcial; reexecução idempotente.

### Objetivo
Validar ImportJob, preview, erros, commit e idempotency_key do job.

### Atores
Owner/Admin (`catalog.import`)

### Estado inicial
Org A; file uploaded; mapeamento colunas SKU, nome, preço, unidade.

### Pré-condições
Entitlement import; arquivo não expirado.

### Passos executados

#### 1. Upload + Preview
1. **Comando:** `CreateImportJob(type=products, file_id, mapping)`
2. **Autorização:** catalog.import
3. **Validações:** schema mapping; tamanho; content-type
4. **Consultadas:** File (org isolation)
5. **Criadas:** ImportJob(previewing); ImportRow statuses; avisos/erros
6. **Alteradas:** File.state linked
7–10. Audit import started; sem outbox crítico
11. Contadores preview
13. Falha: encoding inválido
14. Reupload

#### 2. Commit parcial
1. **Comando:** `CommitImportJob(job_id, mode=partial_valid_rows)`
2–3. Só linhas validas; inválidas ficam com erro
5. Products + default Variants + Prices; movements se estoque inicial
6. Job→completed_partial
7. Locks por SKU ordenados
8–10. Audit + DomainEvents ProductImported
11. Contadores created/updated/skipped
13. Falha mid-batch → TX por lote + retomável
14. Resume com mesma job idempotency

#### 3. Reexecução mesmo arquivo/key
1. Mesma idempotency_key → retorna job anterior; não duplica produtos

### Estado final esperado
Linhas válidas persistidas; inválidas reportadas; reexecução não duplica.

### Invariantes verificadas
Tenant no File/Job; unique SKU; idempotência do job.

### Inconsistências encontradas
- Tamanho de lote/transação parcial pouco especificado.
- Política update vs skip na reimport (cenário 23).

### Ajustes recomendados
Definir batch size e estratégia de commit (all-or-nothing vs partial) como OrganizationPolicy.

### Classificação
**aprovado com ressalvas**
