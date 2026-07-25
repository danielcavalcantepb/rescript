# Rescript — Princípios de Inteligência

> Documento oficial das leis que governam a inteligência do produto.
> A inteligência do Rescript é **consequência da simplicidade**, nunca um recurso de marketing.
> Status: Estratégia (pré-arquitetura técnica).

---

## 0. A Tese Central

> **"O Rescript organiza a operação comercial e mostra ao dono o que precisa da atenção dele, antes que o problema aconteça."**

A obsessão principal continua sendo **SIMPLICIDADE**. Inteligência **não substitui** simplicidade — é o que a simplicidade produz quando a operação está bem organizada e os dados são confiáveis.

O Rescript **não** é um "ERP com IA". Não tem chatbot genérico, não tem "copiloto" de marketing. A inteligência **emerge da própria operação** e é entregue como **conclusões simples, confiáveis, acionáveis e contextualizadas**.

---

## 1. O que é (e o que não é) inteligência no Rescript

**É inteligência:**
- Transformar dados que a empresa já gera em **conclusões úteis** ("você pode ficar sem este produto em 6 dias").
- **Antecipar** riscos e oportunidades antes que virem problema.
- Apontar **a próxima ação mais importante** sem exigir análise.

**NÃO é inteligência (no Rescript):**
- Chatbot aberto que responde qualquer coisa.
- "Copiloto" genérico colado por cima do produto.
- Painel de BI cheio de gráficos que exige o usuário interpretar.
- IA generativa usada para "parecer moderno".

> Regra-mãe: **a inteligência entrega a conclusão, não o gráfico.** Se o usuário precisa analisar para entender, falhamos.

---

## 2. Os 10 Princípios da Inteligência (invioláveis)

### IP1 — Nunca inventar dados.
Toda conclusão vem de dados reais da operação. Se o dado não existe, a conclusão não existe.

### IP2 — Nunca concluir sem base rastreável.
Nenhuma afirmação sem origem verificável. Cada insight carrega o "de onde veio".

### IP3 — Sempre mostrar a origem.
O usuário sempre pode ver os números e registros que geraram a conclusão. Transparência total (responde: *"Por que o Rescript está dizendo isso?"*).

### IP4 — Diferenciar fato, projeção e recomendação.
- **Fato:** "R$ 8.420 vencem nos próximos 7 dias." (aconteceu / está registrado)
- **Projeção:** "Seu caixa projetado pode ficar negativo no dia 28." (estimativa explícita)
- **Recomendação:** "Considere repor este produto." (sugestão de ação)
O usuário nunca deve confundir o que é certo com o que é estimado.

### IP5 — Nunca usar linguagem alarmista.
Tom calmo, claro e adulto. Informamos, não assustamos. "Requer atenção", não "URGENTE!!!".

### IP6 — Nunca sobrecarregar com alertas.
Poucos insights certos valem mais que muitos ruidosos. Silêncio é uma funcionalidade.

### IP7 — Priorizar relevância, não quantidade.
O sistema mostra o que importa **agora**, ordenado por impacto — não tudo que poderia mostrar.

### IP8 — Não depender de modelos generativos no início.
A base é determinística: regras, cálculos, comparações e projeções auditáveis.

### IP9 — Preferir o explicável ao sofisticado.
Entre um método simples e auditável e um complexo e opaco, escolhemos o auditável — sempre que a diferença de valor não for decisiva.

### IP10 — IA generativa só quando simplificar de verdade.
Generativo entra apenas quando torna a compreensão mais simples (ex.: resumir em linguagem clara), nunca para decidir sozinho nem para "ter IA".

---

## 3. Hierarquia de Métodos (do simples ao avançado)

A inteligência evolui nesta ordem — **cada nível só entra quando o anterior é confiável**:

