---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / IntegrationModel
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Modelo Lógico — Integrações Genéricas

---

## 1. Estruturas

### IntegrationConnection
- organization_id, provider_code, status, scopes, external_account_ref
- credential_secret_ref (cofre — não segredo em claro)

### ExternalMapping
- organization_id, provider, local_type, local_id, external_id
- unique (org, provider, local_type, local_id) e (org, provider, external_id, local_type)

### SyncCursor / SyncJob
- connection_id, cursor, status, error, consecutive failures

### WebhookEndpoint / WebhookDelivery
- signature validation meta, delivery status, attempts, idempotency (external_event_id)

---

## 2. Princípios
- Provider substituível
- Segredos só por referência
- Idempotência em webhooks
- organization_id em tudo

---

## 3. Escopo
MVP: mínimo (billing webhook boundary). WhatsApp/Fiscal: V1/V2 conforme roadmap.
