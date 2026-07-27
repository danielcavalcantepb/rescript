---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: ProductPolish
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Product Polish — Entrega

Sprint de refinamento visual e de informação. **Sem novas funcionalidades de negócio.**

---

## 1. Melhorias aplicadas

1. Logo oficial (PNG/SVG) em sidebar, login, onboarding, loading, favicon, 404, command palette — sem wordmark tipográfico reconstruído  
2. Sidebar densificada: ícones 14px, wordmark oficial, modo recolhido com mark  
3. Topbar com maior presença: busca ampliada, sticky, bordas suaves  
4. Central reordenada: Resumo → KPIs → Prioritários → Adicionais → Lacunas  
5. Card “Hoje” compacto (valor + delta + chips)  
6. KPIs em grade 4 / 2×2 / 1 col, altura reduzida  
7. Insights em lista inteligente (não cards enormes)  
8. Paginação progressiva (“Mostrar mais” / “Ver menos”)  
9. Agrupamento por categoria com accordion  
10. Detalhes do insight sob demanda (“Por quê?”)  
11. Bordas soft, sombra quase invisível, tipografia com mais contraste  
12. Densidade aplicada a tabelas, page headers, empty states, inputs  
13. Marca discreta (três barras) no pulso do dia  

---

## 2. Antes → Depois

| Aspecto | Antes | Depois |
|---|---|---|
| Logo | Texto “RESCRIPT” + mark SVG | PNG oficial / mark oficial |
| Central | Hoje → atenção (cards altos) → … → KPIs no fim | Resumo → KPIs logo abaixo → lista |
| Insight | Card ~180–220px com tudo aberto | Linha ~52–64px; detalhes sob demanda |
| KPIs | 2×2 abaixo da dobra | 4 col no primeiro viewport |
| Escala | 20 cards empilháveis | 6 + “Mostrar mais” + grupos |
| Sidebar | 240px, ícones 16px, texto marca | 224px / 64px colapsada, logo oficial |
| Bordas | `#E4E8EE` mais presentes | `#F0F2F5` soft |
| Sombra | 8/24 @ 8% | 4/16 @ 6% |

---

## 3. Por que cada melhoria

| Mudança | Motivo |
|---|---|
| KPIs cedo | Saúde da empresa não pode depender de scroll |
| Lista vs cards | Escala com dezenas de insights |
| “Mostrar mais” | Usuário controla profundidade |
| Grupos | Scan por domínio (Estoque/Financeiro…) |
| Logo oficial | Reconhecimento imediato da marca |
| Densidade | Mais sinal útil por viewport, sem ruído |

---

## 4. Ganhos de UX

- Estado da operação legível sem scroll longo  
- Ação (CTA) acessível em cada insight sem abrir painel  
- Menos fadiga visual; hierarquia Heading → Body → Caption clara  
- Navegação mais ergonômica (sidebar colapsável, topbar sticky)  

---

## 5. Ganhos de performance visual

- Menos nós DOM pesados no primeiro paint da Central (6 rows vs N cards)  
- Menos altura → menos paint/compositing em scroll  
- Sombras/bordas mais leves → superfície mais “calma”  

---

## 6. Componentes redesenhados

`RescriptLogo` · `TodayPulse` · `MetricCard` · `InsightCard` · `InsightList` · `InsightAllClear` · `Sidebar` · `Topbar` · `AppLayout` · `PageHeader` · `SectionHeader` · `EntityTable` · `EmptyState` · `SearchBar` · `CommandPalette` · `GlobalLoading` · `Input`

---

## 7. Economia vertical na Central

Estimativa com o mock atual (~11 insights):

| Bloco | Antes (approx.) | Depois (approx.) |
|---|---|---|
| Header + Hoje | 200px | 110px |
| Insights (todos expandidos em cards) | ~1.540px (7×220) | ~340px (6×56) |
| KPIs | 280px (abaixo) | 90px (acima) |
| Oportunidades / extras / lacunas | ~500px | ~180px (grupos colapsados + gaps) |
| **Total útil** | **~2.520px** | **~720px** |

**Economia estimada: ~1.800px verticais** no primeiro carregamento (antes de “Mostrar mais”).  
Com “Mostrar mais” até o fim, a Central permanece ~40–50% mais baixa que a versão de cards completos.
