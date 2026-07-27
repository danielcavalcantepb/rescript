---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0019-discount-authorization-policy
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0019 — Política de Autorização de Desconto

**Status:** Aceito · **Reversibilidade:** alta

## Contexto
Descontos sem controle destroem margem. FD-05 exige controle no MVP baseado em permissão e política da organização.

## Problema
Como limitar descontos sem engessar o modelo a nomes de papéis fixos?

## Alternativas
- **A. Política por organização + permissões granulares** (`sales.discount`, `sales.discount.authorize`).
- **B. Limite fixo só por nome de papel.**
- **C. Sem limite no MVP.**

## Decisão
**(A)** Organização define teto sem autorização, quem pode autorizar acima do teto, motivo obrigatório em descontos sensíveis. Registro: percentual, valor, responsável, autorização, motivo, data, efeito na margem. Checagem por **permissão**, não por nome de papel.

## Justificativa
Alinha com RBAC por permissão (ADR-0004) e protege a margem (base da inteligência).

## Consequências positivas
- Auditável; evolui com papéis customizados.

## Consequências negativas
- Configuração e UX de autorização a cuidar.

## Riscos
Bypass na UI — mitigado por validação no serviço de domínio/aplicação.

## Gatilhos de revisão
Aprovação multi-nível; desconto por lista de preço/cliente.
