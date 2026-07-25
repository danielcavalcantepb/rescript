# Rescript — Catálogo de Insights

> Documento oficial do catálogo de conclusões (insights) que o Rescript pode gerar.
> Cada insight segue uma ficha padrão e obedece aos `IntelligencePrinciples.md` e à `DataTrust.md`.
> Status: Estratégia (pré-arquitetura técnica). Este é um catálogo de intenção, não especificação de implementação.

---

## 0. Como Ler Este Catálogo

Cada insight tem uma **ficha padrão**:

- **Objetivo** — o que ele protege ou revela.
- **Dados necessários** — de onde vem.
- **Regra / cálculo** — a lógica (determinística e auditável).
- **Condição mínima** — quando ele é confiável o suficiente para aparecer.
- **Severidade** — informativo / atenção / crítico (sem alarmismo — IP5).
- **Tipo** — fato / projeção / recomendação (IP4).
- **Mensagem exibida** — a conclusão em linguagem humana.
- **Ação sugerida** — o próximo passo.
- **Risco de falso positivo** — baixo / médio / alto.
- **Como explicar** — a resposta a "por que o Rescript está dizendo isso?".
- **Versão** — MVP / V1 / V2 / Futura.

**Legenda de severidade:** 🟢 informativo · 🟡 atenção · 🔴 crítico.

> Regra transversal: nenhum insight aparece se as Camadas 1 e 2 (registrar/automatizar) do seu domínio não forem confiáveis (`DataTrust.md`). Insight sem dado suficiente = não exibir (DT11).

---

## 1. Domínio: ESTOQUE

### 1.1. Risco de ruptura (dias até acabar)
- **Objetivo:** evitar perder venda por falta de produto.
- **Dados necessários:** saldo atual, histórico de saídas do produto.
- **Regra/cálculo:** dias de cobertura = saldo atual ÷ média de venda diária (janela recente); dispara se cobertura ≤ limite (ex.: 7 dias).
- **Condição mínima:** produto com histórico mínimo de vendas (ex.: ≥ 2 semanas de movimentação).
- **Severidade:** 🟡/🔴 (cresce conforme os dias diminuem).
- **Tipo:** Projeção.
- **Mensagem:** "Você pode ficar sem [produto] em 6 dias."
- **Ação sugerida:** repor estoque / registrar compra (V2).
- **Risco de falso positivo:** médio (picos atípicos de venda distorcem a média).
- **Como explicar:** "Baseado no saldo atual (X) e na média de Y/dia das últimas semanas."
- **Versão:** MVP.

### 1.2. Estoque baixo (abaixo do mínimo)
- **Objetivo:** manter reposição em dia.
- **Dados necessários:** saldo atual, estoque mínimo do produto.
- **Regra/cálculo:** dispara se saldo ≤ estoque mínimo.
- **Condição mínima:** produto com estoque mínimo definido (ou padrão sugerido).
- **Severidade:** 🟡.
- **Tipo:** Fato.
- **Mensagem:** "[Produto] está abaixo do estoque mínimo."
- **Ação sugerida:** repor / ajustar mínimo.
- **Risco de falso positivo:** baixo.
- **Como explicar:** "Saldo atual X ≤ mínimo definido Y."
- **Versão:** MVP.

### 1.3. Produto sem movimentação (parado)
- **Objetivo:** revelar capital empatado / estoque encalhado.
- **Dados necessários:** data da última venda/movimentação por produto.
- **Regra/cálculo:** sem venda há mais de N dias (ex.: 30/60) com saldo em estoque.
- **Condição mínima:** produto ativo com saldo > 0.
- **Severidade:** 🟢/🟡.
- **Tipo:** Fato.
- **Mensagem:** "[Produto] não vende há 45 dias e ainda tem estoque."
- **Ação sugerida:** promover / revisar preço / desativar.
- **Risco de falso positivo:** médio (sazonalidade).
- **Como explicar:** "Última venda em [data]; saldo atual X."
- **Versão:** MVP.

### 1.4. Reposição atrasada de produto que vende bem
- **Objetivo:** proteger os campeões de venda.
- **Dados necessários:** ranking de vendas + cobertura de estoque.
- **Regra/cálculo:** produto no topo de vendas E cobertura baixa E sem entrada recente.
- **Condição mínima:** histórico de vendas relevante.
- **Severidade:** 🟡/🔴.
- **Tipo:** Recomendação.
- **Mensagem:** "[Produto] vende bem, mas está com reposição atrasada."
- **Ação sugerida:** priorizar compra.
- **Risco de falso positivo:** médio.
- **Como explicar:** "Entre os mais vendidos; cobertura de X dias; sem entrada há Y dias."
- **Versão:** V1.

