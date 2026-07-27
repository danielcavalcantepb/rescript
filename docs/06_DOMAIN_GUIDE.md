---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: 06_DOMAIN_GUIDE
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Guia de Domínio

## Responsabilidade deste documento

Este documento define os conceitos usados para modelar o negócio e preservar fronteiras. Ele é agnóstico de framework e persistência.

## Linguagem ubíqua

Cada domínio usa termos estáveis, genéricos e compreendidos por negócio e engenharia. Termos técnicos podem permanecer em inglês no código; a UX usa português natural.

Um conceito tem um único significado dentro de seu bounded context. Quando dois contextos usam visões diferentes do mesmo objeto, comunicam-se por published language, não compartilhando estruturas internas.

## Bounded Context

Um bounded context define:

- responsabilidade;
- entidades proprietárias;
- invariantes;
- contratos públicos;
- dependências permitidas;
- eventos produzidos e consumidos.

Nenhum contexto escreve na verdade canônica de outro. Composition na UI não transfere ownership.

## Aggregates

Aggregate é a fronteira de consistência de um conjunto de entidades. Possui um root que controla mudanças e garante invariantes.

Características:

- ID e tenant explícitos;
- lifecycle definido;
- changes passam pelo root/use case;
- children não são tratados como raízes independentes sem justificativa;
- tamanho compatível com transações e leitura;
- referências a outros aggregates são por ID/snapshot/port;
- criação válida por factory ou operação equivalente.

Nem toda tela, tabela ou agrupamento é aggregate.

## Entities

Entity possui identidade e continuidade ao longo do tempo. Igualdade não depende apenas dos valores atuais.

Entities filhas carregam referência ao root e tenant. Lifecycle próprio só existe quando necessário. Remoção física é rara; child histórico pode usar status `removed` ou archive.

## Value Objects

Value Object representa um valor definido por seus atributos e invariantes, como Money, Quantity, SKU, Barcode ou documento.

Regras:

- imutável conceitualmente;
- criado somente quando válido;
- comparação por valor;
- comportamento e validação próximos do tipo;
- representação de persistência não vaza para consumidores;
- um VO canônico é reutilizado quando a semântica é realmente a mesma.

## Factories

Factories criam aggregates/entities em estado válido, geram IDs quando injetados e produzem eventos iniciais. Elas não persistem, autorizam ou consultam infraestrutura.

Reconstituição de banco não usa factory de criação, pois não deve emitir eventos nem aplicar defaults novos a dados históricos.

## Policies

Policy encapsula uma decisão de negócio que:

- combina múltiplos fatores;
- não pertence naturalmente a uma única entity;
- precisa ser testada isoladamente;
- deve ser reutilizada sem duplicar condicionais.

Policies são determinísticas sempre que possível. Configuração por empresa entra como dados, não branch de segmento.

## Domain Services e Application Services

### Domain Service

Executa regra pura que envolve conceitos do domínio e não pertence a uma entity específica. Não conhece auth, banco ou UI.

### Application Service

Orquestra o caso de uso, autorização, ports, transação, audit e events. Não contém regra que deveria estar em entity, VO ou policy.

## Lifecycles e máquinas de estado

Todo aggregate transacional ou arquivável explicita:

- estados;
- transições permitidas;
- pré-condições;
- efeitos;
- transições terminais;
- regras de restore/cancel/reversal.

UI mostra apenas ações válidas, mas o servidor aplica a regra novamente. Alterar status diretamente no repository é proibido quando contorna lifecycle.

## Commands e Queries

Command expressa intenção e pode mudar estado. Query retorna informação sem mudar fatos de negócio.

- inputs não são rows de banco;
- commands carregam apenas dados do cliente permitidos;
- tenant e ator são resolvidos pelo servidor;
- queries usam read models quando não precisam reconstituir aggregate;
- operações críticas recebem idempotency key quando repetição é possível.

## Snapshots

Snapshot é cópia imutável dos dados necessários no momento de um fato. É usado quando transações históricas precisam continuar legíveis após alteração do cadastro.

Princípios:

- owner da fonte continua explícito;
- snapshot possui versão quando é contract cross-domain;
- contém apenas dados necessários ao fato;
- não é atualizado retroativamente;
- não substitui ID/referência canônica;
- mudança breaking exige nova versão ou decisão registrada.

Exemplos conceituais: item de venda guarda nome/SKU/preço praticado; pedido guarda fornecedor e variante relevantes; payable guarda origem de recebimento.

## Projections e Read Models

Projection transforma fatos canônicos em estrutura otimizada para leitura, busca, dashboard ou lista.

Características:

- derivada e reconstruível;
- tenant-scoped;
- atualizada por trigger, transação ou evento;
- não recebe writes de negócio;
- pode ser eventualmente consistente se a UX expuser freshness;
- versionada quando contract público;
- substituível sem alterar o domínio.

Saldo materializado, search document e indicadores são projections. A fonte é ledger/aggregate/evento correspondente.

## Ledger

Ledger é sequência imutável de movimentos que representa a verdade de uma dimensão operacional ou financeira.

Regras:

- append-only;
- correção por movimento compensatório;
- idempotência;
- correlação com origem;
- tenant explícito;
- projeções reconciliáveis;
- quantidade/valor exatos;
- mutação direta bloqueada no banco.

Ledger é apropriado para estoque e pagamentos; não deve ser usado por moda em cadastros simples.

## Domain Events

Evento expressa um fato passado, com nome específico e payload mínimo. Eventos:

- não ordenam uma ação futura pelo nome;
- carregam tenant e IDs relevantes;
- são emitidos após a regra ser aplicada;
- podem alimentar projections e integrações;
- precisam de outbox quando entrega é requisito;
- têm consumers idempotentes.

## Histories e Audit

History local registra evolução do aggregate. Audit transversal registra ações sensíveis para investigação/compliance. Ledger registra verdade operacional. Logs registram comportamento técnico. Um não substitui o outro.

## Soft archive, cancelamento e reversal

- cadastro fora de uso: archive/inactive;
- membership/user: status de acesso;
- transação anulada: cancel com efeitos explícitos;
- fato financeiro/estoque: reversal/compensação;
- dado temporário: hard delete permitido quando não há valor histórico;
- fato auditável: imutável.

## Invariantes transversais

- todo fato operacional pertence a exatamente uma organização;
- referências cross-entity preservam tenant;
- dinheiro não usa float;
- totals vêm do servidor;
- history não é reescrita;
- search não é fonte da verdade;
- UI não duplica regra de domínio;
- cross-domain não acessa repository/tabela alheia;
- ação crítica não falha parcialmente;
- replay não duplica efeito.

## Como avaliar um novo conceito

Perguntar:

1. Qual contexto é dono?
2. Possui identidade ou é Value Object?
3. Qual é a fronteira de consistência?
4. Quais invariantes existem?
5. Qual lifecycle?
6. Precisa de snapshot histórico?
7. É fonte canônica ou projection?
8. Mudança precisa ser atômica/idempotente?
9. Quais eventos são fatos úteis?
10. Como o usuário enxerga e age sobre isso no Workspace?
