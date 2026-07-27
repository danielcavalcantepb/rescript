# ERP SaaS — Revisão de Arquitetura de Produto

## 1. Parecer executivo

O Rescript possui uma fundação técnica mais disciplinada do que a maioria dos ERPs em estágio inicial. Multi-tenancy, ownership de domínio, snapshots históricos, ledger, idempotência, RLS, permissões granulares e auditoria append-only foram tratados como fundamentos, não como correções posteriores. Isso cria uma vantagem real: o produto pode crescer sem destruir a confiabilidade dos dados.

Como produto, porém, ele ainda está entre uma plataforma transacional bem arquitetada e um ERP operacional integrado. Catalog, Inventory, Customers, Suppliers, Purchase, Receiving e Accounts Payable têm modelos de domínio coerentes e telas utilizáveis, mas a experiência ainda é predominantemente orientada a entidades e estados internos. O usuário precisa conhecer onde cada objeto mora, abrir detalhes sucessivos e interpretar relações que o sistema deveria sintetizar.

O maior risco não é falta de funcionalidades isoladas. É o produto evoluir como uma coleção de bons módulos, cada um com lista, detalhe, formulário e histórico, sem formar um ambiente de trabalho contínuo. Um ERP enterprise não é percebido pela quantidade de menus; é percebido quando uma operação completa — comprar, receber, conferir, pagar, auditar e agir sobre exceções — acontece com contexto preservado, poucos desvios e rastreabilidade imediata.

O produto já tem o esqueleto correto para isso. A próxima evolução deve concentrar-se em cinco frentes:

1. transformar a Home em Central de Decisão baseada em dados reais;
2. transformar detalhes de entidades em workspaces orientados a tarefas;
3. concluir os ciclos operacionais ainda abertos, especialmente Sales, contas a receber, pagamentos e fechamento financeiro;
4. unificar navegação, busca e produtividade transversal;
5. comprovar escalabilidade e operação enterprise com métricas, jobs, exportação, observabilidade e governança.

### Diagnóstico de maturidade

| Dimensão | Avaliação | Leitura crítica |
|---|---:|---|
| Fundação arquitetural | Excelente | Modularidade, tenant, domínio e integridade foram priorizados corretamente. |
| Integridade transacional | Muito boa | Inventory e Receiving são fortes; ainda há operações multi-repository que precisam da mesma atomicidade. |
| Cobertura funcional ERP | Parcial | O ciclo de compras existe, mas vendas, recebíveis, pagamentos, fiscal, conciliação e reporting operacional ainda não fecham o ERP. |
| Coerência da navegação | Regular | O menu atual mistura linguagem técnica, módulos, subdomínios e caminhos legados. |
| Produtividade operacional | Regular | Há busca local, command palette e ações rápidas, porém pouca edição em massa, contexto cruzado e ação sobre exceções. |
| Experiência enterprise | Em formação | Visual calmo e consistente, mas falta densidade informacional controlada, workspaces, filas de trabalho e visão por papel. |
| Escalabilidade técnica | Promissora, não comprovada | O modelo suporta crescimento; falta evidência operacional para volumes altos e catálogos/ledgers muito grandes. |
| Diferenciação competitiva | Alta em potencial | A Central de Decisão e a confiabilidade dos dados podem diferenciar; ainda não estão materializadas com dados reais. |

## 2. Referência conceitual de mercado

A comparação com Bling, Omie e Tiny mostra a importância de velocidade para PMEs: cadastros rápidos, operação fiscal/comercial acessível, integrações e baixo esforço inicial. A comparação com SAP Business One, Dynamics 365 Business Central e NetSuite mostra outro conjunto de expectativas: processos encadeados, drill-down até a origem, segregação de funções, dimensões analíticas, aprovações, rastreabilidade e operação por exceção.

O Rescript não deve copiar nenhum desses produtos. Deve combinar conceitos úteis em uma proposta própria:

- dos ERPs para PMEs: rapidez, linguagem humana, onboarding curto e execução sem consultoria pesada;
- dos ERPs enterprise: integridade, cadeia documental, auditabilidade, controles, trabalho por papel e capacidade de crescer;
- da visão própria do Rescript: Central de Decisão calma, explicável e acionável, sem virar um painel de BI ruidoso.

A oportunidade competitiva é ocupar o espaço entre “ERP simples que perde profundidade ao crescer” e “ERP poderoso que exige treinamento e parametrização excessivos”. A arquitetura suporta essa tese. O produto precisa tornar essa vantagem visível na jornada diária.

Princípios competitivos recomendados, dentro da arquitetura existente:

- uma entidade canônica por conceito, com estados em vez de aplicativos duplicados;
- navegação pela linguagem do operador, não pelos nomes dos bounded contexts;
- contexto e ações na mesma superfície;
- progressive disclosure: simples por padrão, profundo quando necessário;
- trilha completa entre documentos relacionados;
- exceções e pendências antes de relatórios genéricos;
- defaults fortes e configuração apenas quando muda uma decisão real;
- automação explicável, nunca “mágica” sem origem.

## 3. Avaliação dos módulos

### 3.1. Catalog

**O que está excelente**

- Ownership explícito de Product, Variant, Brand, Category, Attributes, UOM e Price List.
- Separação correta entre identidade comercial, preço e estoque.
- Produto simples com variante default evita dois modelos concorrentes.
- Policies de ativação, topologia, combinação, identificadores e resolução de preço reduzem inconsistências.
- Ports publicados e proibição de acesso cross-domain direto criam uma base enterprise sustentável.

**O que está bom**

- Lifecycle formal, arquivamento e auditoria específica.
- Estrutura extensível para atributos genéricos, sem branches por segmento.
- Busca e listagem separadas da reconstituição do aggregate.
- UI local do Catalog e páginas dedicadas para produtos e listas de preço.

**O que está incompleto**

