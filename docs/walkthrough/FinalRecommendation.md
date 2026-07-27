---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / FinalRecommendation
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Recomendação Final — Domain Walkthrough

## 1. Veredito

O domínio, a arquitetura e o modelo lógico **suportam a operação do MVP** nos fluxos críticos (onboarding, catálogo, reserva, confirmação atômica, pagamentos básicos, insights, tenancy, outbox).

**Não está bloqueado** por inconsistência estrutural.

**Não recomenda-se** iniciar schema físico **sem** fechar as decisões listadas na seção 3 (especialmente dinheiro, custo médio, cancelamento pago e estorno).

---

## 2. Números desta fase

| Métrica | Valor |
|---|---|
| Cenários simulados | 55 |
| Aprovados | 21 |
| Aprovados com ressalvas | 29 |
| Bloqueados | 0 |
| Decisão do fundador necessária | 5 (cenários 14, 17, 21, 23, 37) |
| Issues registrados | 24 |
| Issues alto | 6 |
| Issues crítico | 0 |
| Issues que bloqueiam schema (recomendado) | WT-02, WT-03, WT-04*, WT-07*, WT-08, WT-09, WT-14 |

\* Condicional ao desenho escolhido.

---

## 3. Fechar antes do schema físico (mínimo)

1. **OQ-05 / Money** — tipo de armazenamento  
2. **OQ-09 / Avg cost key** — com ou sem location  
3. **OQ-01** — defaults de precisão (podem ser seeds)  
4. **FQ-01** — Cancel após pagamento  
5. **FQ-02** — Estorno parcial sim/não no MVP  
6. **FQ-03** — Devolução financeira  
7. **WT-14** — `request_hash` em IdempotencyRecord  
8. **OQ-08** — ratificar RN-34 vs default block  

Desejável mas não estritamente bloqueante: FQ-04, FQ-05, FQ-06, OQ-02/03/04/10.

---

## 4. Mudanças recomendadas na documentação existente

| Doc | Ajuste |
|---|---|
| `StateMachines` / `TransactionalOperations` | Formalizar CancelSale vs ReversePayment (FQ-01) |
| `Commands` / `UseCases` | Devolução estoque vs financeiro |
| `PricingModel` / `SaleSnapshots` | Política preço em Rascunho |
| `ImportModel` | Default skip on conflict |
| `IdentityModel` | TransferOwnership atômico |
| `PaymentsModel` | Se FQ-02=A, marcar partially_reversed como V1 |
| `FD-01` nota | Esclarecer escopo local quando OQ-09 fechar |
| `BusinessRules` | RN explícita: não alterar combination_hash após movimento |
| `EntityCatalog` | IdempotencyRecord.request_hash |
| `AuthorizationDataModel` | permissão de devolução/ajuste |

**Não alterar** FounderDecisions sem novo voto formal.

---

## 5. Pronto para schema físico?

| Pergunta | Resposta |
|---|---|
| Remodelagem de agregados necessária? | **Não** |
| Schema físico agora? | **Aguardar** fechamento da seção 3 |
| Próximo passo após aprovação + FQs | Physical schema PostgreSQL + constraints + RLS draft + funções TX — ainda docs/SQL design, conforme processo do fundador |

---

## 6. O que esta fase deliberadamente não fez

- SQL / migrations / Supabase  
- Escolha de provedores  
- Transformar hipóteses H-* em decisões  
- Implementação TypeScript  

Aguardando **aprovação formal** do fundador sobre este walkthrough e respostas às FQs/OQs.