---

## 2. Domínio: FINANCEIRO

### 2.1. Recebimentos a vencer (próximos dias)
- **Objetivo:** planejar o caixa de curto prazo.
- **Dados necessários:** contas a receber com vencimento.
- **Regra/cálculo:** soma dos recebíveis com vencimento na janela (ex.: 7 dias).
- **Condição mínima:** existir contas a receber.
- **Severidade:** 🟢.
- **Tipo:** Fato.
- **Mensagem:** "R$ 8.420,00 vencem nos próximos 7 dias."
- **Ação sugerida:** ver contas / preparar cobrança.
- **Risco de falso positivo:** baixo.
- **Como explicar:** "Soma de N contas a receber com vencimento até [data]."
- **Versão:** MVP.

### 2.2. Recebimentos vencidos (inadimplência)
- **Objetivo:** recuperar dinheiro parado.
- **Dados necessários:** contas a receber vencidas e não pagas.
- **Regra/cálculo:** situação = vencida; agrupar por cliente/valor.
- **Condição mínima:** existir conta vencida.
- **Severidade:** 🟡/🔴.
- **Tipo:** Fato.
- **Mensagem:** "R$ 3.100,00 estão vencidos e ainda não foram recebidos."
- **Ação sugerida:** cobrar (enviar cobrança — WhatsApp em V2).
- **Risco de falso positivo:** baixo (depende de baixa correta de pagamentos).
- **Como explicar:** "N contas vencidas desde [datas]."
- **Versão:** MVP.

### 2.3. Projeção de caixa negativo
- **Objetivo:** antecipar aperto de caixa.
- **Dados necessários:** saldo atual, recebíveis a receber, contas a pagar, com datas.
- **Regra/cálculo:** saldo projetado por dia = saldo + entradas previstas − saídas previstas; dispara se cruzar zero na janela.
- **Condição mínima:** dados de contas a pagar e receber suficientes; caso contrário, não projetar (DT11).
- **Severidade:** 🔴.
- **Tipo:** Projeção.
- **Mensagem:** "Seu caixa projetado pode ficar negativo no dia 28."
- **Ação sugerida:** antecipar recebimentos / adiar pagamentos.
- **Risco de falso positivo:** alto (depende de pagamentos e recebimentos registrados corretamente).
- **Como explicar:** "Saldo atual X, menos contas a pagar Y, mais recebíveis previstos Z até [data]."
- **Versão:** V1 (projeção simples); refinada em V2.

### 2.4. Margem reduzida
- **Objetivo:** proteger a lucratividade.
- **Dados necessários:** preço de venda e custo dos produtos vendidos.
- **Regra/cálculo:** margem do período vs. período anterior; dispara em queda relevante.
- **Condição mínima:** produtos com custo cadastrado.
- **Severidade:** 🟡.
- **Tipo:** Fato.
- **Mensagem:** "As vendas cresceram, mas sua margem caiu."
- **Ação sugerida:** revisar preços/custos dos produtos afetados.
- **Risco de falso positivo:** médio (custos desatualizados).
- **Como explicar:** "Margem passou de X% para Y%; principal causa: [produtos/custo]."
- **Versão:** V1.

### 2.5. Concentração de receita / lucro
- **Objetivo:** revelar dependência e onde está o lucro.
- **Dados necessários:** vendas por produto/cliente no período.
- **Regra/cálculo:** % da receita/lucro concentrada no top N (ex.: 5).
- **Condição mínima:** volume mínimo de vendas no período.
- **Severidade:** 🟢.
- **Tipo:** Fato.
- **Mensagem:** "A maior parte do seu lucro deste mês veio de 5 produtos."
- **Ação sugerida:** proteger esses itens (estoque/preço).
- **Risco de falso positivo:** baixo.
- **Como explicar:** "Top 5 produtos = X% do lucro do mês."
- **Versão:** V1.

---

## 3. Domínio: VENDAS