- Brand, Category e Attribute ainda aparecem como áreas parcialmente placeholder.
- O workspace de produto não reúne de forma madura comercial, preços, disponibilidade, fornecedores, compras recentes e histórico operacional.
- A relação entre Catalog e o estoque legado ainda gera duas experiências mentais.
- Falta tratamento de grandes volumes: edição em massa, importação, duplicação assistida e manutenção por seleção.

**O que está faltando**

- taxonomia gerenciável com merge, prevenção de duplicidade e impacto da alteração;
- mídia e documentos do produto;
- unidades alternativas/conversões quando o domínio aprovar;
- composição de kits/bundles e produtos de serviço quando priorizados;
- qualidade do cadastro: completude, conflitos, produtos sem preço, sem categoria ou sem saldo inicial;
- bulk actions seguras e exportação do catálogo;
- visão de uso: onde a variante aparece, último preço, última compra e movimentação recente.

**O que deveria existir em um ERP profissional**

Um Product Workspace com cabeçalho persistente, status, ações válidas, resumo operacional e abas para “Visão geral”, “Variantes”, “Preços”, “Estoque”, “Compras”, “Histórico” e “Dados adicionais”. As abas devem consumir ports/read models dos domínios proprietários sem transformar Catalog em dono de estoque ou compras.

### 3.2. Products

**O que está excelente**

- A decisão de Product como família e Variant como identidade vendável/estocável é correta e madura.
- Snapshots protegem transações históricas de alterações posteriores no cadastro.

**O que está bom**

- Fluxos de criar, detalhar, editar, publicar, arquivar e restaurar.
- Formulário básico evita expor toda a complexidade no primeiro contato.

**O que está incompleto**

- Há coexistência entre o módulo `products` legado e o Product do Catalog.
- A ação rápida “Novo produto” ainda pode conduzir a caminhos legados.
- O cadastro simples separa preço e estoque inicial em passos que aumentam o tempo até o produto ficar operacional.

**O que está faltando**

- assistente de criação rápida que possa encadear preço e estoque inicial sem misturar ownership;
- duplicar produto/variante com revisão explícita de campos únicos;
- indicadores de prontidão: “rascunho”, “sem preço”, “sem estoque”, “pronto para vender”;
- atualização em massa de status, categoria e atributos;
- prevenção assistida de duplicidades por nome, SKU e código de barras.

**O que deveria existir em um ERP profissional**

Dois modos sobre os mesmos use cases: “Cadastro rápido” para produto simples e “Configuração completa” para famílias com variantes. O primeiro deve levar de nome a produto operacional em um fluxo curto; o segundo deve ser uma página/workspace, não uma sequência de dialogs.

### 3.3. Variants

**O que está excelente**

- Variante é filha do Product Aggregate e a unidade canônica para venda e estoque.
- Matriz cartesiana, hash canônico, preservação de variantes existentes e limites de segurança são decisões fortes.
- Eixos são dados configuráveis, não enums de segmento.

**O que está bom**

- Preview antes da aplicação da matriz.
- Lifecycle próprio e soft archive.
- Permissões granulares para leitura, criação, edição, arquivamento e configuração.

**O que está incompleto**

- A edição ocorre dentro do detalhe do produto, mas ainda não oferece uma grade operacional completa.
- Preço e estoque aparecem mais como resumos relacionados do que como contexto de decisão por variante.
- O histórico operacional ainda não impede/reorienta todas as alterações estruturais relevantes.

**O que está faltando**

- edição em grade de SKU, barcode, status e atributos;
- validação visual de combinações ausentes, duplicadas ou obsoletas;
- colunas configuráveis e filtros para centenas de variantes;
- comparação lateral de preço, saldo e atividade;
- ações em massa com preview de impacto;
- suporte eficiente a scan de código de barras.

**O que deveria existir em um ERP profissional**

Uma Variant Workbench dentro do produto: tabela densa, navegável por teclado, com filtros, bulk edit e side panel para a variante selecionada. Operações de matriz complexas devem ocorrer em página ou painel largo; modal deve ficar apenas para confirmação do conjunto a aplicar.

### 3.4. Pricing

**O que está excelente**

- Price List é a única fonte do preço; não há preço duplicado em Product/Variant.
- Resolução considera vigência, prioridade, lista default e moeda.
- Histórico de preços append-only e snapshots nas transações preservam a verdade histórica.

**O que está bom**

- Lifecycle e permissões específicas.
- Página própria para listas e ligação com variantes.
- Modelo preparado para múltiplas listas sem contaminar Sales.

**O que está incompleto**

- A experiência é orientada à lista individual, não à gestão comercial de preços em escala.
- Falta visualização de cobertura: variantes sem preço, preço expirando, conflitos de vigência e diferenças entre listas.
- Não há workflow de revisão/aprovação de alterações relevantes.

**O que está faltando**

- reajuste em massa por percentual/valor com preview;
- importação e exportação de tabela de preços;
- simulação “como este preço será resolvido?” com explicação;
- margens e custo como informação de apoio, sem transferir ownership;
- políticas futuras de canal, cliente, quantidade e promoção, apenas quando os casos reais exigirem;
- agendamento e aprovação para mudanças sensíveis.

**O que deveria existir em um ERP profissional**

Um Pricing Workspace com grade variante × lista, cobertura, vigência, conflitos, simulação e histórico. Alterações em massa devem ser jobs auditáveis, com preview e possibilidade de cancelar antes do commit.

### 3.5. Inventory

**O que está excelente**

- Ledger append-only, projeção de saldo, idempotência, locks e reversals.
- Transferência atômica com correlação e identidade variant × location.
- Separação correta entre físico, reservado e disponível na visão de domínio.
- Movimentos nunca são apagados ou editados silenciosamente.

**O que está bom**

- Locations, Items, availability e histórico.
- Entradas, saídas, ajustes, transferências e reversões com permissões próprias.
- Integração de Receiving pelo caminho correto: movimento no post, não ao editar o rascunho.

**O que está incompleto**

