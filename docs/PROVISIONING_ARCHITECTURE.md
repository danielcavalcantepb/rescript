---
Status: Active
Owner: Platform Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: provisioning / tenant lifecycle
Supersedes: None
Superseded-By: None
Related-Modules: Checkout, Organization, Membership, Subscription, Onboarding
---

# Provisioning Architecture

Provisioning transforma uma sessão de checkout válida em uma empresa operável.

## Modelo

`organization` continua sendo o tenant root canônico do ERP. Por isso, no aggregate de provisioning, `tenant_id` é o identificador lógico do tenant e tem o mesmo valor de `organization_id`.

## Operação transacional

O provisionamento cria, em uma transação:

1. Organization;
2. Membership owner;
3. Subscription inicial;
4. Stock location padrão;
5. Onboarding workspace;
6. History append-only.

Se a transação falhar, nada parcial é persistido. Se o usuário Auth tiver sido criado antes da falha, a server function remove o usuário criado.

## Lifecycle

`PENDING → RUNNING → SUCCESS`

Estados de falha: `FAILED`, `ROLLBACK`.

## Idempotência

Cada execução possui `idempotency_key`. Uma sessão com provisioning `SUCCESS` retorna o resultado existente e não cria segunda organização.
