---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: Activation
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Ativação

> Documento oficial da estratégia de ativação (o momento em que o cliente percebe valor real).
> Ativação é a batalha mais importante do produto PLG: onde a promessa vira experiência.
> Status: Estratégia (pré-arquitetura técnica).

---

## 1. Por que Ativação é Tudo

Num produto self-service de PME, **a ativação decide a empresa**. Um cliente que não ativa:
- nunca vira pagante,
- nunca indica,
- consome suporte,
- e engorda o churn.

A aquisição traz gente para a porta; **a ativação decide quem entra e fica**. É aqui que a promessa de "simplicidade" (`Positioning.md`) é testada de verdade.

> Verdade dura de investidor: você pode ter o melhor posicionamento do mundo, mas se o usuário não chega ao valor sozinho nos primeiros minutos, o negócio não fecha a conta.

---

## 2. Definição de Ativação no Rescript

### 2.1. O "Momento Aha"

> **O usuário registra sua primeira venda e percebe que o Rescript atualizou o estoque, organizou o financeiro, atualizou os indicadores, registrou o histórico e apresentou uma conclusão útil — tudo sem cadastros duplicados ou trabalho adicional.**

Esse é o instante em que o cliente *sente* a promessa central do Rescript: **"eu faço uma coisa e o sistema cuida do resto — e ainda me diz o que importa"**. É a materialização dos princípios P2 (digitar uma vez), P3 (reduzir trabalho manual) e P16–P17 (inteligência entregue como conclusão). A conclusão útil na Central de Decisão é parte do "aha", não um extra.

### 2.2. Marco de Ativação (mensurável)

Uma empresa é considerada **ativada** quando, no início do uso:
1. Cadastrou ao menos 1 produto e 1 cliente (ou usou dados de exemplo/importação), **e**
2. Registrou ao menos **1 venda confirmada** que gerou baixa de estoque e lançamento financeiro (a **primeira operação completa**), **e**
3. Visualizou a **Central de Decisão** com dados reais e **ao menos uma conclusão útil**.

### 2.3. Ativação "Forte" (preditiva de retenção)

Sinal mais profundo de que a empresa vai ficar:
- Registrou **≥ 5 vendas na primeira semana**, **e**
- Usou ao menos dois dos três pilares (vendas + estoque **ou** financeiro), **e**
- Convidou um **segundo usuário** (adoção de equipe — sinal forte via persona Aline).

---

## 3. Métricas de Ativação

| Métrica | O que mede | Meta inicial (referência) |
|---|---|---|
| **TTFV (time to first value)** | Tempo do cadastro até a 1ª venda | Minutos, não dias |
| **Ativação em 24h** | % de empresas com 1ª venda em ≤ 24h | Alta e crescente |
| **Taxa de "momento aha"** | % que registra venda com efeito em estoque+financeiro | Maioria dos cadastros |
| **Conclusão do onboarding** | % que completa o checklist | Alta |
| **Ativação forte (semana 1)** | % com ≥5 vendas + 2º usuário | Coorte a acompanhar |
| **Cadastro → ativação** | Funil de conversão inicial | Otimizar continuamente |

> As metas numéricas exatas serão calibradas com dados reais das primeiras coortes. O compromisso é a **direção**: reduzir TTFV e aumentar % de ativação a cada coorte.

---

## 4. O Fluxo de Ativação (jornada dos primeiros minutos)

1. **Cadastro sem atrito** — o mínimo de campos para criar conta + empresa (P8: valor antes de esforço).
2. **Boas-vindas contextual** — 1 a 3 perguntas leves (ramo, tamanho) para personalizar, puláveis.
3. **Caminho guiado ao aha** — o onboarding conduz explicitamente a: cadastrar produto → cadastrar cliente → registrar 1ª venda.
4. **Reduzir o custo do primeiro cadastro:**
   - **Dados de exemplo/demo** para explorar antes de cadastrar.
   - **Importação** de produtos/clientes (planilha) para quem já tem base — evita redigitação (P2).
5. **O momento aha celebrado** — ao concluir a 1ª venda, feedback visível mostrando estoque baixando e financeiro atualizando.
6. **Próximo passo óbvio** — depois do aha, o produto sugere o próximo valor (ver dashboard, convidar equipe).

---

## 5. Alavancas de Produto para Aumentar Ativação

1. **Onboarding guiado com checklist persistente** (progresso visível).
2. **Estados vazios que ensinam** (cada tela vazia orienta a próxima ação — ver `Navigation.md`).
3. **Bons padrões, zero configuração obrigatória** (P9).
4. **Importação e dados de exemplo** para remover o "medo da tela em branco".
5. **Velocidade** — a operação precisa ser instantânea (Aline não espera).
6. **Ajuda contextual** no lugar certo, não manual.
7. **Comunicação de acompanhamento** (e-mail/in-app) para quem cadastrou mas não ativou, guiando de volta ao aha.

---

## 6. Barreiras de Ativação (o que mata a ativação)

| Barreira | Efeito | Contramedida |
|---|---|---|
| Tela em branco / medo de começar | Abandono antes do valor | Dados de exemplo + importação + checklist |
| Configuração obrigatória longa | Desistência no setup | Bons padrões (P9) |
| Muitos campos no cadastro | Fricção | Cadastro mínimo, resto opcional |
| Não entender o próximo passo | Perde-se | Caminho guiado ao aha |
| Lentidão | Frustração da Aline | Performance como prioridade |
| Exigir nota fiscal para vender | Bloqueio | Venda funciona sem fiscal no núcleo |

---

## 7. Ativação por Persona

- **Aline (operadora):** ativa quando registra a 1ª venda sem pensar. **Métrica:** tempo/cliques até concluir uma venda.
- **Ricardo (dono):** ativa quando vê o dashboard fazer sentido. **Métrica:** primeira visita útil ao dashboard com dados reais.
- **Fernanda (gestora):** ativa quando convida a equipe e organiza acessos. **Métrica:** 2º+ usuário ativo.

> Ativação não é um evento único — é ativar **cada papel** que sustenta a conta.

---

## 8. Relação com a North Star e a Retenção

- A **ativação** é o primeiro depósito na **North Star** (operações registradas): sem 1ª operação, não há hábito.
- A ativação **forte** é o melhor preditor de **retenção** (`Retention.md`).
- Melhorar ativação é a alavanca de maior ROI do produto: afeta aquisição (conversão), receita (free→pago) e retenção ao mesmo tempo.

---

## 9. Ritual de Melhoria Contínua

- Analisar ativação **por coorte** (cada semana/mês de novos cadastros).
- Identificar onde o funil de ativação vaza e atacar o maior vazamento primeiro.
- Testar melhorias de onboarding e medir impacto na % de ativação e no TTFV.
- Nunca escalar aquisição enquanto a ativação estiver fraca (regra de `GoToMarket.md`).
