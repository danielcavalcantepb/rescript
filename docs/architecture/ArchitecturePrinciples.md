# Rescript — Princípios de Arquitetura

> Os princípios técnicos que governam toda decisão de arquitetura e implementação.
> Derivam da estratégia (`CorePrinciples.md`, `TheTwentyCommandments.md`, `DataTrust.md`) e têm prioridade sobre conveniências de curto prazo.
> Status: Design de arquitetura (pré-implementação).

---

## 1. Os 20 Princípios Arquiteturais

### Estrutura e evolução
**AP1 — Monólito modular primeiro.** Uma única aplicação com fronteiras internas fortes. Serviços separados só quando houver motivo operacional/organizacional mensurável (ver `Scalability.md`).

**AP2 — Fronteiras claras entre domínios.** Cada bounded context tem responsabilidade única e explícita (`ModuleBoundaries.md`).

**AP3 — Baixo acoplamento.** Módulos se comunicam por contratos e eventos, nunca alcançando as entranhas uns dos outros.

**AP4 — Alta coesão.** O que muda junto vive junto. Um domínio concentra suas regras.

**AP5 — Não introduzir microserviços prematuramente.** Complexidade distribuída é dívida até que a escala a justifique (ADR-0002).

**AP6 — Não criar abstrações sem necessidade real.** Abstração especulativa é custo sem retorno. Regra prática: só abstraímos na terceira repetição.

**AP7 — Não construir infra para escala inexistente.** Dimensionar para o estágio atual + o próximo, não para 100.000 empresas no dia 1 (`Scalability.md`).

### Multi-tenancy e segurança
**AP8 — Multi-tenancy desde o primeiro dia.** Todo dado pertence a uma organização; o contexto de tenant acompanha toda operação (`MultiTenancy.md`).

**AP9 — Segurança por padrão.** O caminho fácil é o caminho seguro. Acesso é negado por omissão (default-deny).

**AP10 — RLS é obrigatória, mas não é a única defesa.** Row Level Security é a última linha; validação de tenant e autorização também ocorrem na camada de aplicação (defesa em profundidade).

**AP11 — Menor privilégio.** Todo acesso (usuário, função, integração, suporte) recebe o mínimo necessário.

### Integridade e consistência
**AP12 — Integridade garantida pelo banco.** Constraints, chaves, unicidade e checks vivem no PostgreSQL — não apenas na aplicação. O banco é a última garantia da verdade.

**AP13 — Operações críticas são transacionais e atômicas.** Confirmar venda, registrar pagamento, ajustar estoque: tudo ou nada (`SaleTransaction.md`).

**AP14 — Idempotência em ações sensíveis.** Cliques duplos, retries e webhooks repetidos nunca produzem efeito duplicado (`DomainEvents.md`).

**AP15 — Histórico auditável e imutável.** O que aconteceu não é reescrito silenciosamente; correções geram registros novos (`AuditArchitecture.md`).

**AP16 — Soft delete só onde faz sentido.** Nenhuma exclusão destrói histórico financeiro ou operacional. Entidades com histórico são inativadas, não apagadas.

**AP17 — Dados derivados não substituem a fonte.** Saldos, indicadores e projeções são deriváveis e reconstruíveis a partir dos registros originais (ledger, lançamentos). Cache/materialização é otimização, nunca a verdade.

### Inteligência
**AP18 — Insights apontam para dados rastreáveis.** Toda conclusão responde "por que o Rescript está dizendo isso?" com regra, registros, período e tipo (`InsightArchitecture.md`).

### Disciplina
**AP19 — Simplicidade externa pode exigir complexidade interna bem organizada.** Aceitamos sofisticação por dentro (ex.: transação de venda) para entregar simplicidade por fora — desde que encapsulada e testada.

**AP20 — Nunca tomar atalhos que comprometam consistência financeira ou de estoque.** Velocidade nunca justifica número errado. Este princípio vence todos os outros em caso de conflito.

---

## 2. Hierarquia de Princípios (desempate)

Quando princípios conflitam, esta é a ordem:

```
1. Consistência de estoque/financeiro (AP20, AP12, AP13)
2. Segurança e isolamento (AP8, AP9, AP10, AP11)
3. Auditabilidade (AP15, AP18)
4. Simplicidade / proporcionalidade (AP1, AP5, AP6, AP7, AP19)
5. Evolutibilidade (AP2, AP3, AP4)
```

> Exemplo de aplicação: um cache de saldo de estoque que acelera a tela (nível 4) jamais pode ser a fonte de verdade de uma baixa (nível 1). O ledger manda.

---

## 3. Diretrizes Práticas Derivadas

- **"Fronteiras rígidas, implantação flexível."** Divisões lógicas desde o início; divisão física só quando necessária.
- **O banco é um participante ativo da correção**, não um depósito burro: transações, constraints, funções seguras.
- **Assíncrono é para o que pode esperar**, nunca para o que garante a consistência de uma operação (`SaleTransaction.md` §limites).
- **Toda ação sensível é auditável e idempotente por design.**
- **Todo dado nasce com `organization_id`** e é filtrado por ele em todas as camadas.
- **Reconstruíbilidade:** se apagarmos todos os saldos e materializações, devemos conseguir recomputá-los a partir dos registros-fonte.

---

## 4. Anti-Padrões Proibidos

- Guardar saldo de estoque/financeiro **apenas** como um número mutável, sem ledger/lançamentos que o expliquem.
- Confiar somente na aplicação para isolamento de tenant (sem RLS).
- `DELETE` físico de vendas, movimentações ou lançamentos.
- Efeitos de uma operação crítica espalhados em jobs que "provavelmente vão rodar".
- Condicionais de plano (`if plano == 'pro'`) espalhadas pelo domínio (ver `Entitlements.md`).
- Abstração/generalização para requisitos que não existem.
- Microserviço criado por estética arquitetural.

---

## 5. Relação com ADRs

Cada princípio controverso ou custoso de reverter é ancorado em um ADR:
- AP1/AP5 → ADR-0002 (monólito modular)
- AP8/AP10 → ADR-0003 (multi-tenancy)
- AP12/AP13/AP17 → ADR-0005 (estoque como ledger), ADR-0006 (modelo financeiro), ADR-0007 (atomicidade da venda)
- AP14 → ADR-0008 (eventos), ADR-0009 (outbox)
- AP18 → ADR-0010 (insights)
