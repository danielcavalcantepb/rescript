# ADR-0013 — Estratégia de Deploy

**Status:** Aceito · **Reversibilidade:** alta

## Contexto
App na Vercel, banco no Supabase, jobs em Postgres/worker. O maior risco de deploy são migrations e RLS. Detalhes em `../DeploymentStrategy.md`.

## Problema
Como implantar com segurança, previsibilidade e reversibilidade, validando migrations/RLS antes de produção?

## Alternativas
- **A. CI/CD com preview por PR + staging + migrations versionadas (expand/contract) + gates de teste/segurança.**
- **B. Deploy direto para produção** sem staging.
- **C. Deploy manual.**

## Decisão
**(A)** GitHub Actions com gates (lint, type-check, testes incl. RLS, scans); preview por PR; **staging recomendado** para validar migrations/RLS/integrações; migrations expand/contract; release desacoplado do deploy via feature flags; rollback rápido.

## Justificativa
(B) arrisca incidentes de consistência/isolamento — os mais caros. (C) não escala e é propenso a erro. (A) equilibra velocidade e segurança, protegendo os pontos frágeis (migrations/RLS).

## Consequências positivas
- Migrations/RLS validadas antes de produção.
- Reversibilidade (rollback + flags + backups).
- Previews aceleram revisão.

## Consequências negativas
- Manter staging tem custo.
- Pipeline mais elaborado.

## Riscos
R9 (migration ruim) — mitigado por staging + expand/contract + testes.

## Gatilhos de revisão
- Necessidade de deploy contínuo pleno (sem aprovação manual) conforme o time cresce.
- Custo de staging vs. benefício.
