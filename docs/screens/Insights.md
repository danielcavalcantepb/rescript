---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / Insights
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Insights (lista completa)

## Objetivo
Ver todos os insights além do teto da Central; filtrar; dispensar; abrir origem.

## Usuário
Owner; operadores com insights.view.

## Frequência
Média (Central cobre o dia a dia).

## Dados exibidos
Lista Insight Cards: título · severidade · tipo · domínio · status · validade.  
Filtros: ativos · dispensados · por domínio.  
Prioridade: ativos por impacto.

## Componentes
Header · Filters · Insight Card list · Empty (tudo sob controle / nenhum) · Disclosure “por quê” · Buttons CTA/Dispensar · Feedback falso positivo

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| CTA | navega origem | destino | não | possível resolve |
| Dispensar | dismissed | insights.view | não | some ativos |
| Marcar falso positivo | feedback+cooldown | insights.view | não | — |

## Estados
Loading · Empty controle · Empty filtros · Error · No permission · Offline · Insight expirado (histórico) · Dados insuficientes (categoria lacuna)

## Permissões
insights.view

## Navegação
Central “Ver todos” · Sidebar opcional (ou só via Central) · deep `/insights/:id`

## Eventos
InsightRaised (job) · InsightDismissed

## Regras
InsightModel · InsightCatalog · DataTrust · sem IA generativa

## Casos extremos
Spam fingerprints · regra reabre após cooldown · org nova

## Design QA
- [ ] Não virar mural de alertas
- [ ] Explicação sempre acessível
- [ ] Parece Rescript? Insights quietos, sem glow?
