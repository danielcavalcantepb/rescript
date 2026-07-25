# Rescript — Roadmap (Revisado)

> Documento oficial de roadmap estratégico, dividido em versões: **MVP · V1 · V2 · V3**.
> Guia de sequenciamento de valor com dependências — não cronograma rígido de datas.
> Status: Estratégia (pré-arquitetura técnica).
> **Revisão:** este roadmap incorpora a tese central de inteligência ("mostrar ao dono o que precisa de atenção, antes do problema"). A inteligência evolui em todas as fases, sempre atrás da confiabilidade dos dados. Ver Seção 8 para o registro crítico do que mudou e por quê.

---

## 1. Filosofia do Roadmap

1. **Núcleo primeiro, sempre.** Nenhum módulo avança enquanto o núcleo não for sólido e amado.
2. **Valor incremental e vendável.** Cada versão entrega algo que o cliente percebe e/ou que gera receita.
3. **Crescer sem reescrever (P10).** Cada fase se apoia na fundação da anterior.
4. **Retenção antes de aquisição.** Não escalar sobre um balde furado (`Retention.md`, `GoToMarket.md`).
5. **Demanda comprovada antes de aposta.** Módulo de nicho só com sinal real do ICP.

---

## 2. Visão Geral (MVP → V3)

A lógica do roadmap segue as **três camadas** (registrar → automatizar → interpretar) e um princípio: **a inteligência evolui junto com a confiabilidade dos dados, nunca antes dela** (`DataTrust.md`).

| Versão | Tema | Foco central | Resultado esperado |
|---|---|---|---|
| **Fundação** *(interna)* | Alicerce | Multi-tenant, auth, billing, design system, base de confiança de dados | Base pronta sem dívida estrutural |
| **MVP** | Registrar + Automatizar + Interpretar o essencial | Núcleo comercial + Central de Decisão com insights determinísticos | Empresa opera, confia nos números e recebe conclusões úteis |
| **V1** | Aprofundar operação + Desbloqueio Fiscal + mais inteligência | Importação, **Fiscal (integração)**, mais insights, projeções simples, melhor ativação | Retenção forte; remover bloqueador nº1; inteligência mais rica |
| **V2** | Conveniência + Ciclo completo | **WhatsApp**, **Compras**, previsões aprimoradas, integrações | Fricção reduzida onde o cliente já trabalha; ciclo compra→venda→nota |
| **V3** | Verticais + Plataforma + Inteligência avançada | Assistência, Produção, Projetos, API, Marketplace, inteligência avançada | Novos segmentos, ecossistema e NRR |
| **Além** | Escala & IA generativa | BI avançado, IA generativa provada, multi-filial, multi-região | Liderança e escala |

> **Mudanças críticas vs. versão anterior:** (1) a **inteligência é explicitada em todas as fases**, começando determinística no MVP e evoluindo com a confiança dos dados; (2) o **WhatsApp entra em V2** como wedge de conveniência; (3) o **Fiscal permanece em V1** como desbloqueador de mercado. Justificativas na Seção 8.

---

## 3. Fundação (interna, pré-MVP)

**Objetivo:** alicerce que evita reescrita (ver `ArchitectureOverview.md`).

- Multi-tenancy e isolamento de dados.
- Autenticação e gestão de empresas/usuários.
- Papéis básicos de acesso.
- Billing/assinaturas básico.
- Design system e padrões de UX (base da consistência — P12).

**Dependências:** nenhuma (é a base).
**Não é vendável** — é o que torna todo o resto possível.

---

## 4. MVP — Núcleo Comercial 🎯

**Objetivo:** validar as hipóteses centrais (`MVP.md`) e a ativação (`Activation.md`).

**Entregas:**
- **Registrar:** Clientes, Produtos (variantes), Estoque (físico/reservado/disponível + custeio médio), Vendas (ciclo Sale: orçamento/pedido/confirmada), Financeiro básico sem juros/multa (`FounderDecisions.md`, `DataTrust.md`).
- **Automatizar:** Confirmar Venda → consome reserva + baixa estoque + recebível; desconto com autorização; unidades inteiras/fracionadas.
- **Interpretar (essencial):** Central de Decisão com insights determinísticos de baixo falso positivo (`InsightCatalog.md` — conjunto MVP).
- Relatórios e onboarding guiado até o "momento aha" (venda **confirmada** + primeira conclusão útil).
- **Fora do MVP (explícito):** juros/multa, PEPS, multi-moeda, agregado Order separado.

