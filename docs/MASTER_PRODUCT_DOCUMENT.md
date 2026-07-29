---
Status: Active
Owner: Product Architecture
Last-Reviewed: 2026-07-28
Version: 1.1.0
Type: Canonical
Scope: Product strategy, functional contract, module responsibilities, UX, roadmap and product-data boundaries
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Documento Mestre de Produto — Rescript

> A constituição de entidades, ownership, invariantes e eventos está em [Core Domain Specification](./CORE_DOMAIN_SPECIFICATION.md). Nenhuma mudança do Core Domain é implementada antes de atualizar essa especificação.

> A sequência executável, superfícies técnicas e gates de entrega estão no [Implementation Program](./IMPLEMENTATION_PROGRAM.md); ele não altera o escopo deste documento.

## 0. Autoridade e uso

Este é o contrato único de produto da Rescript. Toda funcionalidade nova precisa existir aqui, ou ser adicionada aqui antes de implementação. Ele consolida o **porquê**, o **quê**, o **para quem**, o fluxo operacional esperado e o recorte de entrega de cada capacidade.

Este documento não substitui ADRs aceitos para decisões técnicas, nem contratos de segurança, tenancy, auditoria ou banco. Em caso de conflito: ADR específico e documento técnico canônico continuam definindo **como** construir; este documento define **o que** o produto deve oferecer e por qual prioridade. O estado efetivamente entregue é rastreado no [Module Status](./MODULE_STATUS.md).

## 1. Visão do produto

### Proposta de valor

A Rescript é uma plataforma de gestão para empresas que vendem, compram, mantêm estoque e precisam controlar caixa. Ela conecta a operação real a números explicáveis: cada venda, recebimento, produto, saldo e obrigação deve ser compreensível sem montar planilhas paralelas.

O produto responde continuamente:

1. o que está acontecendo;
2. o que exige atenção agora;
3. qual é a próxima ação segura.

### Público, segmentos e posicionamento

O foco são pequenas e médias empresas brasileiras com operação de produtos físicos: lojas, distribuidores, atacadistas, pequenas indústrias, operações com vendedores e empresas que precisam integrar venda, estoque, compra e financeiro. A mesma base precisa crescer de uma equipe pequena até múltiplas empresas, locais, usuários e alto volume transacional.

O posicionamento é **profundidade enterprise com produtividade de software moderno**. A Rescript não replica menus ou fluxos de ERPs legados; usa referências como Phibo, Tiny, Bling, Omie, Conta Azul, ERPNext, Odoo e SAP Business One apenas para entender problemas de negócio.

### Diferenciais permanentes

- **Operar:** Workspaces orientados a contexto, não telas CRUD isoladas.
- **Vender:** continuidade do atendimento ao pedido, sem abandonar o fluxo por cadastros auxiliares.
- **Controlar:** histórico, snapshots e ledgers tornam fatos operacionais rastreáveis.
- **Decidir:** dashboards e indicadores partem de fatos reais, mostram origem e oferecem drill-down.
- **Crescer:** multiempresa, permissões, auditoria e projeções existem desde o início sem transformar o uso diário em burocracia.

### Não objetivos da versão atual

- não ser um catálogo de recursos sem efeito operacional;
- não substituir decisões humanas por automação opaca;
- não exibir métricas fictícias;
- não expor complexidade de arquitetura ao operador;
- não prometer fiscal, pagamentos bancários, conciliação, marketplace ou CRM avançado antes de seus contratos e integrações estarem concluídos.

## 2. Princípios de produto e experiência

1. **Poucos cliques, alto contexto.** A próxima ação frequente deve estar a um clique e informações operacionais não devem exigir navegação investigativa.
2. **Workspace antes de formulário.** Entidades relevantes mostram cabeçalho, resumo, indicadores, abas, relacionamento, histórico e ações contextualizadas.
3. **Fato antes de gráfico.** Dashboard, relatório e alerta derivam de documentos, snapshots, projeções e ledgers oficiais.
4. **Progressive disclosure.** O caminho comum é simples; campos e regras avançadas aparecem quando o contexto exige.
5. **Sem perda de contexto.** Criação contextual usa drawer ou página adequada e preserva o trabalho em andamento.
6. **Segurança é comportamento.** Ocultar uma ação não basta: tenant, actor, permissão, lifecycle e invariantes são validados no servidor e, quando crítico, no PostgreSQL.
7. **Mobile para consulta e ação segura.** Operação intensa é desktop-first; mobile prioriza leitura, alertas e ações compactas.

