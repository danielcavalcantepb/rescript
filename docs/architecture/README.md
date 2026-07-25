# Rescript — Documentação de Arquitetura Técnica

> Índice e guia de leitura da arquitetura técnica do Rescript.
> Status: **Design de arquitetura (pré-implementação).** Nenhuma tabela, migration, código ou configuração foi criado.
> Esta documentação define decisões, fronteiras e princípios. A implementação depende de aprovação explícita do fundador.

---

## 1. Propósito

Definir uma arquitetura **sólida, segura, auditável e evolutiva** para o Rescript — capaz de crescer por 10 anos sem reescrita fundamental — respeitando a obsessão do produto por **simplicidade** e a tese central de **inteligência confiável construída sobre dados transacionais consistentes**.

Esta documentação **não** implementa o produto. Ela é o contrato técnico que a implementação deverá honrar.

---

## 2. Como esta documentação se relaciona com a estratégia

A camada estratégica vive em `docs/` (raiz). A arquitetura **serve** a estratégia, nunca o contrário:

| Estratégia (`docs/`) | Arquitetura (`docs/architecture/`) |
|---|---|
| Tese central e 3 camadas (`Vision.md`) | `SystemContext.md`, `InsightArchitecture.md` |
| Confiança nos dados (`DataTrust.md`) | `InventoryArchitecture.md`, `FinancialArchitecture.md`, `AuditArchitecture.md` |
| Simplicidade (`CorePrinciples.md`, `TheTwentyCommandments.md`) | `ArchitecturePrinciples.md` |
| Inteligência (`IntelligencePrinciples.md`, `InsightCatalog.md`) | `InsightArchitecture.md`, `DecisionCenterArchitecture.md` |
| Multi-tenant e escala (`ArchitectureOverview.md`) | `MultiTenancy.md`, `Scalability.md` |

---

## 3. Ordem de leitura recomendada

1. **Contexto e princípios:** `SystemContext.md` → `ArchitecturePrinciples.md` → `Glossary.md`
2. **Decisão de stack:** `TechnologyEvaluation.md`
3. **Domínios:** `ModuleBoundaries.md` → `DependencyMap.md`
4. **Fundações críticas:** `MultiTenancy.md` → `Authorization.md` → `Entitlements.md`
5. **Consistência (o coração):** `InventoryArchitecture.md` → `FinancialArchitecture.md` → `SaleTransaction.md`
6. **Assíncrono e inteligência:** `DomainEvents.md` → `MessagingArchitecture.md` → `InsightArchitecture.md` → `DecisionCenterArchitecture.md`
7. **Integrações e dados:** `ImportArchitecture.md` → `FiscalIntegration.md`
8. **Operação e qualidade:** `AuditArchitecture.md` → `Observability.md` → `Security.md` → `Privacy.md` → `TestingStrategy.md`
9. **Engenharia e evolução:** `RepositoryStrategy.md` → `DeploymentStrategy.md` → `Scalability.md` → `FailureModes.md` → `TechnicalRisks.md`
10. **Decisões formais:** `adr/` (Architecture Decision Records)

---

## 4. Catálogo de documentos

### Fundações
- **`SystemContext.md`** — o que o sistema é, atores, sistemas externos, contexto C4 nível 1.
- **`ArchitecturePrinciples.md`** — os 20 princípios arquiteturais e como aplicá-los.
- **`Glossary.md`** — vocabulário ubíquo (domínio + técnico).

### Decisão de tecnologia
- **`TechnologyEvaluation.md`** — avaliação crítica da stack proposta, riscos e recomendações.

### Domínios e fronteiras
- **`ModuleBoundaries.md`** — os bounded contexts, responsabilidades e invariantes.
- **`DependencyMap.md`** — dependências permitidas/proibidas entre módulos.

### Multi-tenancy e acesso
- **`MultiTenancy.md`** — modelo multi-tenant, isolamento, matriz de ameaças.
- **`Authorization.md`** — RBAC + permissões, papéis, segregação de funções.
- **`Entitlements.md`** — planos, limites, feature flags separados do domínio.

### Consistência transacional
- **`InventoryArchitecture.md`** — estoque como ledger, saldos, reservas, concorrência.
- **`FinancialArchitecture.md`** — recebíveis, parcelas, pagamentos, situações.
- **`SaleTransaction.md`** — a operação crítica "confirmar venda".

### Assíncrono e inteligência
- **`DomainEvents.md`** — eventos internos, outbox, idempotência.
- **`MessagingArchitecture.md`** — WhatsApp e canais (fronteiras futuras).
- **`InsightArchitecture.md`** — camada de interpretação determinística.
- **`DecisionCenterArchitecture.md`** — a Home inteligente.

### Integrações e dados
- **`ImportArchitecture.md`** — importação segura de dados.
- **`FiscalIntegration.md`** — fiscal por integração, adapter, isolamento.

### Operação e qualidade
- **`AuditArchitecture.md`** — auditoria de ações sensíveis.
- **`Observability.md`** — logs, métricas, tracing, alertas.
- **`Security.md`** — segurança de aplicação e defesa em profundidade.
- **`Privacy.md`** — LGPD, dados pessoais, retenção, portabilidade.
- **`TestingStrategy.md`** — pirâmide de testes e cenários obrigatórios.

### Engenharia e evolução
- **`RepositoryStrategy.md`** — app única vs. monorepo.
- **`DeploymentStrategy.md`** — ambientes, CI/CD, deploy.
- **`Scalability.md`** — evolução de 10 a 100.000 empresas.
- **`FailureModes.md`** — matriz de modos de falha.
- **`TechnicalRisks.md`** — riscos técnicos e mitigações.

### Decisões
- **`adr/`** — Architecture Decision Records numerados.

---

## 5. Convenções

- **Idioma:** português (BR). Termos técnicos consagrados mantidos em inglês.
- **Diagramas:** Mermaid embutido, sempre acompanhando (nunca substituindo) o texto.
- **Nomes de domínio:** em inglês, genéricos e agnósticos de segmento (nada exclusivo de "distribuidora").
- **Status de decisão:** cada decisão relevante tem um ADR correspondente em `adr/`.
- **Nível de detalhe:** responsabilidades e fronteiras primeiro; modelagem física de banco **não** faz parte desta fase.

---

## 6. O que esta fase NÃO faz

Conforme as regras da etapa: sem código, sem componentes, sem migrations, sem configurar Supabase, sem tabelas reais, sem autenticação/RLS implementados, sem inicializar projeto. Pseudocódigo aparece apenas quando indispensável para explicar uma decisão.

---

## 7. Próximo passo

Após aprovação desta arquitetura, a sequência será: modelagem detalhada do banco → criação do repositório → configuração da stack → autenticação → migrations → desenvolvimento. **Nada disso começa sem aprovação explícita.**
