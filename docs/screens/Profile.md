# Profile

## Objetivo
Dados do usuário autenticado; preferências leves; logout; trocar org.

## Usuário
Todos.

## Frequência
Baixa.

## Dados exibidos
Nome · email · avatar · orgs membership · preferência locale (pt-BR fixo MVP).  
Prioridade: identidade + logout.

## Componentes
Header · Form nome · Org list switch · Button logout · Alert

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Salvar perfil | User profile | self | não | toast |
| Trocar org | context switch | membership | não | Central |
| Sair | encerra sessão | self | não | Login |

## Estados
Loading · Error · Offline

## Permissões
self-service

## Navegação
Avatar menu · Settings

## Eventos
UserUpdated · (audit logout)

## Regras
IdentityModel; multi-org

## Casos extremos
Removido da org ativa → forçar switch/logout

## Design QA
- [ ] Simples
- [ ] Switch org claro