## 3. Arquitetura funcional geral

| Área | Papel no produto | Autoridade funcional |
|---|---|---|
| Central de Comando | Prioriza fatos e exceções da empresa | Leitura operacional, não BI livre |
| Métricas | Analisa tendências e comparativos | Dados reconciliados e filtros explícitos |
| Clientes e CRM | Mantém relacionamento comercial | Cliente e seu histórico operacional |
| Catálogo | Define produto, variante, categoria, marca e atributos | Identidade comercial do item, não saldo ou preço |
| Pricing | Resolve preço de venda vigente | Price list e regras canônicas de preço |
| Compras | Registra intenção e compromisso de adquirir | Pedido de compra e seus snapshots |
| Recebimento | Registra entrada física originada de compra | Fato de recebimento; estoque por ledger |
| Estoque | Mantém disponibilidade, locais e movimentos | Ledger como fonte de verdade |
| Vendas | Conduz orçamento e pedido comercial | Documento comercial, snapshots e lifecycle |
| Financeiro | Controla obrigações, liquidações e caixa | Títulos, pagamentos e cash ledger quando aprovado |
| Fiscal | Prepara contexto e documentos fiscais internos | Regras fiscais; não emissão sem sprint própria |
| Administração | Controla empresa, membros, papéis e configurações | Acesso, governança e contexto da organização |
| Integrações | Conecta serviços externos por contratos | Nunca vira fonte de verdade paralela |

## 4. Módulos e contrato funcional

### 4.1 Central de Comando e Dashboard Executivo

**Objetivo.** Dar ao gestor uma leitura imediata da situação comercial, financeira e de estoque, priorizando exceções e próximos passos.

**Telas.** Central de Comando (`/app`), Métricas (`/analytics`), detalhe/drill-down na entidade de origem.

**KPIs suportados quando houver base confiável.** Faturamento hoje e no período, vendas, ticket médio, clientes, produtos, contas a receber/pagar, valor e quantidade em estoque, itens críticos e tendências de faturamento.

**Regras.** Apenas fatos confirmados entram em indicadores comerciais; dados insuficientes são exibidos como lacuna, nunca como zero enganoso. Filtros de período e dimensão precisam ser server-side, tenant-aware e levar para a lista ou Workspace filtrado.

**Permissões.** `insights.view` e `analytics.view`, com visibilidade condicionada às permissões de custo/margem quando aplicável.

**Dependências.** Projeções de Sales, Inventory, Finance, Catalog e Customers. Não escreve dados operacionais nem substitui relatórios auditáveis.

### 4.2 CRM, clientes e relacionamento

**Objetivo.** Fazer do cliente uma entidade operacional completa: identificação, contato, endereço principal, documentos, dependentes, histórico, documentos comerciais, pendências e próximos passos.

**Ownership.** Todo Customer pertence obrigatoriamente a uma `Organization`, `Company` e `Branch`. A ausência de filial não é representada por `NULL`: a empresa de uma única unidade utiliza sua Branch padrão. Nenhuma referência, documento, endereço, dependente ou consulta pode cruzar esse escopo.

**Dados oficiais.** O agregado mantém `fullName`, `shortName`, `phone`, `secondaryPhone`, `email`, `instagram`, `acquisitionSource` e `notes`. `personType` é `individual` ou `company`. Pessoa física pode possuir CPF e RG; pessoa jurídica pode possuir CNPJ, razão social, nome fantasia, inscrições estadual e municipal. Documentos e contatos sensíveis são auditados e validados no servidor. O endereço principal pertence ao Customer e a modelagem permanece preparada para múltiplos endereços futuros. Child/Dependent é uma entidade dependente do Customer, nunca um Customer paralelo.

**Fonte de aquisição.** `AcquisitionSource` é catálogo organizacional, selecionado pelo Customer e disponível como dimensão analítica. O catálogo inclui as opções iniciais aprovadas e a opção `Outro` com descrição; não é substituído por texto livre sem classificação.

**Lifecycle.** `draft → active`, `draft → archived`, `active → inactive|archived`, `inactive → active|archived`; `draft` significa cadastro iniciado com informações ainda incompletas e cliente não operacional conforme as regras vigentes. Somente `active` é elegível para novas operações. Um Customer arquivado só retorna por reativação explícita para `active` ou `inactive`. Arquivamento preserva histórico e relacionamentos; exclusão física de Customer com histórico é proibida.

