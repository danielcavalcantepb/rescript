# ADR-0014 — Estratégia de Testes

**Status:** Aceito · **Reversibilidade:** alta

## Contexto
O risco concentra-se em consistência transacional, isolamento multi-tenant, autorização/RLS e cálculos. Detalhes em `../TestingStrategy.md`.

## Problema
Onde investir esforço de teste para proteger o que realmente importa, sem perseguir cobertura por vaidade?

## Alternativas
- **A. Pirâmide adaptada:** unitários (domínio/cálculos) + camada gorda de integração com Postgres real (transações/RLS/concorrência/idempotência) + E2E crítico + suíte de segurança/isolamento; cenários críticos bloqueiam deploy.
- **B. Foco em E2E** (muitos testes de ponta a ponta).
- **C. Meta de 100% de cobertura.**

## Decisão
**(A)** Esforço proporcional ao risco; **testes de RLS/isolamento contra Postgres real bloqueiam deploy**; lista de cenários críticos (`../TestingStrategy.md` §4) sempre coberta; concorrência e idempotência testadas explicitamente.

## Justificativa
(B) é lento e frágil como base. (C) desperdiça esforço em código trivial. (A) protege consistência e isolamento — onde o custo de erro é máximo — com testes que só valem contra o banco real.

## Consequências positivas
- Consistência e isolamento garantidos por CI.
- Regressões críticas barradas antes de produção.

## Consequências negativas
- Testes de integração/RLS são mais lentos que unitários.
- Requer infra de Postgres de teste.

## Riscos
R1, R2 (os riscos que estes testes existem para mitigar).

## Gatilhos de revisão
- Novos domínios críticos (adicionar cenários obrigatórios).
- Tempo de CI crescendo (paralelização).