### 3.1. Variação de vendas (alta ou queda)
- **Objetivo:** perceber mudança de ritmo cedo.
- **Dados necessários:** vendas por período.
- **Regra/cálculo:** vendas do período vs. média histórica comparável; dispara em desvio relevante.
- **Condição mínima:** histórico mínimo (ex.: 3–4 semanas).
- **Severidade:** 🟢/🟡.
- **Tipo:** Fato.
- **Mensagem:** "Suas vendas caíram 18% em relação às últimas semanas." / "…cresceram 22%."
- **Ação sugerida:** investigar causa / reforçar o que funciona.
- **Risco de falso positivo:** médio (sazonalidade, dias atípicos).
- **Como explicar:** "Vendas de R$ X vs. média de R$ Y."
- **Versão:** MVP (comparação simples); refinada em V1.

### 3.2. Variação de ticket médio
- **Objetivo:** entender se vende-se mais barato ou mais caro por venda.
- **Dados necessários:** total vendido e nº de vendas por período.
- **Regra/cálculo:** ticket = total ÷ nº de vendas; comparar períodos.
- **Condição mínima:** nº mínimo de vendas.
- **Severidade:** 🟢.
- **Tipo:** Fato.
- **Mensagem:** "Seu ticket médio caiu de R$ 180 para R$ 145."
- **Ação sugerida:** revisar mix/descontos.
- **Risco de falso positivo:** baixo.
- **Como explicar:** "Ticket = total/vendas em cada período."
- **Versão:** MVP.

### 3.3. Resumo diário da operação
- **Objetivo:** dar o pulso do dia sem esforço.
- **Dados necessários:** vendas, recebimentos, pendências do dia.
- **Regra/cálculo:** consolidação do dia + destaques.
- **Condição mínima:** operação registrada no dia.
- **Severidade:** 🟢.
- **Tipo:** Fato.
- **Mensagem:** "Hoje: 12 vendas, R$ 3.4 mil, 2 pontos que pedem atenção."
- **Ação sugerida:** abrir "Requer atenção".
- **Risco de falso positivo:** baixo.
- **Como explicar:** "Soma das operações registradas hoje."
- **Versão:** MVP (também enviado via WhatsApp em V2).

### 3.4. Prioridades do dia
- **Objetivo:** dizer por onde começar.
- **Dados necessários:** insights ativos ordenados por impacto.
- **Regra/cálculo:** ranking dos insights "Requer atenção" por severidade/impacto.
- **Condição mínima:** existir ao menos um item relevante.
- **Severidade:** 🟢.
- **Tipo:** Recomendação.
- **Mensagem:** "As 3 coisas mais importantes para hoje."
- **Ação sugerida:** resolver item a item.
- **Risco de falso positivo:** baixo.
- **Como explicar:** "Selecionadas entre seus alertas por impacto."
- **Versão:** MVP.

---

## 4. Domínio: CLIENTES

### 4.1. Cliente inativo (sumiu)
- **Objetivo:** reativar quem parou de comprar.
- **Dados necessários:** histórico de compras por cliente.
- **Regra/cálculo:** cliente com padrão de recorrência que não compra há mais que seu intervalo típico (ou > N dias).
- **Condição mínima:** cliente com histórico de reccompra.
- **Severidade:** 🟢/🟡.
- **Tipo:** Fato.
- **Mensagem:** "Este cliente comprava toda semana e sumiu há 30 dias."
- **Ação sugerida:** entrar em contato (WhatsApp em V2).
- **Risco de falso positivo:** médio (cliente pode ter mudado de hábito).
- **Como explicar:** "Comprava a cada ~7 dias; última compra há 30 dias."
- **Versão:** V1 (MVP: versão simples por N dias).

### 4.2. Cliente com pagamento pendente há muito tempo
- **Objetivo:** priorizar cobrança do que está mais atrasado.
- **Dados necessários:** contas a receber por cliente + datas.
- **Regra/cálculo:** dias desde o vencimento; destacar os maiores.
- **Condição mínima:** existir pendência vencida.
- **Severidade:** 🟡.
- **Tipo:** Fato.
- **Mensagem:** "Este cliente está há 18 dias sem concluir o pagamento."
- **Ação sugerida:** cobrar.
- **Risco de falso positivo:** baixo.
- **Como explicar:** "Conta de R$ X vencida em [data]."
- **Versão:** MVP.

---

## 5. Domínio: PEDIDOS

