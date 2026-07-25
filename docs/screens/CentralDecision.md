# Central de Decisão

## Objetivo
Responder em segundos: como está a empresa, o que mudou, o que exige atenção, o que vem, oportunidades, o que fazer agora — **sem** ser BI.

## Usuário
Owner (diário); operadores (início do turno).

## Frequência
Várias vezes/dia — default pós-login.

## Dados exibidos

| Bloco | Conteúdo | Por quê | Prioridade |
|---|---|---|---|
| Saudação + contexto org | nome user, org | ancoragem | P1 |
| **Hoje** | vendas R$, # vendas, pedidos abertos, delta textual vs ontem | pulso | P1 |
| **Requer atenção** | 3–5 Insight Cards ordenados por impacto | ação | **P0** |
| **Próximos dias** | a vencer, reservas TTL, rupturas projetadas | antecipação | P1 |
| **Oportunidades** | reativar cliente, produto em alta | equilíbrio | P2 |
| **Visão geral** | mês, ticket, margem, saldo | apoio | P3 |
| **Tudo sob controle** | quando atenção vazia + dados ok | calma | situacional |
| **Lacunas / dados insuficientes** | falta histórico/custo | honestidade DataTrust | situacional |

**Não exibir:** gráficos pizza, 12 KPIs, feed social, builder.

### Como explicar cada insight
Insight Card: título (conclusão) · explicação · tipo Fato/Projeção/Recomendação · impacto · origem · confiança · CTA · Dispensar. Sempre responde “por quê?”.

### Como evitar ruído
Teto 3–5; fingerprint dedup; severidade; dismiss/cooldown; não repetir resolvidos.

### Como esconder complexidade
Origem em disclosure; fórmulas fora; jobs invisíveis; sem jargão.

### Quando “Tudo sob controle”
Zero itens em Requer atenção (após curadoria) e org ativa com dados mínimos.

### Quando “Dados insuficientes”
Regras que exigiriam inventar (produto novo / sem série) — bloco Lacunas, não falso risco.

## Marca
- Logo oficial na sidebar / palette (não reconstruir em texto)
- Primary sólido em CTAs; sem degradê
- Insight = linha compacta; “Por quê?” sob demanda
- Três barras discretas no pulso “Hoje”
- “Tudo sob controle” = estado quieto
- Loading: BrandLoader

## Arquitetura (Product Polish)
1. Resumo executivo (Hoje)  
2. Visão geral / KPIs (sempre visível)  
3. Insights prioritários (máx. 6 + Mostrar mais)  
4. Insights adicionais (grupos por categoria)  
5. Dados insuficientes  

## Componentes
- App shell (Sidebar logo oficial, Topbar, Command Palette)
- TodayPulse
- MetricCard (grade responsiva)
- InsightList / InsightCard (compacto)
- Section headers
- Empty / BrandLoader
- Badge contagem “Ver todos”

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| CTA insight | navega fluxo operacional | conforme destino | não | possível resolve |
| Dispensar | status dismissed + feedback opcional | insights.view | não | some da lista |
| Ver todos | Insights.md | insights.view | não | lista |
| Atalho Nova venda | SaleWizard | sales.create | não | — |
| Refresh implícito | reconsulta derivados | — | não | — |

## Estados
| Estado | UI |
|---|---|
| Loading | skeleton Hoje + 3 cards |
| Empty primeiro acesso | checklist resumido + CTA onboarding |
| Error | alert + retry |
| No permission | raro (mínimo insights.view) |
| Partial data | blocos que falharam isolados |
| Offline | banner |
| Sem histórico | lacunas |
| Tudo sob controle | mensagem calma + pulso |
| Dados insuficientes | bloco lacunas |
| Org suspensa | banner + CTAs escrita disabled |

## Permissões
Ver: `insights.view` (+ membership). CTAs respeitam permissão do destino.

## Navegação
Chega: login, logo, ⌘K “Central”. Sai: CTAs, sidebar. Back: N/A (root).

## Eventos
Consome projeções/insights (jobs). Não produz domínio crítico ao só visualizar. Dismiss → InsightDismissed.

## Regras
`docs/DecisionCenter.md`, IntelligencePrinciples, DataTrust, InsightCatalog, InsightModel, DecisionCenterData. IP6/IP7 curadoria.

## Casos extremos
1000 insights → só top N. Insight expirado → não listar. Tudo vermelho → ainda teto 5 + “Ver todos”. Org nova → empty útil. Permissão removida mid-session → CTA some no próximo fetch.

## Design QA
- [ ] Não parece dashboard BI
- [ ] Atenção acima de Visão geral
- [ ] Pouca leitura
- [ ] A11y headings
- [ ] Parece Rescript (calma / precisão / organização)?
- [ ] Sem degradê; primary só em CTA
- [ ] Sem excesso de cor / bordas / sombras
- [ ] Feedback dismiss
- [ ] Mobile: atenção primeiro
