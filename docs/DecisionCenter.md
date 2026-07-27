---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: DecisionCenter
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Central de Decisão (Home Inteligente)

> Documento oficial da experiência da página inicial como central de decisão.
> A Home não é um painel de gráficos — é onde o dono descobre, em segundos, o que precisa da atenção dele.
> Status: Estratégia (pré-arquitetura técnica). Descreve intenção de experiência, não implementação nem telas.

---

## 0. Princípio Fundador da Home

> A página inicial do Rescript é uma **central de decisão**, não um dashboard de indicadores.

Um dashboard tradicional mostra números e transfere ao usuário o trabalho de interpretar. A Central de Decisão faz o oposto: **interpreta e entrega conclusões e próximas ações**. O dono não deveria precisar montar relatório para entender a própria empresa.

Isso materializa a tese central e respeita a obsessão por simplicidade: **conclusão, não gráfico** (ver `IntelligencePrinciples.md`).

---

## 1. As 5 Perguntas que a Home Responde

Em poucos segundos, sem cliques, a Home responde:

1. **Como minha empresa está?** — a saúde geral, em uma leitura.
2. **O que mudou?** — o que é diferente desde a última vez.
3. **O que exige minha atenção?** — os poucos pontos que importam agora.
4. **O que pode acontecer em breve?** — riscos e eventos projetados.
5. **Qual é a próxima ação mais importante?** — o que fazer primeiro.

Se a Home não responder essas cinco em segundos, ela falhou.

---

## 2. Organização da Experiência (categorias)

A Central de Decisão organiza o conteúdo em blocos com propósito claro — **não em um mural de cards soltos**:

### 2.1. Hoje
O pulso do dia: vendas de hoje, entradas/saídas do dia, o que já aconteceu. Responde "como estou agora".

### 2.2. Requer atenção
Os poucos pontos que pedem ação — ordenados por impacto. Ruptura iminente, contas vencidas, pedidos parados, cliente em atraso. Responde "o que exige minha atenção" e "qual a próxima ação".
> Aqui vale a regra de ouro do ruído: **poucos itens, os certos** (IP6, IP7).

### 2.3. Próximos dias
O que vem: recebimentos a vencer, projeção de caixa, produtos que vão acabar, reposições atrasadas. Responde "o que pode acontecer em breve".

### 2.4. Oportunidades
O lado positivo: produtos em alta, clientes para reativar, concentração de lucro que vale reforçar. A inteligência não é só sobre risco.

### 2.5. Visão geral
O resumo consolidado (vendas do mês, margem, saldo, ticket médio) — presente, mas **subordinado** aos blocos de decisão. Números para quem quiser aprofundar, não a estrela da tela.

> Ordem intencional: a Home prioriza **ação** (Requer atenção, Próximos dias) acima de **contemplação** (Visão geral).

---

## 3. Anatomia de um Card de Decisão

Cada alerta ou conclusão exibido segue estrutura fixa (alinhada a `IntelligencePrinciples.md` §4):

| Elemento | Função | Exemplo |
|---|---|---|
| **Título claro** | A conclusão em uma linha | "Você pode ficar sem Café 500g em 6 dias" |
| **Explicação curta** | Contexto em uma frase | "No ritmo de venda das últimas 2 semanas" |
| **Tipo** | Fato / Projeção / Recomendação | Projeção |
| **Impacto** | Por que importa | "Produto entre os 5 que mais vendem" |
| **Origem dos dados** | Rastreabilidade (DataTrust) | "Baseado em 34 vendas e no saldo atual" |
| **Confiança** | Alta/Média/Baixa + motivo | Alta |
| **Ação sugerida + link** | Caminho para resolver | "Repor estoque →" |
| **Dispensar** | Silenciar quando aplicável | "Dispensar" |

> Todo card responde, por construção, à pergunta *"Por que o Rescript está dizendo isso?"* (ver `DataTrust.md`).

---

## 4. Regras de Curadoria (proteger a atenção)

A Central de Decisão é curada, não despejada:

1. **Teto de itens visíveis.** "Requer atenção" mostra os poucos mais importantes; o resto fica a um clique, não empurrado.
2. **Ordenação por impacto**, não por ordem cronológica ou aleatória.
3. **Consolidação.** Vários itens do mesmo tipo viram um resumo ("3 pedidos parados"), não N cards.
4. **Sem repetição.** Item dispensado/resolvido não reaparece sem mudança de contexto.
5. **Silêncio é válido.** Em um bom dia, "Requer atenção" pode estar vazio — e isso é uma mensagem positiva, não uma tela quebrada.
6. **Estado vazio que tranquiliza.** "Está tudo sob controle hoje." em vez de espaço vazio.

---

## 5. A Home por Persona

- **Ricardo (dono):** entra, lê "Requer atenção" e "Próximos dias", age. Sai em 1 minuto sabendo que está no controle. **É o usuário-alvo da Home.**
- **Aline (operadora):** a Home dela pode enfatizar a operação do dia (vendas, pendências operacionais), respeitando permissões.
- **Fernanda (gestora):** usa "Visão geral" e oportunidades para decisões de crescimento.

> Personalização por papel é bem-vinda **desde que não adicione configuração** — bons padrões por papel (Mandamento X).

---

## 6. Relação com a Simplicidade (guarda-corpo)

A Central de Decisão poderia facilmente virar um painel de BI complexo. Isso é proibido:

- **Conclusões, não gráficos.** Gráfico só quando ele **é** a forma mais simples de entender.
- **Poucos blocos, propósito claro.** Nada de dezenas de widgets configuráveis.
- **Linguagem humana.** "Seu caixa pode ficar negativo dia 28", não "Fluxo de caixa projetado D+X".
- **Nenhuma exigência de setup.** A Home entrega valor desde a primeira operação (e com dados de demo no onboarding).

---

## 7. Ligação com Ativação e Retenção

- **Ativação:** a primeira conclusão útil na Home faz parte do momento "aha" (ver `Activation.md`).
- **Retenção:** a Home é o motivo de o dono **voltar todo dia** — ela recompensa a visita com clareza. É o principal motor de hábito (ver `Retention.md` e `NorthStarMetric.md`).
- **Métrica de valor percebido:** "empresas que visualizaram e agiram sobre ≥1 conclusão relevante na semana" (ver `NorthStarMetric.md`).

---

## 8. Relação com os Demais Documentos

- **As leis da inteligência:** `IntelligencePrinciples.md`.
- **Os insights que preenchem a Home:** `InsightCatalog.md`.
- **A confiança que autoriza as conclusões:** `DataTrust.md`.
- **A navegação onde a Home vive:** `Navigation.md`.

> A Central de Decisão é a materialização visível da tese: o lugar onde a operação organizada vira atenção bem direcionada.