**Dependências:** Fundação (incluindo base de confiança de dados — a inteligência do MVP depende dela).
**Meta de negócio:** primeiras empresas pagantes; ativação alta; primeiros casos de sucesso.
**Critério para avançar:** ativação e retenção iniciais saudáveis + confiança nos números comprovada (não avançar por pressa).

---

## 5. V1 — Núcleo Amado + Desbloqueio Fiscal

**Objetivo:** transformar o MVP em um produto que retém **e** remover o maior bloqueador comercial do mercado brasileiro.

**Entregas — Aprofundar operação e ativação:**
- Importação de dados (planilha de clientes/produtos) — reduz atrito de ativação (P2, `Activation.md`).
- Refinamento de UX guiado por uso real; melhor ativação.
- Permissões por papel mais completas.
- Performance, busca e experiência mobile-web aprimoradas.
- **Financeiro avançado inicial:** juros, multa e encargos sobre atraso (InterestPolicy — FD-04); renegociação quando houver demanda.

**Entregas — Mais inteligência (Camada 3 cresce com a confiança dos dados):**
- Novos insights do `InsightCatalog.md` (conjunto V1): projeção de caixa negativo, margem reduzida, concentração de lucro, reposição de campeão, cliente inativo por recorrência, pedidos parados por anomalia.
- Projeções simples auditáveis (dias até ruptura refinado, caixa projetado).
- Central de Decisão mais rica, mantendo a curadoria de ruído (`DecisionCenter.md`).

**Entregas — Desbloqueio Fiscal:**
- **Módulo Fiscal via integração especializada:** emissão de NF-e/NFC-e/NFS-e a partir dos dados da venda já existentes ("um clique a mais", não redigitação).

**Dependências:** MVP maduro e **confiança dos dados comprovada** (as projeções de V1 exigem histórico e integridade).
**Meta de negócio:** retenção/NPS altos; **aumento de conversão** ao remover o "não posso emitir nota"; inteligência percebida como útil (métrica de valor percebido).

> ⚠️ **Decisão de sequenciamento:** consolidação e fiscal podem correr em paralelo por serem de naturezas diferentes (UX vs. integração). Mas **retenção do núcleo tem prioridade** se houver escolha de recursos.

---

## 6. V2 — Conveniência (WhatsApp) + Ciclo Comercial Completo

**Objetivo:** reduzir fricção onde o cliente já trabalha (WhatsApp), fechar o ciclo compra→venda→nota e aprimorar as previsões.

**Entregas — WhatsApp (wedge de conveniência):**
- Ações a partir do WhatsApp: criar venda a partir de conversa, compartilhar orçamento/pedido, enviar cobrança e acompanhamento, receber confirmação.
- **Resumo diário ao dono** e notificação **apenas de acontecimentos relevantes** (integrado à Central de Decisão).
- Princípio: o WhatsApp é conveniência, **não** dependência obrigatória; o registro de verdade continua no núcleo (`Product.md` §7.2, `DataTrust.md`).

**Entregas — Ciclo completo:**
- **Módulo Compras:** fornecedores, pedidos de compra, entrada de estoque, contas a pagar automáticas, sugestão de reposição.
- **Previsões aprimoradas** (mais histórico → projeções melhores) e insights de compras.
- **Integrações** (1ª fase): e-commerce/marketplaces, meios de pagamento, logística.

**Dependências:**
- WhatsApp depende de Vendas/Financeiro estáveis e da Central de Decisão (MVP/V1).
- Compras depende de **Estoque + Financeiro** (MVP).
- Previsões aprimoradas dependem de **histórico acumulado** (só melhoram com o tempo — por isso V2).

**Meta de negócio:** profundidade de uso e conveniência (retenção), efeito de rede, expansão de receita (NRR > 100%).

---

## 7. V3 — Verticais + Plataforma + Inteligência Avançada

**Objetivo:** expandir mercado endereçável por segmento, virar plataforma (API/marketplace) e aprofundar a inteligência — sem complicar o núcleo.

**Entregas (priorizadas por demanda comprovada):**
- **Módulos especializados:** Assistência Técnica (ordens de serviço), Produção simples (ficha técnica, insumos — *não virar MRP*), Projetos (etapas, custos, faturamento), RH/Comissões.
- **API Pública** (chaves, webhooks, contratos versionados) e **Marketplace de Integrações**.
- **Inteligência avançada:** detecção de anomalia multivariada, previsão de demanda mais sofisticada, recomendações de preço — sempre entregues como conclusão simples.

