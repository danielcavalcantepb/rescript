---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0002-modular-monolith
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0002 — Monólito Modular

**Status:** Aceito · **Reversibilidade:** média

## Contexto
Time pequeno, produto em validação, domínio com fronteiras fortes (`../ModuleBoundaries.md`). Precisamos de baixo acoplamento e alta coesão sem a complexidade operacional de sistemas distribuídos.

## Problema
Como estruturar o sistema para ter fronteiras claras entre domínios e permitir evolução, sem pagar o custo de microserviços prematuramente?

## Alternativas
- **A. Monólito modular** (um deploy, fronteiras internas fortes).
- **B. Microserviços desde o início.**
- **C. Monólito "big ball of mud"** (sem fronteiras).

## Decisão
**Monólito modular (A):** uma aplicação, módulos com fronteiras impostas (contratos + eventos), comunicação sem acesso cruzado a tabelas. Extração de serviços só com motivo mensurável (`../Scalability.md`).

## Justificativa
Microserviços (B) trariam complexidade distribuída (rede, consistência, deploy) sem benefício na escala atual (AP5, AP7). Um monólito sem fronteiras (C) apodrece. O modular dá o melhor dos dois: simplicidade de operação + disciplina de fronteiras que permite extrair depois.

## Consequências positivas
- Simplicidade operacional; transações locais (crucial para venda atômica).
- Fronteiras que permitem extração futura sem reescrita.
- Onboarding e debugging mais simples.

## Consequências negativas
- Requer disciplina para manter fronteiras (risco de virar monólito acoplado).
- Escala de um módulo específico exige extração eventual.

## Riscos
R12 (overengineering se criar fronteiras demais); acoplamento indevido se disciplina falhar. Mitigado por regras de import no build (`../RepositoryStrategy.md`).

## Gatilhos de revisão
- Um módulo com carga/deploy radicalmente distinto (candidato a serviço).
- Times independentes que justifiquem separação organizacional.
