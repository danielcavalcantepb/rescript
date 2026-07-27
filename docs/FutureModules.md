---
Status: Draft
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Proposal
Scope: FutureModules
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Módulos Futuros

> Documento oficial de visão de expansão modular.
> Como o Rescript cresce em capacidade sem trair a simplicidade nem exigir reescrita.
> Status: Estratégia (pré-arquitetura técnica). Complementa `Modules.md` (visão funcional) e `Roadmap.md` (sequência).

---

## 1. A Lógica dos Módulos

O crescimento do Rescript **não** acontece inchando o núcleo — acontece **plugando módulos opcionais** que a empresa ativa quando precisa. Isso resolve a tensão central do produto:

> Como ser **simples para quem quer o básico** e **poderoso para quem cresce** — ao mesmo tempo?

Resposta: núcleo minimalista + módulos sob demanda + planos que os liberam. Cada empresa monta o Rescript do tamanho da sua necessidade.

### Critérios para um módulo existir (revisão de `Modules.md`)
1. **Coesão de domínio** — resolve um conjunto de problemas distinto do núcleo.
2. **Público identificável** — nem toda empresa precisa.
3. **Valor comercial** — pode ser precificado (upsell / expansão de NRR).
4. **Independência** — ativa/desativa sem quebrar o núcleo.
5. **Integração por contrato** — conecta via eventos/entidades compartilhadas.

Se falha em qualquer critério → é núcleo, é configuração, ou não existe.

---

## 2. Priorização dos Módulos (visão crítica de fundador)

Nem todo módulo tem o mesmo valor estratégico. Priorização por **impacto em receita/retenção × demanda do ICP × esforço**:

| Módulo | Demanda ICP | Impacto retenção/receita | Prioridade estratégica |
|---|---|---|---|
| **Fiscal (NF-e)** | Muito alta | Alto (desbloqueia vendas perdidas) | **1ª onda** |
| **Compras** | Alta | Alto (fecha o ciclo, alimenta estoque/financeiro) | **1ª onda** |
| **Integrações / Marketplace** | Alta (varejo online) | Alto (efeito de rede) | **2ª onda** |
| **API Pública** | Média | Médio-alto (habilita ecossistema) | **2ª onda** |
| **Assistência Técnica** | Média (nicho) | Médio (novo segmento) | **3ª onda** |
| **Produção** | Média (nicho) | Médio (novo segmento) | **3ª onda** |
| **Projetos** | Média (nicho) | Médio (novo segmento) | **3ª onda** |
| **RH / Comissões** | Baixa-média | Médio (expansão de conta) | **4ª onda** |

> **Revisão crítica vs. Discovery:** no roadmap inicial, Compras e Fiscal apareciam corretamente cedo. Reforçamos aqui que **Fiscal é praticamente table-stakes** para boa parte do ICP brasileiro e deve ser tratado como desbloqueador de mercado, não como "extra". Ver riscos em `CompetitiveAnalysis.md`.

---

## 3. Módulos da 1ª Onda (pós-núcleo maduro)

### 3.1. Fiscal / Emissão de Documentos
- **O que resolve:** emissão de NF-e/NFC-e/NFS-e e obrigações fiscais básicas.
- **Por que primeiro:** parte relevante do ICP não pode operar legalmente sem nota; sua ausência é motivo de churn e de não-conversão.
- **Como fazer (sem trair a filosofia):** preferir **integração com solução fiscal especializada** a reconstruir toda a complexidade tributária. A regulação fiscal brasileira é um poço sem fundo — não é onde queremos gastar simplicidade.
- **Sinergia:** a venda no núcleo já contém os dados; emitir nota deve ser "um clique a mais", não redigitação (P2).

### 3.2. Compras
- **O que resolve:** fornecedores, pedidos de compra, entrada de estoque, contas a pagar automáticas, sugestão de reposição.
- **Por que cedo:** fecha o ciclo comercial (compra → estoque → venda → financeiro), aumentando a profundidade de uso e a retenção.
- **Sinergia:** alimenta Estoque (entradas) e Financeiro (contas a pagar) via eventos.

---

## 4. Módulos da 2ª Onda (plataforma / ecossistema)

