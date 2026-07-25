# Cenário 31 — Falha no Provedor Fiscal

## Cenário

Venda confirmada; solicitação fiscal falha; venda permanece válida; retry sem duplicar nota.

### Objetivo
Fiscal desacoplado do núcleo (FiscalBoundaryModel); Sale ≠ documento fiscal.

### Atores
Sistema pós-confirm; provider fiscal

### Estado inicial
Sale Confirmada; FiscalRequest criado (async) status=pending.

### Pré-condições
Módulo fiscal futuro/V1 habilitado; adapter substituível.

### Passos executados

#### 1. ConfirmSale (núcleo)
Dentro da TX: estoque+recebível; **não** depende de NF emitida.
Outbox: `FiscalIssuanceRequested` opcional.

#### 2. Worker chama provider → timeout
6. FiscalRequest→failed/retrying; next_retry_at; Sale **inalterada** Confirmada
13. Erro visível na UI fiscal; não reverte venda

#### 3. Retry sucesso
5. provider_ref + access_key únicos; status issued
13. Segunda emissão bloqueada por idempotency da request

### Estado final esperado
Sale válida; no máximo um documento fiscal emitido por request idempotente.

### Invariantes verificadas
Núcleo independente de fiscal; idempotência emissão.

### Inconsistências encontradas
Nenhuma no MVP core (fiscal fora do caminho crítico).

### Ajustes recomendados
Nunca incluir chamada HTTP fiscal dentro da TX de ConfirmSale.

### Classificação
**aprovado**