**Telas e fluxos aprovados.** Lista e busca, Customer Workspace, criação/edição em página e criação contextual em drawer dentro de vendas quando autorizada. A busca cobre nome, nome abreviado, documento, email, telefone e Instagram; a criação detecta potencial duplicidade sem descartar o trabalho em andamento. O cliente recém-criado pode ser selecionado no Sales Workspace sem reiniciar itens, descontos ou observações.

**Permissões e auditoria.** As permissões canônicas são `customers.read`, `customers.create`, `customers.update`, `customers.archive`, `customers.view_sales`, `customers.view_financial`, `customers.manage_dependents` e `customers.export`. Leitura e mutação são validadas no servidor; criação, atualização, ativação, inativação, arquivamento, alteração de endereço/documentos e manutenção de dependentes entram no histórico/auditoria central.

**Analytics e integrações.** Sales e Finance permanecem autoridades de seus próprios fatos. Customer expõe dimensões e relações para cliente ativo, cliente recorrente, última compra, ticket médio, origem e saldo em aberto. A tela consulta projeções oficiais: não recalcula vendas nem recebíveis no navegador. CRM futuro consome o Customer, mas não altera sua ownership.

**CRM futuro.** Leads, pipeline, negócios, agenda, tarefas, email, WhatsApp e automações são V2/V3. Não serão simulados como funcionalidades atuais; precisam de fontes de comunicação, consentimento, ownership e timeline próprios.

### 4.3 Catálogo, produtos, variantes, categorias, marcas e atributos

**Objetivo.** Oferecer uma identidade comercial pesquisável e consistente para tudo que é vendido ou comprado.

**Responsabilidades.** Product simples ou variável; Variant como unidade identificável/vendável; Category hierárquica no limite aprovado; Brand; Attribute Definition, Attribute Value e assignment de variante; projeção de busca estruturada.

**Telas.** Visão do Catálogo, Produtos, Product Registration Workspace, Produto/Variante, Categorias, Marcas, Atributos e Listas de Preço.

**Regras.** Produto não contém saldo nem preço. SKU e barcode pertencem à variante. Atributos são dinâmicos, não colunas fixas. Arquivamento preserva integridade. Busca, paginação, ordenação e filtros combináveis são server-side.

**KPIs e relatórios.** Produtos ativos/inativos, variantes, estoque por categoria/marca/atributo, itens sem saldo, giro e ranking comercial somente quando as projeções de Sales e Inventory suportarem a métrica.

### 4.4 Pricing

**Objetivo.** Ser a única autoridade para resolver preço de venda de uma variante em uma data e tabela de preço.

**Telas.** Workspace de Pricing: Tabelas, Itens e Consulta.

**Regras.** Price list possui moeda, status e vigência; item liga Price List à Variant, com preço de venda, mínimo e vigência. Não existem preços concorrentes no Product, Variant, Sales ou Purchase. Conflitos de vigência são impedidos por constraints.

**Ações e filtros.** Criar/editar/arquivar tabela e item, buscar por tabela, produto, variante ou SKU, filtrar por status e tabela.

### 4.5 Compras, fornecedores e recebimentos

**Objetivo.** Planejar a aquisição, registrar o recebimento físico e manter rastreabilidade até estoque e obrigações futuras.

**Telas.** Fornecedores, Workspace de Purchase Orders, detalhe de pedido, Recebimentos, consulta e histórico.

**Fluxo principal.** Fornecedor → pedido em rascunho → enviado → confirmado → recebimento parcial ou total → encerramento do pedido quando todas as quantidades forem recebidas. Cancelamento é lifecycle explícito, não exclusão.

**Regras.** Itens de compra congelam Variant, unidade e preço resolvido pelo contrato vigente. Recebimento nunca excede quantidade pendente; conclusão cria movimento `INBOUND_PURCHASE` no Inventory Ledger de forma idempotente e atômica. Compra não ajusta saldo diretamente.

**Futuro aprovado.** Devolução a fornecedor, divergências, código de barras no recebimento, custos, aprovação, cotação e contratos dependem de sprint e regras próprias.

### 4.6 Estoque

**Objetivo.** Expor disponibilidade confiável por variante e local, usando fatos append-only como base.

**Telas.** Visão de Estoque, locais, movimentos, transferências, reservas, picking, packing, shipment e reconciliação conforme maturidade do módulo.

**Regras.** Inventory Ledger é a fonte da verdade; saldos e disponibilidade são projeções derivadas. Movimentos críticos são atômicos, idempotentes, auditados e tenant-aware. Reservas não alteram on-hand; picking/packing não geram movimento físico até que o contrato de shipment determine o momento.

