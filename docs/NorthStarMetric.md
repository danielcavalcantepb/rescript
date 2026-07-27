---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: NorthStarMetric
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — North Star Metric

> Documento oficial da métrica-guia da empresa e do framework de métricas.
> Define o que "sucesso" significa e como toda a empresa se alinha em torno dele.
> Status: Estratégia (pré-arquitetura técnica).

---

## 1. O que é uma North Star Metric (e o que não é)

A North Star Metric (NSM) é a **única métrica que melhor captura o valor que entregamos ao cliente**. Ela não é receita (isso é consequência), nem número de usuários (isso é vaidade). É a medida de **valor real recebido**.

Critérios de uma boa NSM:
- Reflete valor para o cliente.
- Prediz receita de longo prazo.
- É influenciável pelo time de produto.
- É simples de entender e comunicar.

---

## 2. A North Star Metric do Rescript

O Rescript entrega dois tipos de valor: **operação organizada** (registrar/automatizar) e **atenção bem direcionada** (interpretar). Por isso adotamos uma North Star operacional **e** uma métrica de valor percebido que a acompanha.

### 2.1. North Star operacional

> ## ⭐ Operações comerciais **completas** registradas por empresa ativa por semana
>
> *(uma "operação completa" é uma venda que dispara suas consequências — baixa de estoque + lançamento financeiro — registrada por tenant ativo, por semana. Reflete as Camadas 1 e 2: registrar e automatizar.)*

### 2.2. Métrica de valor percebido (companheira da North Star)

> ## 🌟 Empresas que **visualizaram e agiram** sobre ao menos uma conclusão relevante na semana
>
> *(mede a Camada 3 — interpretar. Captura se a inteligência está realmente ajudando o dono, não só existindo. É a prova de que a tese central funciona.)*

> Por que duas: a operacional garante que o núcleo virou hábito; a de valor percebido garante que a **inteligência gera ação** — sem ela, correríamos o risco de ter uso sem o diferencial que justifica o Rescript existir (`WhyRescript.md`).

### Por que esta métrica representa sucesso

1. **Mede hábito, não intenção.** Uma empresa que registra operações toda semana **transformou o Rescript no sistema onde seu negócio acontece**. Esse é o valor central da nossa promessa (`Positioning.md`).
2. **É a prova viva do posicionamento.** Nosso posicionamento é "a plataforma que a equipe realmente usa". Operações registradas = uso real, não login vazio.
3. **Prediz receita e retenção.** Empresas que operam no Rescript semanalmente não cancelam — o sistema virou infraestrutura do negócio.
4. **Captura os três pilares do núcleo:** vendas (o evento comercial), estoque (o controle) e financeiro (o dinheiro). Se os três são usados, o produto cumpriu sua função integradora.
5. **É acionável pelo produto:** melhora com onboarding, simplicidade e automações — exatamente o que sabemos fazer.

### Por que NÃO escolhemos alternativas

- **Receita (MRR):** é resultado, não causa; pode subir com aquisição enquanto o produto vaza valor.
- **Usuários cadastrados / logins:** vaidade; login não é valor.
- **Número de empresas:** ignora se elas *usam* o produto.
- **Vendas registradas apenas:** boa, mas estreita — ignora estoque e financeiro, que são parte da "operação centralizada".

> A NSM foi escolhida por medir a **profundidade de uso do núcleo integrado**, que é a essência da proposta de valor.

---

## 3. A Equação do Crescimento (decomposição da NSM)

```
Valor total entregue =
   (nº de empresas ativas)
 × (frequência de operações por empresa/semana)
 × (amplitude: quantos módulos do núcleo ela usa)
```

Cada alavanca tem um dono e um conjunto de métricas de apoio:

- **Mais empresas ativas** → aquisição + ativação (`GoToMarket.md`, `Activation.md`).
- **Mais frequência** → engajamento e simplicidade da operação diária (P6).
- **Mais amplitude** → adoção de estoque + financeiro além de vendas (integração nativa).

---

