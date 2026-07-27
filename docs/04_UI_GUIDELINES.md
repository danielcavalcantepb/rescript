---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: 04_UI_GUIDELINES
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Diretrizes de Interface

## Responsabilidade deste documento

Este documento traduz Product Design em padrões visuais e de interação para layout, navegação, Workspaces, tabelas, forms, estados e responsividade.

## Linguagem visual

A interface segue o conceito **Quiet Instrument**: calma, precisa, organizada e adequada a trabalho prolongado. A marca não compete com os dados. Cor, sombra e motion comunicam hierarquia e estado, nunca decoração.

Usar exclusivamente tokens oficiais para cor, spacing, radius, elevation, motion e typography. Features consomem o catálogo de ícones e os components compartilhados.

## App Shell

### Sidebar

- contém identidade, organização ativa e áreas globais;
- pode ser recolhida no desktop e vira drawer no mobile;
- mostra apenas itens permitidos;
- usa labels operacionais em português;
- evita duplicidade entre área e subárea;
- badges exibem pendências curadas, não contadores de vaidade;
- configurações e importações ficam em área secundária.

### Topbar

- oferece busca/command palette;
- mantém acesso à conta e controles globais;
- pode exibir status global apenas quando acionável;
- não repete logo presente na sidebar;
- não vira feed de notificações.

### Conteúdo

- largura máxima protege leitura, salvo workbenches que exigem canvas amplo;
- gutters são responsivos;
- o conteúdo usa hierarquia e whitespace, não múltiplas caixas decorativas;
- headers ou barras de ação podem ficar sticky em Workspaces longos.

## Cabeçalhos

Todo Workspace possui:

- breadcrumb quando houver profundidade real;
- título/identidade;
- descrição ou metadados essenciais;
- status;
- uma ação primária por região;
- ações secundárias agrupadas;
- ações destrutivas visualmente separadas.

O cabeçalho deve continuar compreensível em loading parcial e em status somente leitura.

## Resumo e indicadores

- mostrar de três a cinco sinais relevantes;
- números usam alinhamento tabular e unidade/moeda explícita;
- indicadores levam ao detalhe de origem;
- cor não é o único sinal;
- evitar KPIs sem ação ou comparação significativa;
- não usar gráficos quando uma frase, número ou tabela comunica melhor.

## Abas

Usar para dimensões irmãs e persistentes de uma entidade, como Variantes, Preços, Estoque e Histórico. Não usar para etapas sequenciais, filtros simples ou para esconder um formulário gigante.

Regras:

- labels curtas e estáveis;
- URL/deep link quando a aba representa contexto importante;
- contadores apenas quando úteis;
- lazy loading sem perder contexto;
- permission-aware;
- mobile com scroll horizontal acessível ou padrão alternativo claro.

## Dashboards e Workspaces de área

- priorizam tarefas e exceções;
- têm poucos blocos de alto valor;
- não são BI builders;
- cada card/linha possui origem e ação;
- falhas parciais não derrubam toda a página;
- empty state orienta o próximo passo;
- dados insuficientes são exibidos com honestidade.

## Tabelas

Tabelas são a principal superfície de volume.

- cabeçalho claro e sticky quando necessário;
- colunas essenciais primeiro;
- números alinhados à direita com `tabular-nums`;
- sort por um critério explícito;
- busca e filtros acima da tabela;
- cursor/keyset para grandes conjuntos;
- row click não impede links e ações acessíveis;
- seleção e bulk actions para tarefas repetitivas;
- ações secundárias em menu; ação primária contextual visível;
- colunas configuráveis apenas quando o volume justificar;
- preservação de filtros, scroll e seleção;
- virtualização para grandes grades;
- mobile reordena prioridades ou usa cards, não apenas encolhe colunas.

## Cards

Cards agrupam informação ou interação real. Evitar card wall.