### 4.1. Marketplace de Integrações
- **O que resolve:** conectar o Rescript ao ecossistema que a PME já usa — marketplaces (Mercado Livre, Shopee), e-commerce (Shopify), meios de pagamento, logística, contabilidade.
- **Valor estratégico:** **efeito de rede** e retenção. Cada integração aumenta o custo (saudável) de sair. Adaptação da força do Shopify e do Bling.
- **Modelo:** catálogo self-service; potencial de receita compartilhada com parceiros.

### 4.2. API Pública
- **O que resolve:** permite que clientes e terceiros integrem e estendam o Rescript.
- **Valor estratégico:** habilita o marketplace e a extensibilidade; atrai o ICP secundário e parceiros.
- **Requisito arquitetural:** contratos versionados desde cedo (ver `ArchitectureOverview.md`) para não quebrar consumidores.

---

## 5. Módulos da 3ª Onda (verticais por segmento)

Módulos que **expandem o mercado endereçável** para segmentos específicos, sem complicar o núcleo:

### 5.1. Assistência Técnica
- Ordens de serviço, controle de equipamentos, peças utilizadas.
- **Público:** oficinas, assistências, prestadores.

### 5.2. Produção
- Ordens de produção simples, ficha técnica (insumos), consumo → produto acabado.
- **Público:** pequenas indústrias, fabricação sob encomenda.
- **Cuidado:** manter **simples** — não virar MRP. Manufatura complexa está fora do ICP (`IdealCustomerProfile.md`).

### 5.3. Projetos
- Gestão por etapas, apontamento de custos/tempo, faturamento por projeto.
- **Público:** agências e prestadores de serviço por projeto.

---

## 6. Módulos da 4ª Onda (expansão de conta)

### 6.1. RH / Comissões
- Cadastro de colaboradores, comissões de vendedores, controle simples de ponto/escala.
- **Sinergia:** comissões conectam Vendas + RH (expansão de receita por conta).
- **Prioridade menor:** menos central à dor primária do ICP; entra quando a base pedir.

---

## 7. Como os Módulos Preservam a Simplicidade

Princípios inegociáveis da estratégia modular:

1. **Invisível até ser ativado.** Módulo inativo não aparece no menu (ver `Navigation.md`). Quem não usa, não vê.
2. **Cada módulo herda os princípios do núcleo** (`CorePrinciples.md`): simples, sem redigitação, confiável.
3. **Integração nativa, não "puxadinho".** O módulo conversa com o núcleo por eventos/entidades — o dado da venda vira nota fiscal sem retrabalho.
4. **Ativação é reversível e sem migração** (P10).
5. **O núcleo nunca depende de um módulo.** Dependência é sempre do módulo para o núcleo, nunca o contrário.

---

## 8. Riscos da Estratégia Modular (visão crítica)

| Risco | Descrição | Mitigação |
|---|---|---|
| **Dispersão** | Construir muitos módulos medianos em vez de um núcleo excepcional | Núcleo maduro **antes** de qualquer módulo; priorização disciplinada |
| **Complexidade fiscal** | Fiscal consumir energia e simplicidade da empresa | Integração especializada, não reconstrução |
| **Módulos órfãos** | Módulo de nicho com baixa adoção drenando manutenção | Validar demanda real antes de construir; critérios da Seção 1 |
| **Inchaço do núcleo disfarçado** | "Só um recursinho" que deveria ser módulo entrando no núcleo | Funil de decisão (`ProductPhilosophy.md`) |
| **Precificação confusa** | Muitos módulos tornando o pricing complexo | Empacotamento claro por plano (`GoToMarket.md`) |

---

## 9. Regra de Ouro dos Módulos

> **Nenhum módulo é construído enquanto o núcleo não for excepcional. E nenhum módulo pode complicar a vida de quem não o usa.**

A tentação de crescer em superfície (muitos módulos) é o caminho mais rápido para virar "mais um ERP". Crescemos em **profundidade de valor** primeiro, em **superfície** depois — sempre guiados pela demanda comprovada do ICP e pelos princípios do produto.

---

## 10. Relação com o Roadmap

Este documento define **o quê e por quê** dos módulos; o `Roadmap.md` define **quando e em que ordem**, com as dependências entre eles. As "ondas" aqui correspondem, grosso modo, às fases V2→V3 do roadmap revisado.