## 4. Framework de Métricas (AARRR adaptado)

A NSM é o topo; abaixo dela, as métricas por estágio do ciclo de vida.

### 4.1. Aquisição
- Visitantes → cadastros.
- Cadastros por canal (conteúdo, indicação, etc.).
- CAC por canal.

### 4.2. Ativação (detalhe em `Activation.md`)
- **% de empresas que registram a 1ª venda em ≤ 24h.**
- **% que atingem o "momento aha"** (venda que baixa estoque e gera financeiro).
- Tempo até o primeiro valor (TTFV).
- Conclusão do checklist de onboarding.

### 4.3. Retenção (detalhe em `Retention.md`)
- Retenção de empresas ativas D30 / D60 / D90.
- Churn mensal de empresas e de receita.
- % de empresas que operam ≥ 1x por semana (base da NSM).

### 4.4. Receita
- MRR / ARR.
- ARPA (receita média por conta).
- Conversão free→pago.
- **NRR (Net Revenue Retention)** — a métrica financeira mais importante do SaaS.

### 4.5. Indicação (Referral)
- NPS (dono e operador, medidos separadamente).
- Coeficiente de indicação (clientes trazidos por cliente).

---

## 5. Métricas de Ativação (resumo — ver `Activation.md`)

O que sinaliza que uma empresa "pegou" o produto:
- Primeira venda registrada em ≤ 24h.
- Estoque e financeiro atualizados por essa venda (aha).
- Ao menos X vendas na primeira semana.
- Segundo usuário convidado (sinal de adoção de equipe).

---

## 6. Métricas de Retenção (resumo — ver `Retention.md`)

O que sinaliza que a empresa vai ficar:
- Uso semanal recorrente (base da NSM).
- Uso combinado de vendas + estoque + financeiro (profundidade).
- Retenção D30/D60/D90 acima das metas.
- Baixo churn e NRR > 100%.

---

## 7. Métricas de Expansão

O que sinaliza que a conta vai crescer (e a receita com ela):
- **Upgrade de plano** (Essencial → Profissional → Empresarial).
- **Ativação de módulos adicionais** (compras, fiscal, produção...).
- **Aumento de assentos** (mais usuários).
- **Uso de integrações/API** (futuro).
- **NRR > 100%** como consolidação: a base cresce mesmo sem novos clientes.

---

## 7.1. Métricas Obrigatórias (painel oficial)

Acompanhadas sempre, sem exceção:

- **Tempo até a primeira venda.**
- **Tempo até a primeira operação completa** (venda com consequências).
- **% de empresas ativadas.**
- **Frequência semanal** de operações completas (North Star operacional).
- **Retenção por coorte.**
- **Quantidade de tarefas manuais evitadas** (efeito da automação — Camada 2).
- **% de insights considerados úteis.**
- **% de alertas dispensados.**
- **Taxa de ação sobre insights** (valor percebido — Camada 3).
- **Confiança declarada nos números** (o usuário confia sem reconferir? — `DataTrust.md`).

> As quatro últimas medem se a **inteligência** cumpre a tese sem destruir a simplicidade: insights úteis, pouco ruído, ação real e confiança nos dados.

---

## 8. Anti-Métricas (o que NÃO comemorar)

- Cadastros que nunca ativam.
- Logins sem operações registradas.
- Features entregues sem adoção (V3 em `MissionVisionValues.md`).
- Crescimento de aquisição com churn crescente (balde furado).

> Cuidado com métricas de vaidade: elas dão sensação de progresso enquanto o valor real estagna.

---

## 9. Cadência de Acompanhamento

- **Semanal:** NSM, ativação, sinais de engajamento.
- **Mensal:** retenção, churn, MRR, NRR, conversão.
- **Trimestral:** revisão de metas, unit economics (CAC/LTV/payback), saúde por coorte.

> Toda a empresa deve conhecer a NSM e entender como seu trabalho a move. Alinhamento em torno de uma métrica é o que evita que produto, marketing e vendas puxem para lados diferentes.
