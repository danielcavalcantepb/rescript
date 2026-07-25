# Subscription

## Objetivo
Ver plano, status, limites/entitlements; regularizar se suspensa; não espalhar nomes Free/Pro no domínio (labels comerciais ok na UI).

## Usuário
Owner.

## Frequência
Baixa; alta se suspensa.

## Dados exibidos
Plano label · status (trial, active, past_due, suspended) · renovação · limites (users, etc.) · CTA billing portal futuro.  
Prioridade: status + o que está bloqueado.

## Componentes
Header · Status Badge · Metric limits · Alert suspensa · Button “Atualizar pagamento” · Empty N/A

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Ir a billing | externo/portal | owner | não | — |
| Ver limites | — | owner | — | — |

## Estados
Loading · Error · Active · Trial · Suspended (destaque) · Offline · No permission (não-owner)

## Permissões
owner / org.settings

## Navegação
Settings · banner global suspensa · entitlement deny na Sale

## Eventos
SubscriptionUpdated (billing webhooks futuros)

## Regras
SubscriptionModel · EntitlementModel · walkthrough 27,55 · features sem hardcode domínio

## Casos extremos
Webhook dup · trial acaba mid-confirm → deny no commit

## Design QA
- [ ] Clareza do bloqueio
- [ ] Sem medo desnecessário se só past_due leve