**Dependências:**
- Todos dependem do núcleo maduro e da confiança dos dados.
- Produção depende de **Estoque** robusto; Comissões (RH) dependem de **Vendas**.
- Marketplace depende de **API Pública**.
- Inteligência avançada depende de **histórico rico e confiável** (só faz sentido com dados acumulados).

**Meta de negócio:** novos segmentos; ecossistema; expansão de conta; consolidação como plataforma.

---

## 8. Registro da Revisão Crítica (o que mudou e por quê)

Ajustes desta revisão (incorporação da tese central de inteligência):

1. **Inteligência explicitada em todas as fases, evoluindo com a confiança dos dados.**
   *Decisão:* a Camada 3 (Interpretar) começa **determinística** no MVP (insights de baixo falso positivo), ganha **projeções** em V1 (quando há histórico), previsões aprimoradas em V2 e inteligência avançada/generativa depois. Nunca antes da confiabilidade dos dados (`DataTrust.md`, `IntelligencePrinciples.md`).

2. **WhatsApp trazido para V2 como wedge de conveniência.**
   *Razão:* o ICP inicial vive no WhatsApp (`BeachheadAnalysis.md`). Reduz fricção onde o cliente já trabalha, sem virar dependência obrigatória. Depende de Vendas/Financeiro e da Central de Decisão estáveis.

3. **Fiscal mantido em V1 como desbloqueador de mercado.**
   *Razão:* nota fiscal é pré-requisito para grande parte do ICP; ausência causa não-conversão e churn. Via integração, não reconstrução.

4. **Importação antecipada para V1.**
   *Razão:* alavanca direta de ativação (remove o medo da tela em branco).

5. **API Pública + Marketplace movidos para V3 (com as verticais).**
   *Razão:* efeito de rede é valioso, mas depende de núcleo + inteligência maduros e de histórico rico. Priorizamos reter e aprofundar antes de virar plataforma.

6. **IA generativa e BI avançado explicitamente para "Além de V3".**
   *Razão:* só entram quando provarem valor sobre a base determinística (`IntelligencePrinciples.md`, IP8–IP10). Não competem com núcleo, confiança e retenção agora.

---

## 9. Mapa de Dependências (resumo visual)

```
Fundação (multi-tenant, auth, billing, base de CONFIANÇA DE DADOS)
   │
   ▼
  MVP  = Registrar + Automatizar + Interpretar (insights determinísticos)
   │        │                         │
   ▼        ▼                         ▼
  V1: Aprofundar/Importação   V1: + Inteligência (projeções)   V1: Fiscal (usa Vendas/Produtos)
   │
   ▼
  V2: WhatsApp (usa Central de Decisão) + Compras (usa Estoque+Financeiro) + Previsões aprimoradas (usa histórico)
   │
   ▼
  V3: Verticais | API ──► Marketplace | Inteligência avançada (usa histórico rico)
   │
   ▼
  Além: IA generativa provada · BI avançado · Multi-filial · Multi-região
```

**Regras de dependência:**
- Módulos sempre dependem do núcleo; o núcleo nunca depende de módulos (`FutureModules.md`, Seção 7).
- **A inteligência (Camada 3) sempre depende da confiança dos dados (Camadas 1 e 2).** Cada nível de insight só entra quando seus dados são confiáveis (`DataTrust.md`).

---

## 10. Princípios de Priorização (ordem de decisão)

1. **Confiança dos dados** (nada de inteligência sobre base frágil).
2. **Consolidar o núcleo** (nada quebra a base).
3. **Retenção** antes de aquisição de novos recursos.
4. **Inteligência que gera ação** (insights úteis antes de mais features).
5. **Desbloqueadores de mercado** (ex.: fiscal) antes de expansões de nicho.
6. **Demanda comprovada** antes de aposta.
7. **Alavanca de receita** (upsell de módulos/planos, NRR).
8. **Expansão de mercado** (novos segmentos, geografia).

---

## 11. O que NÃO está no roadmap (não-metas permanentes)

- Virar ERP tier-1 corporativo.
- E-commerce/loja virtual própria (integramos, não competimos).
- Contabilidade completa interna / fiscal reconstruído do zero.
- Manufatura complexa (MRP).
- Customização sob encomenda por cliente.

Essas fronteiras protegem a identidade do produto (`Positioning.md`, `ProductPhilosophy.md`).

---

## 12. Como Ler Este Roadmap

- **Versões são sequenciais em valor, não travadas em datas.**
- **Escopo é revisado com dados.** O que é "entrega" hoje pode ser recalibrado com aprendizado.
- **MVP e V1 são inegociáveis como prioridade** — tudo depende de um núcleo que ativa e retém.
