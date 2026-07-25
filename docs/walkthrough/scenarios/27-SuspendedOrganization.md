# Cenário 27 — Organização Suspensa

## Cenário

Assinatura suspensa; org em modo restrito; tentativas de vender vs leitura/exportação do owner.

### Objetivo
Separar RBAC, entitlement e suspensão comercial.

### Atores
Owner; Vendedor; Billing system

### Estado inicial
Org ativa → Subscription status past_due/suspended; Organization.operational_status=suspended.

### Pré-condições
Webhook/billing marca suspensão.

### Passos executados

#### 1. Vendedor tenta ConfirmSale
1. **Comando:** ConfirmSale
2. **Autorização:** RBAC pode passar; **entitlement/suspensão bloqueia escrita operacional**
3. **Validações:** org.operational_status ∈ active
13. Erro org_suspended
5–6. Sem efeitos

#### 2. Owner leitura / export
1. **Comando:** ListSales / Export
2. **Autorização:** owner + política de retenção
3. Leitura permitida (recomendação); escrita bloqueada
12. Insight “regularize assinatura”

#### 3. Diferenciação
| Camada | Efeito |
|---|---|
| RBAC | quem pode o quê dentro da org |
| Entitlement | módulos/limites do plano |
| Suspensão | override que congela mutações operacionais |

### Estado final esperado
Dados preservados; mutações core bloqueadas; billing path aberto.

### Invariantes verificadas
Tenant intacto; sem apagar dados na suspensão.

### Inconsistências encontradas
- Matriz exata read vs export vs invite na suspensão pouco detalhada em SubscriptionModel.
- Soft-lock de reservas ativas durante suspensão: TTL continua?

### Ajustes recomendados
Tabela de capacidades por operational_status; job de expire reservas continua (protege fornecedores/clientes internos).

### Classificação
**aprovado com ressalvas**