**KPIs.** Unidades disponíveis, reservadas, comprometidas, baixo estoque, ruptura, entrada/saída/ajuste por período e valor apenas quando valuation estiver oficialmente entregue.

### 4.7 Vendas

**Objetivo.** Conduzir a venda do contexto comercial ao pedido rastreável, mantendo snapshots e preços verificáveis.

**Telas.** Cotações, Pedidos, Sales Order Workspace, detalhe, lifecycle, histórico e busca.

**Fluxo principal.** Cotação: Draft → Sent → Approved/Rejected/Expired → Archived. Pedido: Draft → Confirmed/Cancelled → Archived, somente quando o lifecycle real permitir. O Workspace cria/edita pedido com cliente, itens, preço, desconto autorizado, totais, observações e persistência de rascunho.

**Regras.** Cliente, produto, variante, SKU, descrição, unidade e preço são snapshots. O browser não é autoridade monetária: backend revalida preço, desconto, tenant, disponibilidade e transição. Criar cliente contextual preserva todos os campos do pedido.

**Limites atuais.** Vendedor, canal, loja, entrega, condição de pagamento e conclusão só podem ser persistidos após contratos aprovados. Reserva, estoque, fiscal, cobrança e recebimento não são antecipados por interface.

### 4.8 Financeiro, contas e caixa

**Objetivo.** Transformar obrigações e liquidações em uma visão coerente de vencimentos e caixa, sem saldo financeiro paralelo.

**Telas.** Finance Workspace, Contas a Pagar, Contas a Receber, Pagamentos, Caixa e timeline financeira, conforme maturidade.

**Modelo alvo.** Payable e Receivable possuem título, parcelas, lifecycle, histórico e projeção. Payments alocam e revertem fatos financeiros. Cash Account e Cash Ledger registram créditos, débitos e reversões append-only; saldo é derivado do ledger.

**Fluxos.** Obrigação criada → aberta → liquidada parcial/totalmente → lançamento de caixa idempotente → estorno append-only quando necessário. Uma integração não pode gerar duplicidade nem alterar diretamente saldo ou título fora dos commands oficiais.

**Contrato operacional.** Receivables e Payables possuem parcelas, liquidação parcial por `PaymentAllocation`, cancelamento sem alocação ativa e histórico. Payment é fato efetivo (`receipt` ou `disbursement`) e não previsão. CashAccount usa somente `cash`, `checking` e `investment`; PIX é método, não conta. CashLedger é imutável com `credit`, `debit` e `reversal`; transferência é um par atômico debit/credit e não entra na visão consolidada operacional. Toda operação financeira tem organização, empresa, filial e ator; a filial nunca é nula. Fluxo realizado deriva do ledger, previsto deriva de títulos abertos por vencimento e projetado combina saldo realizado com previsões futuras. Conciliação, bancos, juros, multas, descontos e abatimentos permanecem fora do escopo.

### 4.9 Fiscal

**Objetivo.** Preparar classificação, regras e documentos fiscais internos sem prometer emissão ou cálculo tributário antes do escopo autorizado.

**Telas alvo.** Perfis, Operações, Regras, Simulador Fiscal, Documentos e Consulta.

**Modelo alvo.** Tax Profile, Fiscal Classification por Variant, Fiscal Operation, Tax Rules, Tax Engine e Fiscal Document com item snapshot. O Fiscal Source Contract reduz acoplamento entre Sales, Receiving, Returns e Transfer.

**Fora da versão atual.** NF-e/NFC-e/NFS-e, XML, DANFE, certificados, SEFAZ, SPED e cálculo monetário de impostos.

### 4.10 Administração, permissões, auditoria e configurações

**Objetivo.** Governar empresa, membros, papéis, acesso e rastreabilidade sem misturar administração com rotina operacional.

**RBAC.** Chaves de permissão, não verificações rígidas por papel. Papéis são conjuntos de chaves; escopo de organização é obrigatório. Evoluções previstas: papéis customizados, segregação de funções, escopos e administração de convites.

**Auditoria.** Toda mutação relevante registra actor, organização, entidade, ação, antes/depois seguro, data e correlação quando aplicável. Histories de aggregate não são substituídos por uma tela global de audit.

### 4.11 Relatórios, busca e integrações

**Busca.** Command Palette e buscas de módulo usam projeções oficiais e respeitam permissão/tenant. Busca não é fonte de verdade.

