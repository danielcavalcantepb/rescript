# Estratégia de Testes de Dados

---

## 1. Pirâmide

| Camada | Foco |
|---|---|
| Unit domínio | invariantes Quantity/Money/Sale transitions |
| Integration DB (futuro) | constraints, unique, TX ConfirmSale |
| Tenancy | cross-org impossível (RLS + app) |
| Concurrency | double confirm, two sellers, expire∥confirm |
| Idempotency | replay + hash mismatch |
| Insights | dados insuficientes ≠ falso positivo |
| Restore drill | BackupRecovery |

## 2. Fixtures

Sempre com `organization_id` explícito; nunca compartilhar IDs entre orgs nos testes.

## 3. Proibido em teste

Usar service role para “facilitar” sem assert de isolamento · flaky sleeps sem lock assertion.

## 4. Critérios de pronto para schema físico

Testes de invariantes documentados podem ser implementados **junto** com migrations — não nesta fase.
