# Rescript — Modelagem de Domínio (DDD)

> Modelagem **conceitual** do negócio do Rescript com Domain-Driven Design. O objetivo é garantir que **cada conceito exista por um motivo de negócio**, não porque será armazenado.
> Status: **Modelagem conceitual (pré-modelagem lógica de banco).** Sem tabelas, SQL, migrations, Prisma, Supabase, schemas físicos ou código.

---

## 1. Propósito

Esta pasta descreve o **domínio** do Rescript: os conceitos, suas regras, seus estados e sua linguagem. É a ponte entre a estratégia (`docs/`) e a arquitetura técnica (`docs/architecture/`), e o insumo direto para a futura modelagem lógica de dados.

> Regra desta fase: **modelamos o negócio, não o banco.** Se um conceito só existe "para guardar dado", ele é questionado. Se um conceito existe por uma razão de negócio, ele é um cidadão de primeira classe do domínio.

---

## 2. Relação com as outras camadas

| Camada | Pasta | Papel |
|---|---|---|
| Estratégia / Produto | `docs/` | Por que o produto existe, o que ele é |
| **Domínio (esta pasta)** | `docs/domain/` | **O modelo conceitual do negócio** |
| Arquitetura técnica | `docs/architecture/` | Como será construído (stack, fronteiras, transações) |
| Modelagem lógica (futuro) | — | Só começa após aprovação desta fase |

A arquitetura já definiu as fronteiras (`architecture/ModuleBoundaries.md`) e as invariantes técnicas (ledger de estoque/financeiro, atomicidade da venda). **O domínio aqui aprofunda o *significado* de cada conceito** e resolve as inconsistências apontadas no resumo da fase anterior.

---

## 3. Conceitos DDD usados (definições operacionais)

- **Entidade:** objeto com **identidade** própria e ciclo de vida (ex.: `Sale`). Dois com os mesmos atributos ainda são distintos.
- **Value Object (VO):** objeto definido **pelos seus valores**, sem identidade, imutável (ex.: `Money`). Dois `Money(10, BRL)` são iguais.
- **Agregado:** cluster de entidades/VOs tratado como **uma unidade de consistência**. Tem uma raiz.
- **Aggregate Root (raiz):** a única entidade do agregado acessível de fora; guardiã das invariantes internas.
- **Serviço de Domínio:** lógica de negócio que **não pertence naturalmente** a uma entidade/VO (ex.: confirmar venda, que coordena vários agregados).
- **Política (Policy):** uma regra de negócio nomeada, muitas vezes configurável, que decide um comportamento (ex.: política de estoque negativo).
- **Invariante:** verdade que **sempre** deve valer; nunca pode ser violada em nenhum estado válido.
- **Evento de Domínio:** algo relevante que **aconteceu** no negócio (nome no passado).
- **Comando:** intenção de **mudar** o estado (imperativo).
- **Query:** intenção de **ler** sem efeito colateral.
- **Bounded Context:** fronteira onde um modelo e uma linguagem são coerentes.

---

## 4. Índice de documentos

| Documento | Conteúdo |
|---|---|
| `README.md` | Este guia |
| `UbiquitousLanguage.md` | Linguagem ubíqua por contexto e princípios |
| `BoundedContexts.md` | Os contextos delimitados e o mapa entre eles |
| `ValueObjects.md` | Avaliação e definição dos value objects |
| `Entities.md` | Ficha completa de cada entidade |
| `Aggregates.md` | Agregados, raízes e limites de consistência |
| `DomainServices.md` | Serviços de domínio |
| `DomainEvents.md` | Eventos de domínio (significado de negócio) |
| `BusinessPolicies.md` | Políticas e regras de negócio |
| `Invariants.md` | Invariantes por agregado |
| `StateMachines.md` | Máquinas de estado |
| `Lifecycle.md` | Ciclos de vida das entidades |
| `UseCases.md` | Casos de uso detalhados |
| `Commands.md` | Catálogo de comandos |
| `Queries.md` | Catálogo de queries |
| `Terminology.md` | Convenções de nomenclatura e decisões de termos |
| `Glossary.md` | Glossário alfabético de referência rápida |

---

## 5. Ordem de leitura recomendada

1. `UbiquitousLanguage.md` → `BoundedContexts.md` (o mapa mental)
2. `ValueObjects.md` → `Entities.md` → `Aggregates.md` (os blocos)
3. `Invariants.md` → `BusinessPolicies.md` (as regras)
4. `StateMachines.md` → `Lifecycle.md` (o comportamento no tempo)
5. `DomainServices.md` → `DomainEvents.md` (a coordenação)
6. `UseCases.md` → `Commands.md` / `Queries.md` (a interação)
7. `Terminology.md` / `Glossary.md` (referência)

---

## 6. Decisões oficiais do fundador

Todas as pendências da modelagem DDD foram fechadas em **`FounderDecisions.md`** (FD-01…FD-08): custeio médio, reserva no MVP, Sale sem Order, sem juros no MVP, desconto com autorização, unidades fracionadas, BRL operacional, VariantAttribute genérico.

Terminologia: **Venda Confirmada** / **Confirmar Venda**; estoque na **variante**; **reserva ≠ movimento físico**. Ver `Terminology.md`.

---

## 7. O que esta fase NÃO faz

Sem tabelas, colunas, tipos SQL, chaves, índices, migrations, ORM, Supabase ou qualquer código. Nenhuma preocupação com *como* persistir — apenas com *o que* o negócio significa e *quais regras* ele obedece.
