# Rescript — Domain Walkthrough

> Fase de validação operacional do domínio, arquitetura e modelo lógico por simulação de cenários reais.
> **Não é implementação.** Sem SQL, migrations, schema físico, Supabase ou código de aplicação.
> Status: Validação (pré-schema físico).

---

## 1. Propósito

Simular a operação completa do Rescript para responder se o domínio **suporta**, **falha** ou **exige decisão** antes de criar o schema físico.

## 2. Precedência

1. `docs/domain/FounderDecisions.md`
2. ADRs aprovados
3. `docs/domain/Invariants.md`
4. `docs/BusinessRules.md`
5. Documentação de domínio
6. Documentação de arquitetura
7. Documentação de banco lógico (`docs/database/`)
8. Documentação estratégica

Conflitos → `ConsistencyReview.md` e `IssueRegister.md` — **nunca resolvidos em silêncio**.

## 3. Hipóteses provisórias da simulação

| ID | Hipótese | Nota |
|---|---|---|
| H-01 | Precisão qty padrão 3 casas; configurável por unidade | ≠ decisão final (OQ-01) |
| H-02 | Estoque negativo **proibido** na simulação | **Conflito** com RN-34 `allow_with_alert` |
| H-03 | Custo médio por org + local + variante | OQ-09 |
| H-04 | Um local padrão no MVP; modelo multi-local ready | OQ-10 |
| H-05 | Orçamento não reserva por padrão; Pedido reserva | OQ-03 |
| H-06 | TTL de reserva e % desconto configuráveis | OQ-02, OQ-04 |
| H-07 | Money: storage físico aberto | OQ-05 |

## 4. Índice de documentos

| Documento | Conteúdo |
|---|---|
| `ScenarioCatalog.md` | Catálogo dos 55 cenários |
| `scenarios/` | Walkthroughs individuais |
| `ScenarioCoverage.md` | Matriz cenário × módulos/entidades |
| `InvariantCoverage.md` | Cobertura de invariantes |
| `TransactionCoverage.md` | Ops transacionais exercitadas |
| `SecurityCoverage.md` | Segurança / tenancy |
| `ConcurrencyCoverage.md` | Concorrência |
| `IssueRegister.md` | Problemas encontrados |
| `FounderQuestions.md` | Decisões necessárias |
| `DomainValidation.md` | Respostas às 15 perguntas-guia |
| `ConsistencyReview.md` | Conflitos entre documentos |
| `FinalRecommendation.md` | Pronto para schema físico? |

## 5. Classificação dos cenários

- **aprovado** — domínio cobre o fluxo
- **aprovado com ressalvas** — cobre com lacunas não bloqueantes ou hipóteses
- **bloqueado** — inconsistência impede schema seguro
- **decisão do fundador necessária** — opções explícitas pendentes

## 6. Resultado agregado (desta execução)

| Métrica | Valor |
|---|---|
| Cenários simulados | **55** (40 obrigatórios + 15 exploratórios) |
| Aprovados | **21** |
| Aprovados com ressalvas | **29** |
| Bloqueados | **0** |
| Decisão do fundador necessária | **5** |

Ver `FinalRecommendation.md` para veredito sobre schema físico.
