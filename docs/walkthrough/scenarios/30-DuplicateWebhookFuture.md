---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 30-DuplicateWebhookFuture
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 30 — Webhook Duplicado (Fronteira Futura)

## Cenário

Provedor fiscal/pagamento envia o mesmo evento duas vezes; ordem pode variar; processamento idempotente.

### Objetivo
Validar IntegrationModel / FiscalBoundary: external_ref + idempotency; venda não duplica efeitos.

### Atores
Provider; webhook worker

### Estado inicial
PaymentIntent ou FiscalRequest com provider_ref=PR-1 já processado (ou pendente).

### Pré-condições
Fronteira V1/futuro; credenciais via secret store.

### Passos executados

#### 1. Delivery #1
1. **Comando:** `HandleWebhook(provider, event_id=E1, payload)`
3. Valida assinatura; mapeia external ids
5. Cria WebhookDelivery processed; aplica efeito uma vez (ex. payment confirmed)
8–10. Audit + outbox internos

#### 2. Delivery #2 (mesmo event_id)
3. Dedup por (provider, event_id) → ack sem reaplicar
5. Nenhuma alteração de domínio

#### 3. Ordem invertida (failed depois succeeded)
- Máquina de status do FiscalRequest/Payment deve ser monotônica ou com regras explícitas; eventos stale ignorados

### Estado final esperado
Efeito único; deliveries auditáveis; Sale/Payment consistentes.

### Invariantes verificadas
Idempotência integração; tenant no mapping.

### Inconsistências encontradas
- Provedores não escolhidos (OQ-07) — ok nesta fase.
- Monotonicidade de status webhook vs domínio precisa ADR futuro.

### Ajustes recomendados
Tabela WebhookDelivery unique (provider, event_id); ignore stale transitions.

### Classificação
**aprovado com ressalvas** (fronteira futura)