**Relatórios obrigatórios por evolução.** Vendas por período/produto/marca/vendedor; estoque por produto/variante/local; entradas, saídas e ajustes; compras/fornecedor/recebimento; vencimentos a receber/pagar; caixa por origem; fiscal por operação/perfil quando suportado.

**Integrações futuras.** PIX, bancos/OFX, NF-e/NFC-e, Correios, WhatsApp, email, API, webhooks, marketplaces e e-commerce. Cada uma exige owner, idempotência, outbox, segurança, observabilidade, reconciliação e política de falhas antes de UI comercial.

## 5. Fluxos operacionais transversais

| Fluxo | Fonte | Resultado | Garantias |
|---|---|---|---|
| Venda | Cliente + Variant + Pricing | Pedido comercial e snapshots | preço/tenant/lifecycle validados; sem efeitos não aprovados |
| Compra | Fornecedor + Variant + preço contratado | Purchase Order | lifecycle e histórico append-only |
| Entrada | Purchase Order confirmada | Goods Receiving + ledger inbound | quantidade pendente, lock, idempotência e rollback |
| Saída/transferência | Operação de estoque autorizada | movimento de ledger | atomicidade e reconciliação |
| Reserva | Pedido elegível | disponibilidade comprometida | não altera on-hand; lock determinístico |
| Recebimento financeiro | Título liquidado | Cash Entry credit | somente após settlement confirmado |
| Pagamento financeiro | Obrigação liquidada | Cash Entry debit | append-only e reversível por reversal |
| Cancelamento | Documento com lifecycle permitido | evento/histórico e reversão definida | nunca exclusão silenciosa |
| Devolução | Documento origem elegível | documento de retorno + fatos derivados | escopo próprio; não inferir regras |

## 6. Dashboard, indicadores e relatórios

### Dashboard Executivo

O Dashboard Executivo concentra cards acionáveis, gráficos úteis, rankings e exceções. Seus filtros oficiais são período, organização e dimensões suportadas. Períodos padrão: hoje, ontem, 7/15/30/90 dias, mês atual/anterior, trimestre, ano e intervalo personalizado.

Cada card precisa declarar: fonte, período, filtro, status de qualidade de dados e destino de drill-down. Gráficos prioritários: linha de faturamento, barras de categoria/marca, ranking horizontal de produtos/vendedores e evolução de estoque. Pizza só é usada quando a composição é a pergunta do usuário.

### Catálogo de indicadores

| Dimensão | Indicadores prioritários |
|---|---|
| Produto/variante | vendas, unidades, disponibilidade, ruptura, giro, última venda |
| Marca/categoria | faturamento, unidades, participação, cobertura e capital imobilizado quando suportado |
| Cliente | compras, recorrência, aberto a receber e histórico comercial |
| Vendedor | valor vendido, pedidos, ticket médio e participação; sem comissões não implementadas |
| Fornecedor | pedidos, recebimentos, pendências e devoluções |
| Estoque | on-hand, reservado, disponível, entradas, saídas, ajustes e baixo estoque |
| Financeiro | vencido/vence hoje/7/30 dias, entradas, saídas e caixa por origem |
| Empresa | faturamento, pedidos, clientes, catálogo, obrigações e prioridades |

## 7. UX, navegação e telas

### Navegação

O menu principal deve permanecer curto: Central, Métricas, Catálogo, Clientes, Compras, Estoque, Vendas, Financeiro e Configurações. Subáreas vivem em tabs e Workspaces, não em hubs intermediários. Linguagem é operacional: “Contas a receber”, não nomes internos de domínio.

### Estrutura de Workspace

1. cabeçalho com título, status, identificação e ações;
2. resumo com indicadores essenciais;
3. abas de documento, itens, relacionamento, histórico e dados complementares;
4. ações rápidas próximas ao contexto;
5. loading, empty, error, forbidden e sucesso explícitos.

### Componentes e regras de interação

- tabela para trabalho denso; cards para resumo e mobile;
- filtros progressivos, server-side, paginados e persistentes quando úteis;
- página para criação/edição complexa; drawer para criação contextual; modal apenas para confirmação ou ação breve;
- timeline append-only para fatos; não usar notas soltas como substituto;
- acessibilidade WCAG AA, foco visível, teclado, labels, mensagens associadas e movimento reduzido;
- responsividade reorganiza ações e densidade; não apenas encolhe tabelas.

## 8. Modelo de dados e integração técnica

