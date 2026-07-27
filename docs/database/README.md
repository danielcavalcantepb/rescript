---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / README
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Modelagem Lógica de Dados (Validação)

> Modelo lógico consistente, normalizado e preparado para PostgreSQL.  
> **Não é** SQL, migration, Prisma, Drizzle, Supabase CLI nem código.  
> Status: Validação lógica (pré-schema físico).  
> Base: modelo aprovado em `docs/database/` + domínio + ADRs + UX + walkthrough.

---

## 1. Missão desta fase

Validar e formalizar o modelo lógico **antes** da implementação física, de forma que engenharia possa gerar schema sem reinterpretar o domínio.

## 2. Precedência

1. FounderDecisions  
2. ADRs  
3. Invariants  
4. BusinessRules  
5. Domínio  
6. Arquitetura  
7. UX / screens (não altera regras)  
8. Este pacote de validação  

Conflitos → `ConsistencyReview.md` + seção 14 do resumo — **nunca em silêncio**.

## 3. Hipóteses provisórias (não decisões finais)

Herdadas do walkthrough / OQs — marcar como HYPOTHESIS até voto do fundador:

| Tema | Hipótese de modelagem |
|---|---|
| Qty precision | 3 casas default; por unidade |
| Negativo | policy org (RN-34); default allow_with_alert |
| Avg cost key | (org, location, variant) — OQ-09 |
| Locais | 1 padrão MVP |
| Quote reserve | não por padrão |
| Money storage | aberto OQ-05 (logical Money permanece) |

## 4. Índice — pacote de validação (esta entrega)

| Documento | Conteúdo |
|---|---|
| `EntityCatalog.md` | Entidades, agregados, ownership |
| `Attributes.md` | Atributos lógicos por entidade |
| `Relationships.md` | Relacionamentos e delete behavior |
| `Constraints.md` | Integridade |
| `UniqueRules.md` | Unicidades |
| `Indexes.md` | Índices conceituais |
| `Transactions.md` | Ops atômicas |
| `Concurrency.md` | Concorrência |
| `OptimisticLocking.md` | Versionamento |
| `RLSStrategy.md` | Estratégia RLS (sem SQL) |
| `Views.md` / `MaterializedViews.md` | Projeções |
| `Functions.md` | Funções lógicas futuras |
| `Outbox.md` / `Idempotency.md` | Mensageria / replay |
| `Ledger.md` | Ledgers estoque/financeiro |
| `NamingConvention.md` | Nomes |
| `Performance.md` | Escala 10→100k orgs |
| `BackupRecovery.md` | Backup |
| `Retention.md` / `SoftDelete.md` | Retenção / fim de vida |
| `AuditPersistence.md` | Auditoria |
| `Seeds.md` | Seeds lógicos |
| `MigrationStrategy.md` | Como migrar depois |
| `TestingStrategy.md` | Testes de dados |
| `ERD.md` | Mermaid por contexto |
| `Glossary.md` | Termos |
| `ValidationChecklist.md` | Checklist 10 perguntas |

## 5. Documentos de domínio de dados (aprovados — detalhe)

Continuar válidos: `LogicalModel.md`, `*Model.md` por área, `RLSMatrix.md`, `OpenQuestions.md`, etc.  
Este pacote **não os invalida**; consolida e valida para implementação.

## 6. Proibido nesta fase

SQL · migrations · Prisma/Drizzle · Supabase CLI · seed executável · RLS SQL · bootstrap app.