- O produto ainda convive com estoque legado product-scoped e o ledger variant-scoped.
- Reservas ainda não estão materializadas no fluxo real.
- Falta uma visão clara de exceções: negativo iminente, divergência, item sem location, baixa rotatividade e necessidade de reposição.
- O usuário alterna entre detalhe da variante, items, locations e movements para formar contexto.

**O que está faltando**

- reservas, liberação, consumo e expiração;
- contagem/inventário físico com divergências e aprovação;
- lotes, séries e validade quando o mercado-alvo exigir;
- políticas de estoque mínimo, máximo, ponto de reposição e lead time;
- transferências em trânsito e confirmação de destino para operação multi-local;
- valuation/custo médio plenamente integrado ao recebimento e financeiro;
- importação por coletor/barcode e work queue de exceções;
- relatórios de posição, giro e rastreabilidade.

**O que deveria existir em um ERP profissional**

Um Inventory Control Center com saldos por local, disponibilidade, itens críticos e tarefas pendentes. O detalhe da variante deve mostrar saldo consolidado e por local; o detalhe do local deve mostrar capacidade operacional; a lista de movimentos deve permitir drill-down até documento de origem e reversal.

### 3.6. CRM

**O que está excelente**

- Customer como aggregate tenant-scoped, PF/PJ imutável, documento validado, contatos, endereços, histórico e projeção de busca.
- O cadastro preserva integridade sem exigir documento para começar.

**O que está bom**

- Fluxo curto de criação e busca.
- Lifecycle explícito e ausência de hard delete.
- Permissões separadas para cadastro, contatos e endereços.

**O que está incompleto**

- O módulo é um cadastro de clientes, não um CRM completo — e isso não é um problema, desde que o nome não prometa pipeline, atividades e relacionamento.
- O detalhe ainda é um conjunto de seções cadastrais e histórico técnico.
- Falta contexto comercial real porque Sales ainda não está implementado.

**O que está faltando**

- visão 360 com vendas, recebíveis, última interação e risco;
- timeline humana consolidada, não apenas nomes de eventos internos;
- notas, tarefas e responsáveis quando houver caso de uso validado;
- políticas de crédito e bloqueios, pertencendo ao domínio apropriado;
- merge de duplicados e qualidade de dados;
- importação, exportação e consentimentos/LGPD operacionais.

**O que deveria existir em um ERP profissional**

Um Customer Workspace focado em relação operacional: resumo, contatos, endereços, vendas, financeiro e histórico. Se pipeline comercial não fizer parte do foco do produto, o menu deve chamar “Clientes”, não “CRM”.

### 3.7. Procurement

**O que está excelente**

- Cadeia conceitual Supplier → Purchase Order → Goods Receipt → Inventory → Accounts Payable.
- Snapshots preservam o documento histórico.
- Purchase não movimenta estoque; Receiving é a fronteira correta.
- Post de recebimento atômico e idempotente é comportamento enterprise.

**O que está bom**

- Numeração por organização, lifecycle, histórico e search projections.
- Compra com itens, totais de servidor e aprovação.
- Recebimento parcial/completo e fechamento do pedido.

**O que está incompleto**

- A cadeia existe como páginas separadas; ainda não se comporta como um processo único.
- Falta uma visão de pedidos abertos, atrasados, parcialmente recebidos e divergentes.
- Aprovação é uma transição simples, não um workflow por alçada.
- Não há requisição de compra, cotação ou planejamento de reposição.

**O que está faltando**

- fila de compras por exceção e status operacional;
- datas prometidas, lead time e acompanhamento de fornecedor;
- comparação pedido × recebido × faturado/contabilizado;
- tolerâncias de quantidade/preço e tratamento formal de divergências;
- aprovação por valor/categoria e substituição de aprovador;
- requisição e sugestão de compra quando justificadas pelo segmento;
- devolução ao fornecedor e reversal de recebimento;
- anexos/documentos e referências externas.

**O que deveria existir em um ERP profissional**

Um Procurement Workspace com overview e filas: “Precisa aprovar”, “Aguardando recebimento”, “Parcial”, “Com divergência”, “Pronto para pagar”. Cada Purchase deve exibir uma cadeia documental visual e ações contextuais para criar/abrir recebimentos e contas relacionadas.

### 3.8. Finance

**O que está excelente**

- Accounts Payable preserva snapshots de sua origem e parcelas explícitas.
- Totais, open balance e lifecycle não são reduzidos a booleans.
- A separação entre obrigação e pagamentos futuros está conceitualmente correta.

**O que está bom**

- Lista, detalhe, vencimentos, status, aprovação e cancelamento.
- Drill-down para Purchase e Receiving.
- Permissões específicas e histórico append-only.

**O que está incompleto**

- Finance hoje é essencialmente contas a pagar originadas de recebimento.
- Não há ciclo de contas a receber porque Sales ainda é mockado.
- Não há registro/alocação/estorno real de pagamentos, caixa, bancos ou conciliação.
- A Home de Finance não funciona como agenda financeira.

**O que está faltando**

- accounts receivable, payments e allocations;
- baixa parcial, múltiplas parcelas e reversals;
- contas bancárias/caixas, transferências e conciliação;
- fluxo de caixa previsto × realizado;
- aging de contas, inadimplência e agenda diária;
- despesas manuais e recorrências com governança;
- centros de custo/dimensões analíticas quando o produto atingir essa necessidade;
- fechamento de período e bloqueios operacionais futuros;
- exportações e integrações contábeis/fiscais.

**O que deveria existir em um ERP profissional**

Um Finance Workspace com “Hoje”, “A pagar”, “A receber”, “Movimentações”, “Conciliação” e “Fluxo de caixa”. O foco inicial deve ser agenda e exceções, não um dashboard com dezenas de KPIs. A conta deve oferecer ação de pagar/receber na própria linha ou side panel, respeitando segregação e confirmação.

### 3.9. Dashboard / Central

**O que está excelente**

