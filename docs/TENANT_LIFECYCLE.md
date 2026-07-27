---
Status: Active
Owner: Platform Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: tenant / organization lifecycle
Supersedes: None
Superseded-By: None
Related-Modules: Organization, Membership, Subscription, Checkout, Provisioning
---

# Tenant Lifecycle

No ERP Rescript, `organization` é o tenant root. Todo dado operacional pertence a uma organização e todo acesso depende de membership ativa.

## Estados da Organization

- `active`;
- `suspended`;
- `canceled`.

## Criação

Uma organização nasce por:

1. onboarding autenticado legado (`create_organization`);
2. checkout público seguido de provisioning transacional.

O checkout é o fluxo comercial preferencial para novos clientes.

## Owner

Cada organização possui exatamente um owner ativo inicial. O owner nasce com membership `owner`, `is_owner = true` e permissões máximas derivadas de `@rescript/permissions`.

## Assinatura

Toda organização provisionada pelo checkout recebe uma `subscription` inicial vinculada a `saas_plan_version`. O status inicial é `trial` quando o plano possui período de teste; caso contrário, `active`.