- um propósito por card;
- heading e hierarquia consistentes;
- borda/elevation discretas;
- cards clicáveis deixam ação evidente;
- Metric Card não usa verde automaticamente;
- Insight Card contém conclusão, explicação, tipo, impacto, origem/confiança e CTA.

## Formulários

- labels externas; placeholder não substitui label;
- helper e error associados ao campo;
- grupos semânticos pequenos;
- caminho comum primeiro e opções avançadas em disclosure;
- defaults seguros;
- moeda, quantidade e data com formato do domínio;
- double submit bloqueado;
- dirty state protegido contra descarte;
- ação primária no fim e, no mobile, sticky quando apropriado;
- erros do servidor voltam a campos e form alert;
- foco vai ao primeiro erro;
- concorrência mostra mensagem de reload, não merge silencioso.

Formulário com várias seções, linhas ou consequências usa página/Workspace.

## Modais, drawers e painéis

### Modal

Usar para decisão modal, confirmação, motivo curto ou edição rápida. Exige foco preso, Esc, título claro, consequência e cancelamento. Enter não confirma ação destrutiva por padrão.

### Drawer/side panel

Usar para detalhe rápido, preview, filtros avançados e edição curta sem perder a lista. Evitar drawers aninhados e forms extensos.

### Página

Usar para fluxos centrais, múltiplas linhas, lifecycle, edição extensa, Workspaces e operações cross-domain.

## Histórico e timeline

- traduzir action codes em linguagem humana;
- exibir ator, instante, ação, motivo e mudança relevante;
- relacionar documentos de origem e efeitos;
- before/after depende do tipo do campo;
- informações técnicas ficam em disclosure;
- timeline local não substitui Audit Center.

## Busca e command palette

- `Ctrl/⌘+K` abre busca global e comandos;
- `/` foca busca local quando não conflitar com input;
- resultados são agrupados por tipo, com status e metadados;
- suporte completo a teclado;
- busca aceita identificadores operacionais como número, documento, SKU e barcode;
- ações “Criar” abrem o fluxo específico;
- permissões filtram resultados e comandos.

## Estados obrigatórios

Toda página e bloco assíncrono considera:

- loading com skeleton da estrutura real;
- empty de primeiro uso;
- empty por filtro;
- error com retry quando seguro;
- forbidden com explicação;
- partial data;
- offline/degraded quando aplicável;
- stale/freshness quando relevante;
- organization suspended;
- no results;
- success feedback;
- concurrency conflict.

## Feedback

- toast de sucesso é discreto;
- erro persistente não desaparece antes de ser compreendido;
- undo só existe se o domínio permitir compensação segura;
- operações longas usam progress e podem gerar relatório;
- replay idempotente mantém o usuário no resultado correto;
- ação crítica descreve consequências concretas.

## Acessibilidade

O alvo é WCAG 2.2 AA:

- contraste adequado;
- focus visible;
- ordem de tab lógica;
- labels e descriptions;
- status não depende apenas de cor;
- loading/toast anunciados;
- overlays fecham com Esc;
- touch targets adequados;
- zoom de 200%;
- `prefers-reduced-motion` respeitado;
- nenhuma ação essencial depende só de hover.

## Responsividade

### Desktop

Superfície principal de operação intensa, tabelas e edição.

### Tablet

Mantém leitura e operações moderadas; sidebar pode recolher e drawers usam altura total.

### Mobile

Prioriza atenção, consulta e ações urgentes. Reordena conteúdo: pendências antes de visão geral. Operações complexas podem orientar uso em desktop em vez de oferecer experiência degradada.

## Checklist de UI

- segue tokens e components existentes?
- mantém uma ação primária?
- contexto importante está visível?
- superfície corresponde à complexidade?
- todos os estados foram desenhados?
- funciona por teclado e screen reader?
- funciona com volume alto?
- preserva contexto ao navegar?
- evita cards, tabs e modais sem necessidade semântica?