- A visão documentada da Central de Decisão é diferenciada: atenção curada, explicação, confiança, origem e CTA.
- O princípio “não ser BI” protege o produto de dashboards decorativos.
- Estados de dados insuficientes e “Tudo sob controle” são honestos e coerentes com Data Trust.

**O que está bom**

- Shell visual calmo, blocos independentes, ações rápidas e estrutura responsiva.
- A Home já foi preparada para composição por módulos.

**O que está incompleto**

- A implementação atual é um Workspace institucional: status de sessão, permissões e sincronização ocupam espaço nobre.
- “Minha operação”, atividade recente e status ainda não refletem fatos reais do negócio.
- Não existe pulso real de vendas, compras, estoque e financeiro.

**O que está faltando**

- read models reais por papel e tenant;
- prioridades calculadas por impacto e prazo;
- CTAs que já abrem a tela filtrada e no contexto certo;
- feedback de resolução/dismiss e deduplicação;
- personalização por função sem virar dashboard builder;
- atualização parcial, freshness e explicação de dados atrasados.

**O que deveria existir em um ERP profissional**

A Home deve responder “o que preciso fazer agora?” em menos de dez segundos. Sinais técnicos devem ficar em observabilidade/suporte, não na home operacional. Owner, comprador, estoquista, vendedor e financeiro devem ver o mesmo produto, mas com prioridades coerentes com suas permissões e responsabilidades.

### 3.10. Navigation

**O que está excelente**

- Shell persistente, sidebar recolhível, topbar, organização ativa e command palette.
- Rotas profundas são tipadas e páginas ficam nos módulos.

**O que está bom**

- Mobile drawer, estado ativo e foco visível.
- Configurações e importação já estão tratadas como secundárias.

**O que está incompleto**

- A IA atual não corresponde à linguagem aprovada nos docs.
- O menu mistura “CRM”, “Procurement”, “Financeiro”, “Produtos”, “Catálogo”, “Estoque” e “Vendas”.
- Produtos e Catálogo parecem sobrepostos; CRM contém apenas Clientes; Procurement é inglês e abstrato para muitos usuários brasileiros.
- Itens não são filtrados por permissão diretamente na sidebar atual.

**O que está faltando**

- grupos estáveis, subnav contextual e badges de pendência curados;
- recentes e resultados reais na command palette;
- breadcrumbs e links de origem consistentes em toda cadeia documental;
- memória do estado da lista ao voltar de um detalhe;
- URLs canônicas após encerramento dos caminhos legados.

**O que deveria existir em um ERP profissional**

Uma navegação por áreas do trabalho, não por arquitetura: “Central”, “Vendas”, “Compras”, “Estoque”, “Produtos”, “Clientes”, “Financeiro”, e em área secundária “Importações”, “Relatórios/Auditoria” e “Configurações”. “Catálogo” pode ser o agrupador local dentro de Produtos, não necessariamente outro item global. “Procurement” deve aparecer como “Compras”. “CRM” deve ser “Clientes” enquanto não houver capacidades genuínas de CRM.

### 3.11. Permissões

**O que está excelente**

- Chaves `resource.action`, default-deny, defesa em UI e servidor e RLS como última barreira.
- Roles são presets e não condicionais espalhadas pela UI.
- Permissões são suficientemente granulares para separar leitura, criação, edição, aprovação, cancelamento e operações críticas.

**O que está bom**

- Gates lidam corretamente com loading, error e forbidden.
- O desenho permite evolução para custom roles sem reescrever os módulos.

**O que está incompleto**

- Ainda não há experiência administrativa completa para visualizar “quem pode fazer o quê”.
- Presets não expressam alçadas, escopo por local, limite monetário ou segregação de funções.
- Mudança de permissão em sessão e propagação operacional precisam ser percebidas com clareza.

**O que está faltando**

- matriz visual de permissões e explicações humanas;
- custom roles e cópia de preset quando houver demanda;
- escopo por location/unidade e limites de aprovação;
- políticas de maker-checker para operações críticas;
- relatórios de acesso e revisão periódica;
- convites, expiração e remoção com efeitos imediatos auditáveis.

**O que deveria existir em um ERP profissional**

Um Access Workspace para owners/admins com usuários, papéis, escopos, convites, alterações recentes e alertas de conflito de segregação. A UI deve traduzir chaves técnicas para capacidades compreensíveis sem perder a precisão do modelo.

### 3.12. Auditoria

**O que está excelente**

- Históricos e ledgers append-only protegidos no banco.
- Ator, ação, antes/depois, motivo e tenant fazem parte do contrato.
- Snapshots preservam contexto histórico e reversals evitam apagar fatos.

**O que está bom**

- Histórico já aparece em detalhes de vários aggregates.
- Separação conceitual entre audit, ledger, domínio e logs técnicos.

**O que está incompleto**

- As timelines exibem frequentemente action codes e mudanças técnicas, não narrativas operacionais.
- Não existe uma Audit Center transversal para investigação, exportação e filtros.
- IP/correlation e relação causal não estão uniformemente visíveis.

**O que está faltando**

- busca por ator, entidade, período, ação e severidade;
- cadeia causal entre pedido, recebimento, movimento e conta;
- exportação controlada e retenção definida;
- visualização antes/depois adequada a cada tipo de campo;
- alertas para ações sensíveis e acesso de suporte;
- trilha de approvals e delegações.

**O que deveria existir em um ERP profissional**

Uma Audit Center separada do histórico local. A timeline local responde “o que aconteceu com este registro”; a central responde “o que este usuário fez”, “por que este saldo mudou” e “quais operações críticas ocorreram”.

### 3.13. Workspace

**O que está excelente**

- A fundação prevê composição independente por blocos e respeito a permissões.
- A visão de Workspace evita uma home puramente institucional ou promocional.

**O que está bom**

- Greeting, ações rápidas e layout 2+1 são claros.
- A arquitetura permite trocar os placeholders por read models sem refazer o shell.

**O que está incompleto**

