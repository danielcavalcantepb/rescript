---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: 00_PRODUCT_VISION
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Visão de Produto do ERP

## Responsabilidade deste documento

Este documento define por que o produto existe, para quem é construído, como se posiciona e quais resultados deve produzir. Decisões de arquitetura, engenharia, domínio e interface devem servir a esta visão.

## Propósito

O Rescript é um ERP SaaS Enterprise criado para transformar dados operacionais confiáveis em execução rápida e decisões claras. Seu objetivo não é reunir o maior número possível de funcionalidades, mas permitir que empresas operem vendas, compras, estoque, clientes, fornecedores e finanças com controle, rastreabilidade e poucos cliques.

O produto deve responder continuamente a três perguntas:

1. O que está acontecendo na empresa?
2. O que exige atenção agora?
3. Qual é a próxima ação segura?

O ERP é a fonte operacional da verdade. Estoque, obrigações financeiras, documentos, históricos e indicadores devem ser explicáveis e rastreáveis até os fatos que os originaram.

## Público-alvo

O foco é em pequenas e médias empresas brasileiras que precisam de simplicidade no início e profundidade para crescer, sem migrar para outra plataforma ao aumentar volume, equipe, locais ou complexidade.

Os principais perfis são:

- proprietários e gestores que precisam de visão diária e confiança nos números;
- vendedores que precisam criar e concluir operações com velocidade;
- compradores que acompanham pedidos, recebimentos e divergências;
- operadores de estoque que trabalham com saldo, disponibilidade, locais e movimentos;
- equipes financeiras que administram vencimentos, pagamentos, recebimentos e caixa;
- administradores responsáveis por acesso, políticas e auditoria.

O produto é desktop-first para a operação intensa. Tablet e mobile priorizam consulta, alertas e ações urgentes seguras, sem fingir que cadastros complexos funcionam bem em telas pequenas.

## Posicionamento

O Rescript ocupa o espaço entre dois extremos:

- ERPs acessíveis que são rápidos no início, mas perdem profundidade, controle ou escalabilidade;
- suítes enterprise poderosas que exigem treinamento, parametrização e navegação excessivos.

O posicionamento desejado é: **profundidade enterprise com produtividade e clareza de um software moderno**.

Enterprise não significa mais telas ou mais parâmetros. Significa processos coerentes, segregação de funções, integridade transacional, contexto preservado, auditabilidade, desempenho em escala e capacidade de operar por exceção.

## Diferenciais permanentes

### Produtividade mensurável

Toda funcionalidade deve reduzir esforço, cliques, alternância de contexto ou risco de erro. Funcionalidade sem ganho operacional comprovável não é prioridade.

### Workspaces, não CRUDs

Entidades importantes possuem Workspaces próprios. Um Workspace reúne resumo, status, indicadores, relacionamentos, histórico e ações rápidas. O usuário não deve visitar várias telas apenas para compreender uma entidade.

### Central de Decisão

A Home não é um dashboard de vaidade. Ela prioriza fatos, projeções e recomendações explicáveis, apresenta poucas pendências de alto impacto e leva diretamente à ação operacional.

### Confiança nos dados

Ledger, snapshots, histórico imutável, transações atômicas e rastreabilidade são parte do produto. O usuário deve confiar que números passados não mudam silenciosamente e que uma operação crítica não produz efeitos parciais.

### Simplicidade progressiva

O caminho comum é curto. Recursos avançados aparecem quando o contexto exige. O produto evita formulários gigantes e painéis genéricos de centenas de parâmetros.

### Crescimento sem troca de plataforma

O mesmo produto deve atender a empresa que começa com poucos usuários e continuar adequado quando ela acumula grandes catálogos, estoques, equipes e histórico transacional.

## Referências competitivas

Bling, Omie e Tiny são referências conceituais de velocidade, acessibilidade e aderência à operação de PMEs. SAP Business One, Microsoft Dynamics 365 Business Central e Oracle NetSuite são referências conceituais de profundidade processual, drill-down, controles, aprovações e rastreabilidade.

Esses produtos não são templates funcionais. O Rescript não copia menus, fluxos ou funcionalidades. A arquitetura e os princípios próprios sempre prevalecem.

## Objetivos do produto

- reduzir o tempo entre intenção e conclusão de uma tarefa;
- tornar informações operacionais importantes visíveis sem navegação investigativa;
- fechar ciclos completos entre documentos e domínios;
- prevenir inconsistências em estoque e financeiro;
- permitir que cada papel trabalhe por prioridades e exceções;
- manter experiência consistente entre módulos;
- sustentar grandes volumes sem degradar o modelo mental do usuário;
- oferecer auditoria e permissões adequadas à responsabilidade de cada operação;
- transformar dados confiáveis em recomendações rastreáveis;
- crescer por evolução incremental, sem reescrita estrutural.

## Não objetivos

- competir por quantidade de funcionalidades desconectadas;
- reproduzir interfaces de ERPs legados;
- expor bounded contexts, tabelas ou termos técnicos ao usuário;
- transformar a Home em BI genérico;
- criar microserviços ou infraestrutura para escala não observada;
- antecipar complexidade fiscal, contábil ou setorial sem contrato e caso de uso real;
- permitir customização irrestrita que destrua consistência e suporte.

## Critérios permanentes de decisão

Antes de aprovar qualquer evolução, responder:

1. Isso melhora a produtividade?
2. Isso reduz cliques ou alternância de contexto?
3. Isso mantém consistência entre módulos?
4. Isso funciona com milhares de registros?
5. Isso preserva a confiança nos dados?
6. Isso parece um ERP enterprise, e não um CRUD administrativo?

Se qualquer resposta for negativa, a solução deve ser reavaliada.