1. **Regras de negócio** (limites, condições): estoque ≤ mínimo, conta vencida.
2. **Cálculos e métricas**: ticket médio, margem, cobertura de estoque em dias.
3. **Comparações históricas**: "vendas caíram vs. média das últimas semanas".
4. **Tendências**: direção de vendas, margem, inadimplência.
5. **Projeções simples**: dias até ruptura, caixa projetado (extrapolação auditável).
6. **Detecção de anomalias**: desvio do padrão histórico (pedido parado além do normal).
7. **Alertas por limite**: gatilhos configuráveis com bom padrão.
8. **Recomendações explicáveis**: próxima ação sugerida, sempre com o "porquê".

> IA generativa fica **acima** dessa pilha e é opcional — nunca a fundação.

---

## 4. Anatomia de um Insight

Todo insight gerado pelo Rescript tem estrutura fixa (detalhe de exibição em `DecisionCenter.md`):

- **Título claro** — a conclusão em uma linha.
- **Explicação curta** — o contexto em uma frase.
- **Tipo** — fato / projeção / recomendação (IP4).
- **Impacto** — por que importa (em R$, dias, unidades quando possível).
- **Origem dos dados** — rastreabilidade (IP2, IP3).
- **Severidade** — informativo / atenção / crítico (sem alarmismo — IP5).
- **Confiança** — alta / média / baixa (ex.: baixa quando há pouco histórico).
- **Ação sugerida + link** — o caminho para resolver.
- **Dispensar** — quando aplicável, o usuário silencia.

---

## 5. Governança de Ruído (proteger a atenção do dono)

A atenção do dono é o recurso mais escasso. Regras para não desperdiçá-la:

- **Teto de relevância:** a Home prioriza os poucos insights que mais importam hoje; o resto fica acessível, não empurrado.
- **Sem repetição inútil:** um insight já visto/dispensado não reaparece sem mudança de contexto.
- **Agrupamento:** insights do mesmo tema são consolidados, não repetidos.
- **Aprendizado de utilidade:** medimos "% de insights considerados úteis" e "% dispensados" (ver `NorthStarMetric.md`) para calibrar e remover insights ruins.
- **Falso positivo é dívida:** todo insight declara seu risco de falso positivo (`InsightCatalog.md`); insights que erram muito são desativados.

---

## 6. Dependência da Confiança nos Dados

A inteligência **só pode existir sobre dados confiáveis**. Este é o elo com `DataTrust.md` e com o modelo de 3 camadas:

```
CAMADA 3 — INTERPRETAR   (inteligência: só é ligada quando 1 e 2 são confiáveis)
        ▲
CAMADA 2 — AUTOMATIZAR   (consequências corretas de cada operação)
        ▲
CAMADA 1 — REGISTRAR     (dados corretos e íntegros)
```

> **Regra de ouro:** o Rescript nunca interpreta o que não registra e automatiza com confiança. Uma conclusão errada destrói a credibilidade mais rápido do que dez conclusões certas a constroem.

---

## 7. Relação com a Simplicidade (o guarda-corpo)

Como a inteligência **não pode** trair a obsessão principal:

- Insight é **conclusão**, não relatório. Uma frase, não uma tela de análise.
- A Home mostra **poucos** insights relevantes, não um mural.
- Nenhum insight exige o usuário configurar antes de funcionar (bons padrões).
- A inteligência **reduz** trabalho de análise — nunca adiciona uma nova disciplina para o usuário aprender.
- Se um recurso de inteligência aumenta a carga cognitiva, ele viola a filosofia e é descartado.

---

## 8. Relação com os Demais Documentos

- **Como as conclusões são exibidas:** `DecisionCenter.md`.
- **Quais conclusões existem:** `InsightCatalog.md`.
- **A base de confiança:** `DataTrust.md`.
- **As leis gerais do produto:** `CorePrinciples.md`, `TheTwentyCommandments.md`.
- **A verdade estratégica por trás disso:** `WhyRescript.md`.

> A inteligência do Rescript é medida por uma coisa: **o dono agiu sobre uma conclusão e evitou um problema (ou capturou uma oportunidade) sem ter que analisar nada.** Esse é o produto.