- O Workspace atual não conhece tarefas reais, prazos, exceções ou volume.
- Ações rápidas levam a listas em vez de iniciar diretamente a ação prometida em alguns casos.
- “Atividade recente” e “status da operação” ainda não produzem valor operacional comparável ao espaço ocupado.

**O que está faltando**

- filas pessoais/por papel;
- retomada de rascunhos e recentes reais;
- tarefas delegadas e aprovações pendentes;
- alertas de dados incompletos;
- atalhos contextuais por permissão e frequência;
- indicadores de freshness e falhas parciais.

**O que deveria existir em um ERP profissional**

Um cockpit diário por papel, com no máximo cinco prioridades, ações diretas e acesso aos objetos recentes. O Workspace não deve replicar os módulos; deve reduzir o custo de decidir onde entrar.

### 3.14. Search

**O que está excelente**

- Projeções de busca são reconstruíveis e separadas das fontes canônicas.
- Pesquisas são tenant-scoped e não reconstituem aggregates desnecessariamente.
- A command palette oferece uma superfície global apropriada.

**O que está bom**

- Busca local com debounce e filtros.
- Search ports preservam boundaries.

**O que está incompleto**

- A busca é fragmentada por módulo; a palette ainda é mais command launcher do que universal search.
- Não há ranking unificado, recentes, tolerância a erros ou apresentação por tipo.
- Ações rápidas nem sempre abrem o fluxo exato.

**O que está faltando**

- busca global por nome, número, documento, SKU, barcode e referência;
- resultados agrupados por tipo com metadados e status;
- autorização aplicada ao resultado e ao preview;
- keyboard navigation completa e quick preview;
- recentes, sugestões e comandos contextuais;
- estratégia de indexação/particionamento para catálogos grandes.

**O que deveria existir em um ERP profissional**

Uma busca operacional universal: digitar “PO-123”, CNPJ, SKU ou nome deve levar ao objeto correto sem o usuário escolher primeiro o módulo. A projeção global continua derivada e pode ser construída por eventos/read models sem violar ownership.

### 3.15. UX

**O que está excelente**

- Identidade visual calma, tokens consistentes, estados explícitos e linguagem de componentes bem documentada.
- Acessibilidade, keyboard, loading, empty, error e permission states foram considerados desde cedo.
- Progressive disclosure e uma ação primária por região são princípios corretos.

**O que está bom**

- Listas são legíveis, formulários têm labels e erros, dialogs confirmam descarte e operações mostram feedback.
- Layout responsivo é adequado ao uso desktop-first de ERP.

**O que está incompleto**

- Consistência visual não elimina fragmentação operacional.
- Muitos detalhes usam cards e seções empilhadas, exigindo scroll e leitura serial.
- Histórico técnico e labels internos reduzem a compreensão.
- Há pouca densidade configurável, poucas ações inline e escassa seleção em massa.

**O que está faltando**

- side panels para consulta rápida sem perder a lista;
- headers sticky com status e ações em workspaces longos;
- tabs orientadas a objetos irmãos reais;
- tabelas com colunas ajustáveis, ordenação, seleção e ações em massa;
- command shortcuts por fluxo, scan/barcode e navegação por teclado;
- preservação de filtros, scroll e seleção ao voltar;
- mensagens de concorrência, freshness e atualização por outro usuário;
- ajuda contextual e explicação de consequências antes de ações críticas.

**O que deveria existir em um ERP profissional**

Uma experiência de “alta densidade com baixa ansiedade”: muita informação relevante, hierarquia nítida, ações previsíveis e contexto preservado. Enterprise não significa telas carregadas; significa que o usuário consegue lidar com volume e exceções sem repetir navegação.

## 4. Avaliação da navegação atual

### O menu atual é adequado?

Ainda não. Ele é funcional para desenvolvimento e demonstração, mas não representa a melhor arquitetura de informação para o usuário final. A ordem atual privilegia os módulos recentemente implementados e expõe nomes internos. Também apresenta sobreposição entre “Produtos” e “Catálogo” e mantém “Estoque” legado separado da experiência nova de Catalog Inventory.

### Os agrupamentos fazem sentido?

Parcialmente. Financeiro, Estoque e Vendas são conceitos claros. CRM e Procurement são nomes de suíte/arquitetura, não necessariamente palavras de operação para o público brasileiro. Catalog contém produtos, preços e inventário, mas o menu também expõe Produtos e Estoque individualmente. Isso força o usuário a entender a composição técnica.

Agrupamento recomendado:

| Área global | Conteúdo local |
|---|---|
| Central | prioridades, recentes, aprovações, atalhos |
| Vendas | vendas/orçamentos/pedidos pelo mesmo objeto; futuramente devoluções |
| Compras | fornecedores, pedidos, recebimentos, divergências |
| Estoque | visão geral, itens, locais, movimentos, contagens |
| Produtos | produtos, variantes, listas de preço, categorias, marcas, atributos |
| Clientes | clientes e contexto comercial/financeiro |
| Financeiro | hoje, a pagar, a receber, pagamentos, conciliação, fluxo de caixa |
| Mais | importações, auditoria, relatórios e configurações |

Essa proposta altera apenas a arquitetura de informação e a composição de rotas/links no futuro; não muda bounded contexts nem ownership.

### Os nomes são intuitivos?

- “Central”, “Produtos”, “Estoque”, “Vendas” e “Financeiro”: sim.
- “Procurement”: não para a maioria dos usuários; usar “Compras”.
- “CRM”: excessivo enquanto o escopo é cadastro de clientes; usar “Clientes”.
- “Catálogo”: útil como conceito local de Produtos, mas redundante como item global ao lado de Produtos.
- “Receiving”: deve permanecer termo técnico interno; UX deve usar “Recebimentos” ou “Entrada por compra”.
- “Purchase”: UX deve usar “Pedido de compra”.
- “Accounts Payable”: UX já usa “Contas a pagar”, que é adequado.

### Existe excesso de telas?