| Domínio | Entidades/fatos principais | Integrações permitidas |
|---|---|---|
| Catalog | Product, Variant, Category, Brand, Attribute, AttributeValue | Pricing, Sales, Purchasing, Inventory por contratos |
| Pricing | PriceList, PriceListItem, preço resolvido | Sales e Purchasing consultam; não recalculam |
| Sales | Quotation, SalesOrder, itens e snapshots | Customer, Catalog, Pricing; Inventory/Finance/Fiscal por eventos aprovados |
| Purchasing | Supplier, PurchaseOrder, itens/snapshots | Catalog/Pricing; Receiving por contrato |
| Inventory | Location, Ledger, Balance Projection, Reservation | Variant e documentos de origem; jamais saldo paralelo |
| Finance | Payable, Receivable, Payment, CashAccount, CashLedger | eventos de liquidação; nunca escrita direta de saldo |
| Fiscal | TaxProfile, Operation, Rule, Document, snapshots | Fiscal Source Contract e Tax Engine |
| Platform | Organization, Membership, Role, Permission, Audit | transversal, sem depender de domínio de negócio |

Toda mutação segue: autenticar → resolver tenant/actor → autorizar → validar invariantes/lifecycle → transacionar quando necessário → auditar → emitir evento → atualizar projeções. Queries usam read models e paginação; dados históricos dependem de snapshots e ledgers.

## 9. Roadmap de produto

### V1 — Operação comercial confiável

Consolidar Catalog/Variants, Pricing, Customer Workspace, Sales Order, Purchase Order, Goods Receiving, Inventory Ledger, Accounts Payable e Central de Comando. Fechar cutovers, rotas, permissões, RLS, auditoria, operações idempotentes e métricas baseadas em fatos.

### V2 — Ciclo financeiro e controle de gestão

Implementar Accounts Receivable, Payments, Cash Flow, settlement, timelines financeiras, relatórios operacionais, filtros avançados de catálogo/estoque e drill-down executivo. Introduzir CRM operacional (pipeline, tarefas e agenda) após definir ownership e consentimento.

### V3 — Integrações e expansão de operação

Concluir devoluções, aprofundar fulfillment autorizado, importação/exportação assíncrona, API/webhooks, email/WhatsApp por consentimento e integrações de e-commerce/marketplace com outbox e reconciliação.

### Enterprise

Fiscal document e provedores, cálculo tributário autorizado, emissão fiscal, múltiplos locais/depósitos avançados, lotes/séries/validade, custos e valuation, papéis customizados/SoD, auditoria global, SSO, observabilidade, retenção, relatórios exportáveis e dimensões analíticas.

## 10. Governança de evolução

Uma proposta entra na fila somente quando descreve: problema, persona, resultado mensurável, módulo proprietário, dependências, dados, lifecycle, permissões, tenancy, auditoria, UX, métricas, filtros, impactos em integração, estratégia de falha e testes. Se algum desses pontos for desconhecido, a entrega vira descoberta/ADR, não implementação.

O checklist antes de aprovar uma tela é: reduz cliques? preserva contexto? usa fonte de verdade? mantém a navegação curta? escala com milhões de registros? respeita tenant/permissões? deixa explícito o que ainda não existe?

## 11. Fontes complementares obrigatórias

- [Visão de Produto](./00_PRODUCT_VISION.md) e [Product Design](./03_PRODUCT_DESIGN.md);
- [Arquitetura](./01_PROJECT_ARCHITECTURE.md), [Domain Guide](./06_DOMAIN_GUIDE.md) e [Architecture Decisions](./08_ARCHITECTURE_DECISIONS.md);
- [UI Guidelines](./04_UI_GUIDELINES.md) e [Module Status](./MODULE_STATUS.md);
- [Roadmap](./07_ROADMAP.md), ADRs e documentação específica de cada módulo.

## Contratos fundamentais aprovados

**Branch.** `Branch` é a unidade operacional de uma Organization. Uma organização possui ao menos uma filial ativa e exatamente uma filial padrão; `NULL` nunca representa filial.

**Payment Term.** `PaymentTerm` descreve a expectativa de cobrança, nunca um pagamento realizado. Seus percentuais e prazos determinam parcelas previsíveis para futuros títulos de Contas a Receber; caixa permanece afetado apenas por liquidação confirmada.

**Inventory Policy.** `InventoryPolicy` é uma configuração explícita, única e pertencente à Organization. Ela define estoque negativo, reserva e baixa automáticas, confirmação sem saldo e reserva parcial. Nenhum fluxo deve codificar essas decisões como constantes locais.
