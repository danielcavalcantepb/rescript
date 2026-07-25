# RolesPermissions (tela)

> Matriz global: `Permissions.md`. Esta é a **UI** de papéis.

## Objetivo
Ver papéis do sistema e permissões; (MVP) atribuir papéis prontos — custom roles = futuro.

## Usuário
Owner/admin.

## Frequência
Muito baixa.

## Dados exibidos
Lista roles (Owner, Admin, Operador…) · permissões efetivas read-only matrix · nota “custom futuro”.  
Prioridade: clareza do que Operador pode fazer.

## Componentes
Header · Role cards/select · Permissions matrix read-only · Link “Gerenciar membros” · Alert

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Ver | — | members.manage_roles | — | — |
| Editar matrix | **fora MVP** se custom off | — | — | — |

## Estados
Loading · No permission · Offline · Empty N/A

## Permissões
members.manage_roles

## Navegação
Settings · Users

## Eventos
nenhum no MVP read-only

## Regras
AuthorizationDataModel · FD-05 permissions not role names in checks · custom FUT

## Casos extremos
Usuário tenta self-elevate → impossível

## Design QA
- [ ] Não parecer ACL enterprise
- [ ] Linguagem humana nas permissões