O número absoluto ainda não é alto, mas há excesso de destinos concorrentes para os mesmos conceitos. O problema é fragmentação, não quantidade. Lista, detalhe e criação são justificáveis; placeholders e rotas legadas paralelas geram percepção de duplicidade.

### Existe excesso de cliques?

Sim, principalmente quando uma ação rápida apenas abre uma lista, quando o usuário precisa atravessar pedido → recebimento → conta em páginas separadas e quando informações básicas de preço/estoque exigem abrir detalhes distintos. O command launcher e os links entre documentos reduzem parte do custo, mas ainda não preservam o fluxo como uma única tarefa.

### A experiência parece enterprise?

Visualmente, começa a parecer uma aplicação empresarial moderna. Operacionalmente, ainda não. Para atingir esse nível, precisa suportar volume, filas, bulk actions, drill-down causal, aprovações, atalhos, reconciliação e workspaces por processo. Hoje a experiência é mais próxima de um ERP SaaS bem desenhado em construção do que de uma suíte enterprise completa.

## 5. Avaliação dos cadastros e workspaces

### Produto

É o cadastro mais próximo de um workspace real, porque reúne lifecycle, variantes e resumos relacionados. Ainda assim, a criação básica e a manutenção avançada parecem experiências diferentes. Deve evoluir para um Product Workspace com quick create e configuração completa, tabs estáveis, grade de variantes, preços, saldos e histórico contextual.

### Fornecedor

Hoje é um CRUD enriquecido: cadastro, contatos, endereços, status e histórico. Para virar workspace, precisa mostrar pedidos abertos, recebimentos, divergências, contas em aberto, prazo médio e ações “Novo pedido”/“Ver pendências”, sempre por read models/ports.

### Cliente

Também é um CRUD enriquecido. Virará workspace quando Sales e Receivables fornecerem contexto: última venda, ticket, saldo em aberto, vencidos, produtos recorrentes e timeline consolidada. Não deve virar um CRM genérico antes de existir demanda real por pipeline.

### Purchase

Já é mais que CRUD porque possui itens, snapshots, totais, aprovação e lifecycle. Falta torná-lo um workspace de execução: header sticky, progresso documental, recebido × pendente por item, divergências, documentos relacionados, recebimentos já feitos, conta associada e próxima ação recomendada.

### Receiving

É um documento operacional real e seu post é forte, mas a interação ainda depende de editar quantidade linha a linha em modal. Deve evoluir para uma workbench de conferência em grade, com entrada rápida por teclado/barcode, preenchimento em massa, divergências destacadas e resumo persistente antes do post.

### Direção comum

Um verdadeiro workspace possui:

- identidade e status sempre visíveis;
- próxima ação clara segundo lifecycle e permissão;
- contexto relacionado sem navegar para montar a história;
- tabs para dimensões irmãs, não para esconder qualquer seção;
- timeline humana e cadeia documental;
- ações inline e em massa proporcionais ao volume;
- filtros/estado preservados ao abrir e voltar;
- leitura rápida seguida de drill-down.

## 6. Superfícies de interação recomendadas

### Modais que devem permanecer modais

- confirmar publicação, aprovação, cancelamento, arquivamento, reversal ou post;
- informar motivo curto de ação crítica;
- editar um único valor simples e contextual, como quantidade recebida, apenas em baixo volume;
- confirmação de descarte;
- autorização excepcional, como desconto acima da alçada.

### Modais que deveriam virar páginas ou painéis

- criação de Customer/Supplier quando o formulário incluir identidade, contatos, endereços e dados fiscais; o quick create pode continuar modal com nome/documento/contato mínimo;
- configuração de matriz de variantes e manutenção em massa;
- criação/edição de pedido de compra com muitos itens;
- conferência de recebimento com diversas linhas;
- criação de conta a pagar com parcelamento editável;
- reajuste em massa de preços;
- importação e resolução de erros.

### Onde utilizar páginas

- qualquer documento com lifecycle, mais de cinco campos, múltiplas linhas ou consequência cross-domain;
- Product, Purchase, Goods Receipt, Sale, Payable/Receivable complexos;
- workbenches de preços, inventário físico, conciliação e importação.

### Onde utilizar abas

- Product: visão geral, variantes, preços, estoque, compras, histórico;
- Customer: visão geral, contatos/endereços, vendas, financeiro, histórico;
- Supplier: visão geral, contatos/endereços, compras, recebimentos, financeiro, histórico;
- Purchase: itens, recebimentos, financeiro/documentos, histórico;
- Inventory Item/Variant: saldos, movimentos, reservas, custos;
- Organization Settings: empresa, usuários, papéis, políticas, assinatura.

Abas não devem separar etapas sequenciais. Criação com etapas usa wizard curto; estados de processo usam status/progress, não tabs.

### Onde utilizar painéis laterais

- preview de Customer/Supplier/Product a partir de autocomplete;
- detalhe rápido de uma linha sem sair da lista;
- explicação de preço resolvido, saldo ou insight;
- filtros avançados;
- activity/history resumido;
- ações rápidas que não exigem edição extensa.

### Onde utilizar dashboards/workspaces

- Central: decisões e exceções cross-domain;
- Compras: fila por aprovação/recebimento/divergência;
- Estoque: itens críticos, contagens e movimentações pendentes;
- Financeiro: agenda, vencidos, caixa e conciliação;
- Vendas: rascunhos, propostas a vencer, pedidos pendentes e confirmações;
- Administração: usuários, segurança e integridade operacional.

## 7. Produtividade operacional

### Tarefas com cliques excessivos ou contexto fragmentado

- ações rápidas que levam à lista em vez de abrir diretamente a criação;
- cadastrar produto e depois navegar separadamente para preço e estoque inicial;
- abrir pedido, localizar/gerar recebimento, editar cada quantidade e depois navegar à conta;
- consultar preço e disponibilidade fora do contexto da variante;
- revisar histórico técnico em cada entidade sem visão causal consolidada;
- alternar entre Produtos/Catálogo/Estoque por causa dos caminhos legados;
- atualizar muitos itens/variantes/parcelas um por um.

