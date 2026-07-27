---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0001-stack
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0001 — Stack Tecnológica

**Status:** Aceito (fase de arquitetura) · **Reversibilidade:** média (borda) / baixa (PostgreSQL)

## Contexto
O Rescript é um SaaS B2B multi-tenant transacional (estoque/financeiro) com camada de inteligência determinística. Precisamos de uma stack proporcional a um time pequeno, forte em consistência e multi-tenancy. Análise completa em `../TechnologyEvaluation.md`.

## Problema
Escolher tecnologias que sustentem consistência transacional, isolamento multi-tenant, inteligência e evolução por 10 anos, sem sobre-engenharia nem lock-in perigoso.

## Alternativas
- **A. Stack proposta:** TS/React/TanStack + Supabase (PostgreSQL/Auth/RLS/Storage/Edge) + Vercel + GitHub.
- **B. Next.js** no lugar de TanStack Start (mais maduro).
- **C. Backend próprio** (Node/NestJS + Postgres gerenciado) sem Supabase.
- **D. Banco NoSQL** para flexibilidade.

## Decisão
Adotar a **stack proposta (A)**, com três ajustes: (1) definir jobs assíncronos via **fila em PostgreSQL + `pg_cron`** (lacuna); (2) **isolar fornecedores** atrás de camadas próprias (auth, files, framework); (3) tratar **TanStack Start** como peça de maior risco, mantendo o domínio fora do framework.

## Justificativa
PostgreSQL é ideal para transações/constraints/RLS/agregações — o que mais importa. Supabase acelera identidade/storage/RLS. React/TanStack/Tailwind dão DX e simplicidade. NoSQL (D) foi rejeitado por ser inadequado a dados transacionais. Backend próprio (C) adiciona custo sem ganho neste estágio. Next.js (B) é alternativa válida, mas Start alinha com Router/Query e a preferência do time — risco mitigável.

## Consequências positivas
- Consistência e multi-tenancy fortes (Postgres + RLS).
- Baixo custo inicial; boa DX; contratação fácil.
- Insights determinísticos com views/funções nativas.

## Consequências negativas
- Dependência de Supabase (especialmente Auth) e Vercel.
- Edge Functions inadequadas para jobs longos.
- TanStack Start é jovem.

## Riscos
R3 (maturidade Start), R4 (jobs async), R5 (lock-in), R13 (custo) — ver `../TechnicalRisks.md`.

## Gatilhos de revisão
- Breaking change grave ou descontinuação do TanStack Start.
- Custo de fornecedor fora da meta por tenant.
- Fila em Postgres saturar (migrar para fila gerenciada).
