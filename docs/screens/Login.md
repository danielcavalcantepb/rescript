# Login

## Objetivo
Autenticar o usuário e encaminhar à org ativa / onboarding.

## Usuário
Qualquer pessoa com conta.

## Frequência
Baixa (sessão persistente); picos no início do dia.

## Dados exibidos
Email · senha (ou magic link se provedor permitir) · erro de auth · link “esqueci senha” · criar conta.  
**Prioridade:** formulário mínimo. Sem marketing denso.

## Marca
- Wordmark oficial (`rescript-wordmark.png`) com degradê institucional permitido
- Fundo `canvas`; card `surface` com borda leve
- Sem marketing denso; tipografia Geist
- Loading: BrandLoader ou botão loading quieto

## Componentes
- Page centered (auth layout, sem sidebar)
- RescriptLogo (wordmark oficial)
- Input email / password
- Button primary
- Link secundário
- Alert erro
- Loading button

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Entrar | Cria sessão | pública | não | Central ou Onboarding ou seletor de org |
| Criar conta | Novo user | pública | não | Onboarding |
| Esqueci senha | Reset flow | pública | não | email |

## Estados
Loading · Error (credencial) · Empty N/A · No permission N/A · Offline · Primeiro acesso (criar conta)

## Permissões
Pública autenticável.

## Navegação
Deep link pós-login preserva `?next=`. Logout → Login.

## Eventos
Consumidos: nenhum de domínio. Produzidos: audit login (plataforma).

## Regras
Sessão gerenciada pelo provedor auth (Supabase futuro). Multi-org: se >1 membership, escolher org antes da Central.

## Casos extremos
Conta sem org → Onboarding. Org suspensa → Central read-only. Rate limit auth → mensagem calma.

## Design QA
- [ ] Poucos campos
- [ ] Erro acionável
- [ ] Sem cara de ERP
- [ ] A11y labels
- [ ] Wordmark oficial presente; degradê só institucional
- [ ] Parece Rescript (calma / precisão)?
- [ ] Feedback loading
