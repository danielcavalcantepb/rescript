# Registro de Problemas — Domain Walkthrough

> Severidade: crítico | alto | médio | baixo | melhoria.
> Bloqueia schema físico: sim só quando impede modelar constraints/chaves com segurança.

| ID | Título | Sev. | Cenário | Docs | Impacto | Recomendação | Decisão? | Bloqueia schema? |
|---|---|---|---|---|---|---|---|---|
| **WT-01** | H-02 negativo proibido vs RN-34 allow_with_alert | alto | 07,08,10 | BusinessRules, OpenQuestions, simulação | Default de policy e mensagens de falha divergem | Fechar OQ-08: manter RN-34 ou mudar default para block | Fundador | **Não** (coluna policy existe de qualquer forma) |
| **WT-02** | CancelSale após pagamento: orquestra estorno? | alto | 14 | StateMachines, TransactionalOperations | Risco financeiro / cancel incompleto | Opções: (A) Cancel bloqueia se paid até ReversePayment; (B) Cancel orquestra estorno total atômico | Fundador | **Sim** (API da OP-CancelSale) |
| **WT-03** | Estorno parcial no MVP | alto | 17 | PaymentsModel, MVP | Status `partially_reversed` no modelo vs escopo | MVP = só integral **ou** parcial desde já | Fundador | **Sim** (constraints de status) |
| **WT-04** | Devolução: estoque OK, financeiro subespecificado | alto | 21 | MVP, FD-01, Commands | Operação incompleta / responsabilidade ambígua | MVP: return stock + estorno manual **ou** OP-Return atômica | Fundador | **Sim** se Return for agregado; **Não** se só movement type |
| **WT-05** | Política default conflito de import (skip/update/ask) | médio | 23 | ImportModel | Reexecução imprevisível | Default skip + relatório; update opt-in | Fundador | Não |
| **WT-06** | Preço em Rascunho: freeze vs recalc | alto | 37 | PricingModel, SaleSnapshots | UX e totais inconsistentes | Recomendar freeze + ação sync | Fundador | Não (campo já existe) |
| **WT-07** | Pedido com reserva expirada: estado da Sale? | médio | 11 | StateMachines | Só OrçamentoExpirado nomeado | PedidoExpirado **ou** Pedido permanece sem reserva | Fundador | **Sim** se novo status |
| **WT-08** | Avg cost por local vs FD-01 “por variante” | médio | 18,03 | FD-01, OQ-09, CR-04 | Chave AverageCost | Fechar OQ-09 | Fundador | **Sim** (PK lógica) |
| **WT-09** | Money cents vs NUMERIC | médio | 15,38 | OQ-05, MoneyAndQuantity | Tipo físico | Fechar OQ-05 | Fundador | **Sim** |
| **WT-10** | Precisão por unidade | médio | 38 | OQ-01 | CHECK Quantity | Fechar OQ-01 defaults | Fundador | Parcial |
| **WT-11** | Ajuste com reserved > novo físico | médio | 20 | InventoryModel | Invariante faltando | Bloquear ajuste se físico < reserved | Domínio | Não |
| **WT-12** | Confirm direto do Draft sem Reservation row | baixo | 41 | StateMachines, Sale | Ambiguidade de implementação | Check available + exit; reservation opcional | Domínio | Não |
| **WT-13** | TransferOwnership two-phase vs atômico | médio | 40 | IdentityModel | Risco 0 owners | TX atômica se member já existe | Domínio | Não |
| **WT-14** | IdempotencyRecord sem request_hash | médio | 49 | EntityCatalog | Colisão perigosa | Exigir hash do payload | Domínio/DB | **Sim** (coluna) |
| **WT-15** | Avg cost quando físico=0 | baixo | 50 | FD-01 | Fórmula edge | Formalizar reset | Domínio | Não |
| **WT-16** | Arquivar variante com reserva ativa | médio | 46 | VariantModel | Compromisso órfão | Bloquear archive se reserved>0 | Domínio | Não |
| **WT-17** | Matriz suspensão read/export/invite | baixo | 27 | SubscriptionModel | UX billing | Tabela de capacidades | Domínio | Não |
| **WT-18** | Permissão `sales.return` / comando Return | médio | 21 | AuthorizationDataModel | Authz gap | Catalogar permissão | Domínio | Não |
| **WT-19** | Atributo imutável pós-movimento | baixo | 04 | BusinessRules | Inferido não numerado | Explicitar RN | Domínio | Não |
| **WT-20** | Pedidos órfãos após RemoveMember | baixo | 25 | Identity, Sale | Operação parada | Insight reassign | Melhoria | Não |
| **WT-21** | external_ref unique sem provider | baixo | 16 | PaymentsModel | Dup pay edge | Unique (org,source,ref) | DB | Não |
| **WT-22** | Momento freeze customer_snapshot | baixo | 36 | SaleSnapshots | Divergência leve | Freeze em Orçamento/Pedido | Domínio | Não |
| **WT-23** | Self-auth discount default | baixo | 39 | DiscountModel | Já recomendado false | Seed false | — | Não |
| **WT-24** | Entitlements que bloqueiam Confirm | baixo | 55 | EntitlementModel | Matriz incompleta | Catalogar features→ops | Domínio | Não |

## Resumo

| Severidade | Qtd |
|---|---|
| crítico | 0 |
| alto | 6 (WT-01…06) |
| médio | 10 |
| baixo | 7 |
| melhoria | 1 |

**Bloqueiam schema físico (recomendado fechar antes):** WT-02, WT-03, WT-04 (se Return agregado), WT-07 (se novo status), WT-08, WT-09, WT-14.
