---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / Onboarding
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Onboarding

## Objetivo
Levar o owner do zero ao **aha** (primeira venda ou pulso útil) com fricção mínima.

## Usuário
Owner recém-criado; às vezes admin convidado cedo.

## Frequência
Uma vez por org (revisitável se checklist incompleto).

## Dados exibidos
1. Nome da empresa  
2. Checklist: Cliente · Produto · Estoque inicial · Venda  
3. Progresso  
4. Atalhos importar vs manual  

Prioridade: checklist > configuração avançada (escondida).

## Marca
- Wordmark oficial no topo (degradê institucional permitido)
- Checklist com mark de 3 barras como indicador de passo concluído (opcional)
- Copy de especialista — sem “Parabéns!” / “Incrível!”
- Primary sólido nos CTAs

## Componentes
- RescriptLogo
- Header “Bem-vindo”
- Checklist com Status Badge
- Buttons CTAs
- Optional Import entry card
- Empty-friendly illustrations none/minimal (geometria das 3 barras se houver)
- Skip secundário (não esconder dívida do checklist na Central)

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Salvar empresa | Cria Organization, membership owner, StockLocation padrão, policies seed | authenticated | não | checklist |
| Ir a criar cliente/produto… | navega | respectivas | não | volta checklist |
| Importar | ImportWizard | imports.run | não | checklist update |
| Concluir / Ir à Central | marca onboarding dismissed | owner | não | Central |

## Estados
Loading · Empty (checklist 0) · Error save · Partial data · Primeiro acesso · Offline

## Permissões
Criar org: usuário autenticado. Demais: owner.

## Navegação
Login → Onboarding → Central. Bloquear módulos? Preferir permitir com nag na Central (“Complete o básico”).

## Eventos
OrganizationCreated · MembershipCreated · (seeds) · OnboardingCompleted

## Regras
docs: Identity, TenantOwnership, MVP onboarding. Local padrão + BRL automáticos. FD-07 BRL.

## Casos extremos
Abandona no meio → retoma checklist. Import falha → manual. Já tem dados importados → itens check auto.

## Design QA
- [ ] ≤10 cliques até aha possível
- [ ] Zero fiscal/config densa
- [ ] Consistente Quiet Instrument
- [ ] Feedback progresso
- [ ] Wordmark oficial; copy sem “Parabéns!”
- [ ] Parece Rescript?
