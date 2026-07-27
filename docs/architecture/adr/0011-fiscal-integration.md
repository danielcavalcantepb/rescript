---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0011-fiscal-integration
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0011 — Fiscal por Integração (Adapter)

**Status:** Aceito · **Reversibilidade:** alta

## Contexto
A tributação brasileira é vasta e mutável (SEFAZ, prefeituras, tipos de documento, contingência). Detalhes em `../FiscalIntegration.md`.

## Problema
Construir a complexidade fiscal internamente ou delegar a um provedor especializado, sem ficar preso a ele?

## Alternativas
- **A. Integração com provedor fiscal via adapter** (isolamento, múltiplos provedores futuros).
- **B. Construir emissão fiscal internamente.**
- **C. Acoplar diretamente a um provedor específico** (sem adapter).

## Decisão
**(A)** Delegar emissão/comunicação fiscal a provedor(es) especializado(s) atrás de um **adapter** com interface estável. Rescript detém dados comerciais e documentos; provedor detém regras tributárias. Emissão assíncrona, idempotente, com webhooks autenticados.

## Justificativa
(B) reconstruiria um domínio enorme e em constante mudança — fora da nossa proposta de valor e alto risco. (C) cria lock-in perigoso. (A) foca o Rescript no que agrega valor e mantém a escolha de provedor reversível.

## Consequências positivas
- Foco no core (operação comercial), não em tributos.
- Sem lock-in; múltiplos provedores possíveis.
- Venda consistente independentemente do fiscal.

## Consequências negativas
- Dependência de disponibilidade do provedor (mitigada por retry/desacoplamento).
- Custo do provedor.

## Riscos
R11 (certificados/segredos) — mitigado por cofre e custódia no provedor quando possível.

## Gatilhos de revisão
- Troca/adição de provedor.
- Cobertura de novos tipos de documento.
