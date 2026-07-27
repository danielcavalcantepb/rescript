---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: GoToMarket
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Go-To-Market (GTM)

> Documento oficial de estratégia de entrada no mercado e crescimento.
> Como vender, cobrar, crescer, quais canais usar e como chegar aos primeiros 100 e 1.000 clientes.
> Status: Estratégia (pré-arquitetura técnica).

---

## 1. Filosofia de GTM

O Rescript é um produto de **baixo ticket, alto volume, PME**. Isso define tudo:

- **Venda cara e consultiva não fecha a conta.** O CAC precisa ser baixo → o produto tem que se vender (PLG) e ser indicado (boca a boca).
- **A retenção é o motor econômico.** Em SaaS PME o churn é o maior inimigo; o GTM precisa trazer o cliente **certo** (ICP), não qualquer cliente.
- **O produto é o principal canal de marketing.** Um onboarding que encanta gera indicação; um que frustra gera churn e má reputação.

> Estratégia central: **Product-Led Growth (PLG) + conteúdo + indicação**, com camadas de vendas assistidas e canal de parceiros conforme escalamos.

---

## 2. Como Vender (motion de vendas)

### Fase 1 — Product-Led (self-service)
- Cliente descobre, cria conta, testa no **free/trial**, ativa e assina **sem falar com vendedor**.
- O produto e o onboarding fazem a venda (ver `Activation.md`).
- Time humano atua em **suporte proativo** e desbloqueio, não em venda pesada.

### Fase 2 — Sales-Assisted (para o ICP secundário / tickets maiores)
- Para empresas maiores (20–50 pessoas) ou que pedem ajuda, um time de vendas leve ("inside sales") faz demonstração e acompanha a ativação.
- Foco em reduzir tempo até valor, não em contrato longo.

### Fase 3 — Channel / Parceiros
- **Contadores** como canal de indicação (adaptando a jogada da Omie/Conta Azul).
- **Consultores e agências** que atendem PMEs.
- Programa de parceria com comissão/recorrência.

> Nunca transformar a venda em "projeto de implantação". Se o produto precisa de venda complexa, o produto falhou em ser simples (P5).

---

## 3. Como Cobrar (modelo de receita e pricing)

### Modelo
- **Assinatura recorrente** (SaaS), mensal e anual (com desconto anual).
- **Land-and-expand:** entrar barato e crescer por usuários, módulos e volume.

### Estrutura de planos (referência estratégica — ver `Product.md`)
| Plano | Alvo | Lógica |
|---|---|---|
| **Free** | Micro / experimentação | Aquisição e prova de valor; limites baixos |
| **Essencial** | PME iniciante | Núcleo completo; poucos usuários |
| **Profissional** | PME em crescimento | Mais usuários, relatórios, primeiros módulos |
| **Empresarial** | Média empresa | Módulos, integrações/API, suporte prioritário |

### Drivers de preço
- Número de **usuários** (assentos).
- **Módulos** ativados (compras, fiscal, produção...).
- **Volume** (limites de vendas/produtos/notas).
- **Integrações/API** (futuro marketplace).

### Princípios de pricing (inegociáveis)
- **Transição free→pago suave** (evitar o "abismo" do HubSpot).
- **Nunca punir o crescimento** com salto abrupto de preço.
- **Transparência total** — sem letras miúdas (valor V7 em `MissionVisionValues.md`).
- **Preço de entrada acessível** para bater os incumbentes na barreira inicial.

### Crítica honesta (risco de pricing)
- Free tier pode atrair muitos não-pagantes e inflar custo de suporte/infra. **Mitigação:** limites bem calibrados e caminho claro de upgrade.
- Ticket baixo exige **volume e retenção altíssimos** para funcionar. **Mitigação:** foco obsessivo em retenção e expansão (NRR).

---

## 4. Como Crescer (motor de crescimento)

Três motores combinados:

1. **Motor de conteúdo (inbound):** educar o mercado PME sobre gestão simples (blog, YouTube, redes, materiais práticos). Adaptação da máquina de conteúdo do HubSpot ao contexto brasileiro. SEO em dores reais ("como controlar estoque", "planilha de vendas", "como saber se minha empresa dá lucro").
2. **Motor de indicação (viral/boca a boca):** donos indicam donos. Programa de indicação com incentivo. NPS alto como pré-condição.
3. **Motor de produto (PLG):** free tier + ativação forte + expansão para planos/módulos. O uso puxa o crescimento.