### 5.1. Pedidos parados
- **Objetivo:** destravar vendas em aberto.
- **Dados necessários:** vendas/pedidos em estado aberto + tempo no estado.
- **Regra/cálculo:** pedido aberto há mais que o tempo normal do negócio (ou > N dias).
- **Condição mínima:** existir pedido aberto.
- **Severidade:** 🟡.
- **Tipo:** Fato/Anomalia.
- **Mensagem:** "3 pedidos estão parados há mais tempo que o normal."
- **Ação sugerida:** revisar e concluir/cancelar.
- **Risco de falso positivo:** médio (depende do fluxo do negócio).
- **Como explicar:** "Abertos há X dias; normal é ~Y."
- **Versão:** MVP (limite fixo); anomalia em V1.

---

## 6. Domínio: OPERAÇÃO GERAL

### 6.1. Tudo sob controle (estado positivo)
- **Objetivo:** dar tranquilidade quando não há riscos (o alívio é o produto).
- **Dados necessários:** ausência de insights críticos/atenção ativos.
- **Regra/cálculo:** nenhum item relevante em "Requer atenção".
- **Condição mínima:** dados confiáveis do dia.
- **Severidade:** 🟢.
- **Tipo:** Fato.
- **Mensagem:** "Está tudo sob controle hoje."
- **Ação sugerida:** — (nenhuma).
- **Risco de falso positivo:** baixo (mas depende de dados atualizados — DT12).
- **Como explicar:** "Nenhum alerta ativo no momento."
- **Versão:** MVP.

### 6.2. Qualidade dos dados / lacunas
- **Objetivo:** manter a confiança (produtos sem custo, sem estoque mínimo).
- **Dados necessários:** completude de cadastros.
- **Regra/cálculo:** identificar dados faltantes que limitam insights (ex.: produto sem custo → sem margem).
- **Condição mínima:** existir lacuna relevante.
- **Severidade:** 🟢.
- **Tipo:** Recomendação.
- **Mensagem:** "5 produtos sem custo — cadastre para acompanhar sua margem."
- **Ação sugerida:** completar cadastro.
- **Risco de falso positivo:** baixo.
- **Como explicar:** "Estes produtos não têm custo; por isso a margem deles não é calculada."
- **Versão:** MVP.

---

## 7. Mapa de Insights por Versão

| Versão | Insights |
|---|---|
| **MVP** | Risco de ruptura, Estoque baixo, Produto parado, Recebíveis a vencer, Recebíveis vencidos, Variação de vendas (simples), Variação de ticket, Concentração (simples), Cliente inativo (simples), Cliente em atraso, Pedidos parados (limite), Resumo diário, Prioridades do dia, Tudo sob controle, Qualidade dos dados |
| **V1** | Reposição atrasada de campeão, Projeção de caixa negativo, Margem reduzida, Concentração de lucro, Variação de vendas (histórico), Cliente inativo (por recorrência), Pedidos parados (anomalia) |
| **V2** | Insights acionáveis via WhatsApp (cobrança, reativação, resumo diário enviado), projeções aprimoradas com mais histórico, insights de compras |
| **Futura** | Previsão de demanda avançada, sazonalidade, recomendações de preço, resumo em linguagem natural (generativo), detecção de anomalia multivariada |

> A lista do MVP prioriza insights **determinísticos e de baixo falso positivo** — os que constroem confiança. Projeções de maior risco (caixa negativo, margem) entram em V1, quando há mais histórico e a confiança dos dados está estabelecida.

---

## 8. Regras de Governança do Catálogo

1. **Nenhum insight entra sem ficha completa** (todos os campos preenchidos).
2. **Insight com falso positivo recorrente é desativado** — errar destrói confiança (`DataTrust.md`).
3. **Novos insights precisam de dados confiáveis** nas Camadas 1 e 2 do domínio.
4. **Menos, porém úteis** — o catálogo cresce por evidência de utilidade, não por ambição (medido em `NorthStarMetric.md`: % de insights úteis).
5. **Todo insight respeita `IntelligencePrinciples.md`** (fato/projeção/recomendação, sem alarmismo, rastreável).

---

## 9. Relação com os Demais Documentos

- **As leis:** `IntelligencePrinciples.md`.
- **A base de confiança:** `DataTrust.md`.
- **Onde os insights aparecem:** `DecisionCenter.md`.
- **Métricas de qualidade dos insights:** `NorthStarMetric.md`.