### Simplificações prioritárias

- deep links de ação: “Novo cliente” abre quick create; “Nova entrada” abre o form correto;
- encadeamento pós-sucesso: produto criado → adicionar preço/estoque; PO aprovado → criar recebimento; receipt postado → gerar/revisar payable;
- command palette com objetos e ações reais;
- side panel de contexto e retorno à lista preservado;
- preenchimento em massa e defaults inteligentes;
- ações em linha para baixa complexidade;
- filas por exceção em vez de exigir busca manual.

### Atalhos recomendados

- `/` para focar busca local;
- `Ctrl/⌘+K` para busca/comandos globais;
- sequências `g` para navegar e `n` para criar, configuráveis/descobertas progressivamente;
- `Ctrl/⌘+S` para salvar rascunhos sem efeito crítico;
- setas/Enter para tabelas, autocomplete e workbenches;
- scan de barcode em Product/Inventory/Receiving/Sales;
- atalho de “adicionar nova linha” em documentos;
- ações críticas nunca disparadas por atalho ambíguo sem confirmação.

### Informações que devem aparecer sem abrir detalhes

- Produtos: status, variante/SKU, preço efetivo, saldo disponível, alertas de completude;
- Clientes: documento, contato principal, última venda, saldo vencido e status;
- Fornecedores: contato principal, pedidos abertos, próximo recebimento e saldo a pagar;
- Pedidos: fornecedor, total, aprovação, recebido/pendente, atraso e divergência;
- Recebimentos: pedido, local, linhas divergentes, total recebido e estado do post;
- Contas: fornecedor/cliente, valor, próximo vencimento, saldo e atraso;
- Estoque: físico, reservado, disponível, local, última movimentação e cobertura;
- Toda linha: indicador de pendência/risco apenas quando acionável.

## 8. Avaliação de escalabilidade

Escalabilidade deve ser dividida em capacidade arquitetural, capacidade do banco, capacidade da UX e prontidão operacional. A arquitetura permite crescer; isso não equivale a dizer que os volumes foram comprovados.

### 100 usuários

**Veredito:** arquiteturalmente preparado; operacionalmente precisa validação.

O modelo stateless de server functions, Supabase Auth, RLS, cache client-side e monólito modular suporta 100 usuários com folga em condições normais. Os riscos são pool/conexões no caminho SQL direto do Catalog, queries sem orçamento, invalidações amplas e ausência de load tests. Também é necessário observar concorrência real em edição, recebimento e estoque.

Requisitos para afirmar prontidão:

- load test de leitura, busca, mutations e picos de post;
- limites e telemetria do pool PostgreSQL;
- SLOs de latência/erro;
- optimistic concurrency em documentos editáveis;
- jobs pesados fora do request interativo.

### 500 empresas

**Veredito:** modelo multi-tenant adequado; operação SaaS ainda incompleta.

`organization_id`, índices tenant-first, RLS, membership e cache tenant-scoped são decisões corretas. O desafio passa a ser operação: onboarding em escala, suporte auditado, billing/entitlements, migrations seguras, monitoramento por tenant, quotas, backups/restores e tratamento de noisy neighbors.

Requisitos adicionais:

- métricas por tenant sem expor dados;
- rate limits e quotas;
- billing/entitlements;
- support access temporário e auditado;
- runbooks, backup/restore e incident response;
- rollout progressivo e feature flags operacionais.

### 50 milhões de registros

**Veredito:** não comprovado; exige evolução física dentro da mesma arquitetura.

PostgreSQL pode operar nessa ordem de grandeza, mas tabelas append-only como ledger e histories exigirão planejamento. Índices tenant-first ajudam, porém não bastam para retenção longa, busca ampla e relatórios.

Evoluções esperadas:

- particionamento por data e/ou hash de tenant para ledgers/histories quando métricas reais justificarem;
- índices parciais e cobertura por padrões de consulta;
- keyset pagination em todas as listas grandes;
- read models/materialized views para agregações;
- archive/retention por classe de dado;
- processamento assíncrono, filas e outbox;
- réplicas de leitura para reporting;
- EXPLAIN/slow-query budget e testes com cardinalidade realista;
- evitar contagens globais e offset pagination.

### Grandes catálogos

**Veredito:** modelo de domínio adequado; UX e search precisam amadurecer.

Variant-centric identity, projections e cursor são bons fundamentos. O gargalo provável será pesquisa textual, filtros combinados, manutenção em massa e carregamento de aggregates grandes. Um Product com centenas de variantes não pode ser sempre reconstituído integralmente para toda operação de leitura.

Necessidades:

- read models por caso de uso e carregamento parcial;
- índice de busca especializado quando PostgreSQL deixar de atender os SLOs, preservando `CatalogSearchPort`;
- virtualização de tabelas, paginação e bulk jobs;
- limites operacionais explícitos;
- importação/exportação assíncrona;
- métricas de completude e filas de manutenção.

### Grandes estoques

**Veredito:** integridade bem desenhada; escala de ledger não testada.

Locks por item/location, idempotência e projeção de saldo são apropriados. Em grande volume, hot variants, transferências, recebimentos massivos e relatórios históricos podem causar contenção.

Necessidades:

- testes de concorrência com hot keys;
- batches transacionais limitados e reprocessáveis;
- particionamento de movimentos;
- projeções de saldo sempre pequenas e indexadas;
- reconciliação automática ledger × saldo;
- jobs para valuation/reporting;
- observabilidade de lock waits, deadlocks e retries;
- políticas claras para multi-location e transferências em trânsito.

## 9. Roadmap recomendado

O roadmap prioriza fechamento de ciclos e produtividade. Não recomenda nova arquitetura nem expansão horizontal indiscriminada.

### Fase 0 — Coerência do produto e encerramento de legado

**Prioridade: imediata.**