Motores secundários conforme escala: **parceiros (contadores)**, **marketplace de integrações** (efeito de rede) e **mídia paga** (só quando CAC/LTV comprovado).

---

## 5. Canais

| Canal | Papel | Quando |
|---|---|---|
| Conteúdo / SEO | Aquisição orgânica de topo de funil | Desde o início |
| Indicação / boca a boca | Aquisição de baixo CAC | Desde os primeiros clientes |
| Comunidades e grupos de PMEs/setoriais | Alcance direto ao ICP | Início (100 primeiros) |
| Redes sociais (Instagram, YouTube, TikTok) | Marca e educação | Início/contínuo |
| Parcerias com contadores | Distribuição confiável | Após produto maduro |
| Marketplace de integrações | Efeito de rede | Fase de plataforma |
| Mídia paga (Google/Meta) | Escala | Só com unit economics provados |
| Outbound / inside sales | ICP secundário | Fase de expansão |

---

## 6. Como Conquistar os Primeiros 100 Clientes

**Objetivo desta fase: aprender, não escalar.** Cada cliente é uma fonte de insight.

Táticas:
1. **Nicho estreito (beachhead):** escolher 1–2 segmentos do ICP e dominar (ex.: um tipo de varejo especializado). Densidade gera indicação.
2. **Venda "mão na massa" fundador-liderada:** os fundadores falam com cada cliente, fazem onboarding manual, aprendem cada fricção. (Não escala — e tudo bem.)
3. **Comunidades e grupos:** entrar onde o ICP já está (grupos de WhatsApp/Telegram setoriais, associações, feiras).
4. **Conteúdo de dor específica:** resolver publicamente a dor do nicho.
5. **Programa de "clientes fundadores":** condições especiais em troca de feedback intenso e depoimentos.
6. **Instrumentar tudo:** medir ativação e retenção desde o cliente #1.

**Meta de qualidade:** ativação alta e primeiros casos de sucesso/depoimentos reais. Melhor 100 clientes que amam do que 1.000 mornos.

---

## 7. Como Chegar aos Primeiros 1.000 Clientes

**Objetivo desta fase: transformar aprendizado em máquina repetível.**

1. **Escalar o que funcionou nos 100:** dobrar nos canais/segmentos que provaram tração.
2. **Ligar o motor de conteúdo/SEO** de forma consistente e mensurável.
3. **Formalizar o programa de indicação** (incentivos claros, fácil de indicar dentro do produto).
4. **Iniciar canal de contadores** com material e comissão.
5. **Otimizar onboarding self-service** para reduzir a dependência de toque humano (o produto tem que ativar sozinho).
6. **Expandir do beachhead** para segmentos adjacentes do ICP, um de cada vez.
7. **Provar unit economics** (CAC, LTV, payback, NRR) antes de escalar mídia paga.

**Pré-condições para escalar:** retenção saudável, NPS alto, ativação previsível. **Não escalar aquisição sobre um funil que vaza** (churn alto) — isso só queima capital.

---

## 8. Métricas de GTM (o que acompanhar)

- **CAC** por canal e **LTV**; relação **LTV/CAC** (alvo saudável de SaaS).
- **Payback** do CAC (meses).
- **Taxa de conversão** free→pago.
- **NRR (Net Revenue Retention)** — expansão menos churn.
- **Ciclo de vendas** e **taxa de ativação** (ligação com `Activation.md`).
- **Coeficiente de indicação** (quantos clientes cada cliente traz).

---

## 9. Riscos de GTM e Mitigações

| Risco | Mitigação |
|---|---|
| Mercado educado/dominado por incumbentes | Nicho estreito + UX superior + indicação |
| CAC alto para ticket baixo | PLG + conteúdo + boca a boca antes de mídia paga |
| Free tier vira custo sem receita | Limites calibrados + upgrade claro |
| Exigência fiscal derruba conversão | Roadmap fiscal + transparência no ICP |
| Canal de contadores dominado pela concorrência | Entrar depois, com produto que o contador confia |
| Escalar cedo demais sobre funil que vaza | Só escalar com retenção e unit economics provados |

---

## 10. Sequência Recomendada (resumo)

1. **0→100:** fundador-liderado, nicho, comunidades, aprender ferozmente.
2. **100→1.000:** conteúdo + indicação + self-service otimizado + provar economics.
3. **1.000+:** canal de contadores, marketplace, mídia paga, expansão de ICP e geografia.

> Regra de ouro do GTM: **retenção antes de aquisição.** Crescer sobre um balde furado é a forma mais rápida de morrer.
