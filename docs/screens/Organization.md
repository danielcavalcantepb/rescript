# Organization

## Objetivo
Dados da empresa; políticas essenciais (desconto %, TTL reserva, estoque negativo policy).

## Usuário
Owner/admin.

## Frequência
Baixa.

## Dados exibidos
Nome fantasia · razão · doc · timezone · moeda BRL (read-only MVP) · policies: max desconto sem auth · TTL reserva · allow negative stock (RN-34) · venda sem cliente.  
Prioridade: nome + 3 policies. Resto advanced.

## Componentes
Header · Form · Policy fields · Helpers · Save · Alert RN-92 (afeta futuro)

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Salvar | Organization + OrganizationPolicy | org.settings | não | toast; reservas antigas mantêm TTL |

## Estados
Loading · Error · No permission · Offline · Suspensa banner

## Permissões
org.settings

## Navegação
Settings · Onboarding (subset)

## Eventos
OrganizationUpdated · PolicyUpdated · Audit

## Regras
FD-05/07 · OQs defaults · RN-90/92 · SettingsModel

## Casos extremos
Mudar TTL não reescreve reservas · mudar negative policy mid-flight

## Design QA
- [ ] Policies com linguagem humana
- [ ] Sem 50 toggles
