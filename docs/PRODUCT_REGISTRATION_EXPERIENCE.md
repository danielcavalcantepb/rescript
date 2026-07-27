---
Status: Canonical
Owner: Product & Engineering
Última revisão: 2026-07-27
Versão: 1.0
Tipo: Reference
Escopo: Catalog
Substitui: null
Substituído por: null
Módulos relacionados: Products, Product Variants, Categories, Brands, Attributes
---

# Product Registration Experience

## Responsabilidade

Este documento define a experiência de criação de produtos sobre os contratos
canônicos descritos em [Catalog Foundation](./CATALOG_FOUNDATION.md). Ele não
define regras de estoque, preço, fornecedor, fiscal ou imagens.

## Modos de criação

O cadastro rápido é um drawer contextual para produtos simples. Solicita nome,
SKU, categoria e marca; utiliza a unidade de medida ativa já disponível e cria o
produto como rascunho. A mutação oficial invalida a lista e pode devolver o
produto criado ao seletor chamador.

O cadastro avançado é um workspace em quatro etapas:

1. dados básicos e topologia simples ou variável;
2. classificação por Category, Brand e Attributes existentes;
3. revisão das combinações de variantes;
4. resumo e confirmação.

O wizard mantém um rascunho local por organização e protege o fechamento da
página enquanto houver alterações. A persistência canônica ocorre somente ao
confirmar a última etapa.

## Fonte de verdade

O estado transitório pertence ao wizard. React Query mantém apenas dados
servidores e invalida o catálogo após a criação. A Application Layer continua
responsável por validar tenant, permissões, identificadores e integridade.

Produtos variáveis utilizam `CreateProductCommand.axes` e `skuPrefix`, já
existentes. A interface somente apresenta a prévia do produto cartesiano; a
criação e os eventos permanecem no domínio.

## Segurança e auditoria

O acesso usa a permissão vigente `products.create`. A criação passa pela mesma
server function e pelo mesmo application service do Catálogo, preservando RLS,
tenant, validações e eventos de auditoria. A interface não realiza inserts
diretos.

## Acessibilidade e responsividade

O quick create usa o Drawer canônico com focus trap, retorno de foco e suporte a
Esc do Radix. O wizard usa labels, estados de erro com `role=alert`, progresso
semântico e navegação por teclado. O conteúdo é empilhado no mobile e recebe
resumo lateral persistente somente em telas largas.

## Limites desta sprint

- o status inicial é sempre rascunho, conforme lifecycle vigente;
- descrição curta não possui contrato próprio e não é simulada;
- estoque, ledger e preços não são criados;
- a criação inline está disponível como callback do quick create, mas a
  integração em seletores de outros domínios permanece fora desta sprint;
- filtros por topologia e datas dependem de campos ainda ausentes na resposta
  paginada oficial e não são simulados no frontend.
