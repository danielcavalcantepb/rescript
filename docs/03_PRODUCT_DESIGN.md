---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: 03_PRODUCT_DESIGN
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Product Design

## Responsabilidade deste documento

Este é o contrato permanente de experiência do ERP. Toda decisão de produto, navegação, interação ou Workspace deve respeitá-lo.

## Princípio central

O ERP é orientado à produtividade. O objetivo não é possuir muitas funcionalidades; é reduzir cliques, tempo, troca de contexto e erro operacional.

Toda funcionalidade deve demonstrar qual tarefa melhora, qual esforço remove e como se comporta em volume.

## Workspaces como unidade do produto

Cadastros simples não são a experiência final. Toda entidade importante possui um Workspace próprio, como Product, Customer, Supplier, Purchase, Sales e Financial Workspace.

Um Workspace apresenta, conforme o domínio:

- cabeçalho com identidade, status e ações válidas;
- resumo executivo;
- indicadores operacionais;
- relacionamentos e cadeia documental;
- histórico e últimas alterações;
- ações rápidas;
- abas para dimensões irmãs;
- estados de loading, error, empty, forbidden e dados parciais.

O usuário deve compreender a entidade antes de editar. Status, relacionamentos, alterações recentes e indicadores aparecem antes ou junto da ação de edição.

## Contexto permanente

O usuário não deve navegar para descobrir informações que pertencem à tarefa atual. Cada Workspace compõe contexto por read models e ports sem alterar ownership de domínio.

Exemplos:

- Product mostra preço efetivo e disponibilidade sem se tornar dono deles;
- Supplier mostra pedidos, recebimentos e saldo a pagar;
- Customer mostra vendas e situação financeira;
- Purchase mostra recebimentos, divergências e obrigações relacionadas;
- Financial document mostra documento de origem e cadeia causal.

Drill-down continua disponível, mas não é necessário para entender o estado básico.

## Velocidade e cliques

- operações frequentes ficam a um clique do Workspace, lista, Central ou command palette;
- ações rápidas abrem o fluxo exato, não uma lista genérica;
- pós-sucesso oferece a próxima ação natural;
- filtros, scroll e seleção são preservados ao voltar;
- informações essenciais aparecem na lista;
- ações em massa existem para tarefas de volume;
- keyboard e barcode são first-class em workbenches operacionais;
- operações perigosas mantêm confirmação proporcional ao risco.

Reduzir cliques não significa remover controles. Uma confirmação que evita perda ou efeito financeiro é produtiva. Um clique para navegar até informação que já poderia estar visível não é.

## Operações complexas não usam modais

Criação e edição complexas usam páginas ou painéis amplos. Produto, pedido, venda, recebimento com várias linhas, parcelamento e reajuste em massa não cabem em modal.

Modal é reservado para:

- confirmação;
- motivo curto;
- ação rápida de baixa complexidade;
- autorização excepcional;
- edição de um único valor contextual em baixo volume.

## Formulários

O ERP evita formulários gigantes. Usar:

- abas para dimensões irmãs de uma entidade existente;
- cards para agrupamentos semânticos pequenos;
- painéis para contexto e edição rápida;
- wizard curto para sequência real de criação;
- progressive disclosure para campos avançados;
- defaults seguros para reduzir configuração.

Abas não substituem etapas sequenciais. Wizard não deve ter etapas artificiais. O caminho comum mostra apenas o necessário para concluir a tarefa.

## Consistência entre telas

Todo Workspace segue a mesma gramática:

1. breadcrumb quando a profundidade justificar;
2. cabeçalho;
3. status e ações;
4. resumo/indicadores;
5. navegação local por abas quando necessária;
6. conteúdo operacional;
7. relacionamentos;
8. histórico.

A ordem pode variar quando o domínio exigir, mas os mesmos conceitos devem parecer e funcionar da mesma forma.

## Navegação

A navegação usa linguagem do usuário e áreas de trabalho:

- Central;
- Vendas;
- Compras;
- Estoque;
- Produtos;
- Clientes;
- Financeiro;
- áreas secundárias para Importações, Auditoria, Relatórios e Configurações.

Nomes de bounded contexts não são automaticamente labels de menu. Enquanto CRM representar apenas Customer, a label é “Clientes”. Procurement aparece como “Compras”. Catalog pode ser agrupamento local de Produtos, não item global duplicado.

Itens sem permissão são ocultos na navegação. Deep links negados explicam a restrição. Organização ativa permanece visível.

## Central de Decisão

A Home responde rapidamente:

- como está a operação hoje;
- o que exige atenção;
- o que vence ou pode falhar em breve;
- qual ação deve ser tomada.

Ela apresenta poucas prioridades, ordenadas por impacto e prazo. Todo insight informa origem, confiança e CTA. Dados insuficientes são declarados; o sistema não inventa precisão.

Sinais técnicos de sessão, permissão e sincronização pertencem a suporte/observabilidade e não ocupam a Home operacional, salvo quando bloqueiam o trabalho.

## Trabalho por papel e exceção

Owner, vendedor, comprador, estoquista e financeiro usam a mesma plataforma com prioridades diferentes. Permissões determinam conteúdo e ações; não devem criar produtos paralelos.

Workspaces de área apresentam filas como:

- precisa aprovar;
- aguardando recebimento;
- com divergência;
- vencido;
- baixo estoque;
- rascunho abandonado;
- falha que exige intervenção.

## Escalabilidade de experiência

Uma solução aceitável com dez registros pode falhar com dez mil. Toda tela deve considerar:

- busca e filtros;
- cursor/keyset pagination;
- seleção e ações em massa;
- virtualização quando necessária;
- colunas essenciais e configuráveis;
- jobs assíncronos para import/export/bulk;
- progress e relatório de erros;
- ausência de carregamento integral de aggregates grandes.

## Enterprise como experiência

O ERP deve transmitir controle, organização, confiabilidade e produtividade. Isso exige:

- estado e consequência explícitos;
- cadeia documental;
- histórico compreensível;
- permissões e approvals;
- precisão sem jargão;
- densidade informacional controlada;
- comportamento previsível sob concorrência e retry;
- contexto preservado.

Enterprise não significa card walls, telas cheias ou customização ilimitada.

## Checklist obrigatório de Product Design

Antes de aprovar uma solução:

- melhora produtividade?
- reduz cliques ou troca de contexto?
- mantém informações relevantes visíveis?
- usa Workspace em vez de CRUD para entidade importante?
- reserva modal apenas para ação simples?
- mantém a gramática visual e operacional?
- funciona com milhares de registros?
- respeita permissions, lifecycle e consequências?
- parece um ERP enterprise?

Resposta negativa exige reavaliação.
