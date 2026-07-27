---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: architecture / AuditArchitecture
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Arquitetura de Auditoria

> Trilha imutável de ações sensíveis: quem, quando, o quê, em qual contexto. Base da confiança e da responsabilização.
> Status: Design de arquitetura (pré-implementação).

---

## 1. Quatro conceitos distintos (nunca confundir)

| Conceito | O que registra | Natureza | Exemplo |
|---|---|---|---|
| **Audit log** | Ações sensíveis do usuário/sistema | Append-only, longo prazo, de negócio | "Fulano estornou o pagamento X" |
| **Histórico de domínio** | Evolução de estado de uma entidade | Parte do modelo de negócio | Situação da venda ao longo do tempo; ledger de estoque |
| **Logs técnicos** | Eventos operacionais/erros | Curto/médio prazo, para engenharia | Stack trace, latência |
| **Eventos de domínio** | Fatos ocorridos (`DomainEvents.md`) | Comunicação interna | `SaleConfirmed` |
| **Observabilidade** | Métricas/tracing (`Observability.md`) | Operacional/agregado | p95 de latência |

> O **audit log** responde "quem fez o quê e por quê" para fins de negócio/segurança/compliance. Não é log técnico nem substitui o histórico de domínio — eles se complementam.

---

## 2. Ações Sensíveis Auditadas (mínimo)

Confirmação de venda, cancelamento, exclusão, ajuste de estoque, alteração de preço, alteração de vencimento, registro de pagamento, estorno, importação, mudança de permissão/papel, acesso administrativo (suporte interno), emissão/cancelamento fiscal, transferência de propriedade, mudança de plano/assinatura, login administrativo, alteração de configurações críticas.

---

## 3. O que cada entrada registra

| Campo | Descrição |
|---|---|
| **Quem** | Usuário (e se foi suporte interno) |
| **Quando** | Timestamp preciso |
| **Organização** | `organization_id` (tenant) |
| **Ação** | Verbo padronizado (ex.: `payment.reversed`) |
| **Entidade** | Tipo + id do alvo |
| **Estado anterior** | Quando aplicável (para mudanças) |
| **Estado posterior** | Quando aplicável |
| **Origem** | IP/dispositivo/canal quando relevante |
| **Correlação** | `correlation_id` ligando à requisição/evento (`Observability.md`) |
| **Contexto** | Motivo/observação quando a ação exige justificativa |

---

## 4. Propriedades

```mermaid
graph LR
    ACT[Ação sensível] --> SVC[Serviço de aplicação]
    SVC --> DB[(Escrita de negócio)]
    SVC --> AUD[(Audit log append-only)]
    DB -. mesma transação quando crítico .- AUD
    AUD --> IMMUT[Imutável: sem UPDATE/DELETE]
```

- **Append-only:** entradas nunca são editadas ou apagadas (AP15).
- **Atômica com a ação quando crítico:** a auditoria de uma operação transacional é gravada **na mesma transação** (ex.: confirmar venda), garantindo que "aconteceu ⇒ foi auditado". Auditorias de efeitos secundários podem vir via evento.
- **Isolada por tenant:** `organization_id` obrigatório; RLS aplicável.
- **Consultável:** o dono/admin pode ver o histórico de ações sensíveis (respeitando permissões).

---

## 5. Correlação com Observabilidade e Eventos

- Cada requisição carrega um `correlation_id` que aparece no **audit log**, nos **logs técnicos** e no **tracing** (`Observability.md`) — permitindo reconstruir um incidente ponta a ponta.
- Eventos de domínio (`DomainEvents.md`) e entradas de auditoria compartilham o mesmo `correlation_id` quando derivam da mesma ação.

---

## 6. Retenção, Privacidade e Segurança

- Audit logs têm **retenção longa** (compliance), definida em `Privacy.md`.
- **Não** registram dados sensíveis desnecessários (ex.: não logar dado pessoal completo quando o id basta) — minimização (`Privacy.md`).
- Acesso ao audit log é **restrito** (permissão) e o próprio acesso pode ser auditado.
- Audit logs são incluídos em **backups** (`Security.md`).

---

## 7. Invariantes

1. Toda ação sensível gera **exatamente uma** entrada de auditoria (idempotente com a operação).
2. Audit log é **append-only e imutável**.
3. Auditoria de operação crítica é **atômica** com a operação.
4. Toda entrada tem `organization_id`, ator, ação, timestamp e correlação.
5. Audit log ≠ histórico de domínio ≠ logs técnicos ≠ observabilidade — cada um com seu papel.
6. Minimização: registra o necessário para responsabilização, sem excesso de dados pessoais.
