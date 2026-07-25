# Users (membros)

## Objetivo
Convidar, listar, remover membros; ver papéis.

## Usuário
Owner/admin.

## Frequência
Baixa.

## Dados exibidos
Nome · email · role · status membership · último acesso.  
Convites pendentes: email · expira · reenviar.  
Prioridade: lista + convidar.

## Componentes
Header · “Convidar” · Table members · Table invites · Status Badge · Modal invite · Confirm remove · Empty

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Convidar | Invite | members.invite | não | email |
| Reenviar/cancelar convite | update invite | members.invite | não | — |
| Alterar papel | membership role | members.manage_roles | leve | authz muda |
| Remover | membership inactive | members.manage_roles | sim | perde acesso; Sales órfãs |
| Transferir propriedade | ver Ownership | owner | fluxo especial | Organization/Owner |

## Estados
Loading · Empty (só owner) · Error · No permission · Offline · Convite expirado

## Permissões
members.invite / manage_roles; transfer só owner

## Navegação
Settings · Onboarding opcional

## Eventos
InviteCreated · MemberJoined · MemberRemoved · OwnershipTransferred

## Regras
IdentityModel · ≥1 owner · walkthrough 02,25,40

## Casos extremos
Remover durante Sale · último owner · convite aceito após expire · self-remove owner bloqueado

## Design QA
- [ ] Convite simples
- [ ] Perigo remoção explícito
