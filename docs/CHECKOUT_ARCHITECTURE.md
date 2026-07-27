---
Status: Active
Owner: Platform Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: checkout / acquisition
Supersedes: MARKETING_WEBSITE checkout placeholder
Superseded-By: None
Related-Modules: Marketing, Subscription, Provisioning, Onboarding
---

# Checkout Architecture

Checkout é o fluxo público de aquisição da Rescript. Ele conecta o website aos planos e prepara a criação da empresa sem executar cobrança.

## Escopo

- cria `CheckoutSession`;
- coleta plano, ciclo, empresa e proprietário;
- aceita termos;
- chama o provisionamento transacional;
- direciona o owner ao primeiro login.

## Fora do escopo

- gateways de pagamento;
- cobrança real;
- webhooks;
- emissão de invoice;
- financeiro operacional do cliente.

## Lifecycle

`CREATED → STARTED → COMPLETED`

Estados terminais: `COMPLETED`, `EXPIRED`, `CANCELLED`, `FAILED`.

## Segurança

O browser nunca recebe `service_role`. A criação do owner no Supabase Auth ocorre apenas em server function server-only. A sessão pública é identificada por `public_token` e não concede acesso operacional ao ERP.

## Planos

Checkout consome `saas_plan`, `saas_plan_version` e `saas_plan_price`. Regras comerciais devem continuar versionadas em dados, nunca espalhadas em código de domínio operacional.