- definir URLs e navegação canônicas;
- renomear a IA para linguagem operacional;
- encerrar visualmente a duplicidade Produtos/Catálogo e estoque legado/novo;
- garantir que quick actions abram o fluxo correto;
- marcar claramente áreas mock/placeholder;
- consolidar padrões de workspace e cadeia documental.

**Justificativa:** construir novos módulos sobre uma IA ambígua multiplica confusão e retrabalho. Esta fase não altera domínio; alinha a superfície ao produto real.

### Fase 1 — Sales transacional completo

**Prioridade: crítica.**

- Sale único com estados rascunho, orçamento, pedido, confirmada e terminais;
- itens por variant, snapshots e preço resolvido;
- reservas no estado de pedido;
- confirmação atômica com estoque e criação de receivable;
- cancelamento/reversal conforme matriz de decisão;
- descontos e autorização por alçada;
- Sale Workspace e timeline causal.

**Justificativa:** sem Sales real, o ERP não fecha seu principal ciclo de valor, a Central não possui pulso comercial e Customer permanece apenas cadastro.

### Fase 2 — Finance completo: receber, pagar e movimentar

**Prioridade: crítica, após ou em coordenação controlada com Sales.**

- Accounts Receivable e installments;
- Payment, Allocation e Reversal;
- baixa parcial e idempotência;
- pagamentos de Accounts Payable;
- agenda financeira e aging;
- contas bancárias/caixas mínimos e fluxo previsto × realizado.

**Justificativa:** transforma documentos comerciais em verdade financeira e completa a proposta central de confiança nos números.

### Fase 3 — Workspace e Central de Decisão com dados reais

**Prioridade: alta.**

- read models de “Hoje”, pendências e próximos dias;
- filas por papel;
- rascunhos/recentes reais;
- insights determinísticos iniciais: vencidos, baixo estoque, pedidos atrasados e divergências;
- CTAs deep-linked e feedback de resolução;
- remover sinais técnicos da Home operacional.

**Justificativa:** é a principal diferenciação do produto e reduz navegação. Deve vir após dados transacionais suficientes para não fabricar inteligência.

### Fase 4 — Procurement profissional

**Prioridade: alta.**

- Procurement overview e filas;
- datas prometidas, atraso e lead time;
- cadeia PO → receipts → ledger → payable;
- divergências e tolerâncias;
- reversal/devolução de recebimento;
- approvals por valor/alçada;
- sugestão/requisição de compra apenas onde houver demanda validada.

**Justificativa:** o ciclo básico já existe; aprofundá-lo produz valor rapidamente e demonstra integração enterprise.

### Fase 5 — Inventory Control

**Prioridade: alta.**

- reservas reais;
- contagem física e ajustes aprováveis;
- mínimo/máximo/reposição;
- transferências em trânsito;
- custo médio/valuation completo;
- reconciliação automática;
- lote/série/validade somente conforme ICP.

**Justificativa:** estoque é fonte de confiança e pré-requisito para escala operacional. Deve amadurecer junto dos ciclos de Sales e Procurement.

### Fase 6 — Product, Pricing e dados em escala

**Prioridade: média-alta.**

- Product Workspace completo;
- Variant Workbench;
- pricing em massa, vigência e simulação;
- gestão real de categories/brands/attributes;
- import/export assíncrono;
- qualidade e deduplicação de cadastros;
- universal search.

**Justificativa:** após fechar os ciclos, o gargalo passa a ser manutenção eficiente do mestre de dados e grandes catálogos.

### Fase 7 — Administração enterprise

**Prioridade: média-alta.**

- custom roles, scopes, alçadas e segregação;
- Audit Center;
- suporte temporário auditado;
- billing/entitlements;
- políticas organizacionais;
- jobs, exports e retenção;
- observabilidade e SLOs.

**Justificativa:** necessário para centenas de empresas e equipes maiores, sem sobrecarregar o MVP antes dos ciclos operacionais estarem completos.

### Fase 8 — Fiscal, integrações e ecossistema

**Prioridade: dependente do mercado e da região.**

- boundary fiscal por adapters;
- documentos fiscais e status assíncronos;
- integrações bancárias, contábeis, marketplaces e logística;
- webhooks idempotentes e outbox;
- API pública versionada quando houver consumidores reais.

**Justificativa:** é decisivo para competitividade no Brasil, mas deve entrar por adapters e contratos após a verdade transacional estar consolidada.

### Fase 9 — Reporting operacional e dimensões analíticas

**Prioridade: posterior à qualidade dos fatos.**

- relatórios operacionais rastreáveis;
- exports agendados;
- margem, giro, aging, compras e fluxo de caixa;
- dimensões/centros de custo quando necessários;
- réplicas/read models para consultas pesadas.

**Justificativa:** relatórios só geram confiança quando ledger, snapshots e documentos de origem estão completos. O produto deve evitar virar BI antes de ser um ERP confiável.

## 10. Critérios para alcançar nível enterprise

O Rescript poderá ser considerado um ERP enterprise quando demonstrar, além da arquitetura atual:

- ciclos end-to-end completos e reconciliáveis;
- cadeia documental navegável e auditável;
- segregação de funções e alçadas;
- operação eficiente em lote e por exceção;
- busca global e produtividade por teclado;
- workspaces que preservam contexto;
- comportamento previsível sob concorrência e retry;
- suporte a volumes reais com SLOs e testes de carga;
- observabilidade, backup, restore, retenção e suporte seguro;
- relatórios que sempre levam ao fato de origem;
- configuração progressiva sem “painel de 200 parâmetros”;
- UX consistente para usuários ocasionais e operadores intensivos.

A direção recomendada não é adicionar dezenas de módulos rapidamente. É fechar processos, reduzir transições manuais e tornar a confiabilidade já presente na arquitetura visível em cada decisão do usuário. Esse é o caminho mais forte para competir conceitualmente tanto com ERPs acessíveis de PME quanto com suítes enterprise, sem copiar nenhum deles e sem abandonar a arquitetura própria do projeto.
