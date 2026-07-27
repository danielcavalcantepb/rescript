---
Status: Active
Owner: Product Design & Engineering
Last-Reviewed: 2026-07-27
Version: 1.1.0
Type: Canonical
Scope: Contextual Entity Creation
Supersedes: None
Superseded-By: None
Related-Modules: Sales, Customers
---

# Contextual Entity Creation

## Objetivo

Contextual Entity Creation permite criar uma entidade relacionada sem abandonar o documento em edição. A primeira integração é a criação de Cliente durante a emissão de Orçamento ou Pedido de Venda.

O fluxo oficial é:

`Pesquisar → selecionar ou criar → Drawer → salvar → selecionar automaticamente → continuar`

Não há redirecionamento, troca de módulo ou cadastro alternativo.

## Arquitetura

O mecanismo pertence à camada de composição de UI. Ele não possui domínio, persistência ou regras de negócio próprias.

- `EntityProvider` descreve identidade, rótulo e apresentação de uma entidade.
- `EntityPicker` implementa busca, autocomplete, paginação, estado vazio, criação contextual e seleção.
- `EntityDrawer` usa o Drawer responsivo do Design System.
- `EntityQuickCreate` adapta o formulário mínimo ao caso de uso canônico do módulo proprietário.
- o provider específico conecta hooks, permissões e contracts já existentes.

Cada nova entidade deve fornecer seu próprio provider e quick create, sem colocar regras específicas no componente genérico.

## Customer Provider

O provider de Cliente usa:

- `useCustomers` com busca tenant-scoped e cursor;
- debounce de 300 ms e mínimo de dois caracteres;
- `useCreateCustomer`, que chama o Customer Application Service;
- `customerCreateAddress`, quando o usuário possui permissão de endereço;
- a projection `customer_search` somente para leitura.

A criação continua produzindo os eventos e registros de auditoria definidos por Customers. RLS e membership são aplicados no servidor. A UI nunca acessa tabelas diretamente.

## Permissões

- localizar e selecionar exige o acesso de leitura já requerido pelo fluxo de Sales;
- o botão **Criar cliente** aparece somente com `customers.create`;
- endereço é persistido somente com `customers.addresses.manage`;
- o servidor valida novamente todas as permissões, membership e tenant.

Ocultar a ação na UI não substitui autorização server-side.

## Drawer e responsividade

No desktop e tablet, o formulário abre lateralmente com largura máxima de 560 px. No mobile, ocupa toda a largura. O foco permanece no contexto do documento, o overlay bloqueia interação acidental e Escape/fechamento seguem as primitivas acessíveis do Radix.

O formulário solicita somente dados úteis para concluir a venda. Endereço é opcional e não bloqueia a criação do Customer Aggregate.

## Auto seleção

Após a criação bem-sucedida:

1. o Drawer fecha;
2. a query de Customers é invalidada;
3. o Customer retornado pelo caso de uso é selecionado;
4. o pedido permanece intacto e pode ser concluído.

O Sales Order Workspace mantém itens, preços, descontos, moeda e observações
durante todo o ciclo do Drawer. Alterações não salvas são protegidas pelo guard de
navegação do documento.

## Extensão

Produtos, fornecedores, transportadoras, categorias, vendedores, formas de pagamento, listas de preço, endereços e contatos devem reutilizar o mesmo `EntityPicker`. Cada integração implementará apenas provider, busca, permissão e quick create específicos do domínio proprietário.

## Garantias

- nenhum Customer simplificado ou cadastro paralelo;
- nenhum redirecionamento;
- busca incremental paginada;
- domínio e migrations inalterados;
- auditoria, eventos, RLS e multi-tenancy herdados do módulo Customers;
- falhas de validação retornam nos campos sem perder o pedido.
