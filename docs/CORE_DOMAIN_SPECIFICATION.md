---
Status: Active
Owner: Architecture and Product Architecture
Last-Reviewed: 2026-07-28
Version: 1.0.0
Type: Canonical
Scope: Core Domain entities, value objects, aggregates, ownership, invariants, events and derived facts
Supersedes: None
Superseded-By: None
Related-Modules: Organizations, Catalog, Customers, Suppliers, Purchasing, Receiving, Inventory, Sales, Finance, Fiscal
---

# Core Domain Specification

## Autoridade e congelamento

Esta é a constituição do Core Domain. Mudanças de entidade, estado, ownership, evento, relacionamento ou invariant exigem atualização formal desta especificação e do ADR/contrato aplicável antes de código. O documento complementa o [Documento Mestre](./MASTER_PRODUCT_DOCUMENT.md), o [Module Status](./MODULE_STATUS.md) e a [Auditoria de Domínio](./DOMAIN_AUDIT.md). Lacunas marcadas como futuras não são funcionalidades autorizadas.

## Regras transversais

- Todo fato pertence a uma `Organization`; referência cruzada entre organizações é inválida.
- Commands validam actor, tenant, permissão, lifecycle e invariantes; RLS é defesa adicional.
- `Money` e `Quantity` são valores canônicos; interface não usa `float` como autoridade.
- History, audit e ledger são append-only. Cancelar/arquivar não é exclusão silenciosa.
- Snapshot congela informação documental; projeção otimiza leitura e não é fonte de verdade.

## Value Objects

| Value Object | Responsabilidade e invariantes | Módulos |
|---|---|---|
| OrganizationId, ActorId, EntityId | identidade opaca e escopada por tenant | todos |
| Money | valor e moeda obrigatórios; sem ponto flutuante | Pricing, Sales, Purchase, Payable, Finance futuro |
| Quantity | não negativa, unidade explícita e precisão aprovada | Variant, Purchase, Receiving, Inventory, Sales |
| DocumentNumber | número único no escopo do aggregate/organização | Purchase, Receiving, Sales, Payable |
| DateRange | início/fim válidos e timezone explícito | busca e indicadores |
| Customer/Supplier/Product/Price Snapshot | fato comercial observado que não depende do cadastro atual | Sales, Purchase, Finance futuro |

## Aggregates, entidades, ownership e indicadores

| Aggregate / entidade | Objetivo e responsabilidade | Cria / altera / consulta / remove | Estados, eventos e auditoria | Permissões e dependências | Indicadores derivados |
|---|---|---|---|---|---|
| Organization | delimitar tenant e propriedade | admin cria/altera; membro consulta; remoção é suspensão/arquivamento aprovado | `OrganizationCreated`; audit administrativo | membership, sessão, RLS; base de todos | empresas/contexto |
| Membership/User | vincular usuário à organização/papel | admin cria/altera/revoga; membro consulta | ativo/revogado; `MemberJoined`, `MemberRoleChanged`, `MemberRemoved`; audit | RBAC e Organization; usuário não é vendedor automaticamente | usuários ativos |
| Category | classificar Product em hierarquia aprovada | `catalog.categories.write` cria/altera/arquiva; leitura autorizada | ativa/arquivada; Category create/update/archive | Organization, Product; sem ciclo, slug único | dimensão de catálogo/venda/estoque |
| Brand | identificar marca comercial | `catalog.brands.write` cria/altera/arquiva | ativa/arquivada; Brand create/update/archive | Organization, Product; slug único | dimensão de catálogo/venda/estoque |
| AttributeDefinition/Value | atributos dinâmicos de Variant | `catalog.attributes.write` cria/altera/arquiva | ativo/arquivado; eventos de create/update/archive | Value pertence ao Attribute; inativação preserva referências | filtros por atributo |
| Product | identidade comercial simples/variável; não possui saldo/preço | `catalog.products.write` cria/altera/arquiva | ativo/arquivado; lifecycle/history | Category, Brand, Variant; simples possui variante padrão | produtos/status |
| ProductVariant | unidade vendável e identificável | comando do Product cria/altera/arquiva; leitura autorizada | ativa/arquivada; assignment events | Product, AttributeValue, Pricing, Inventory; SKU/barcode únicos | variantes, disponibilidade e ranking por projeção |
| PriceList/Item | autoridade única de preço vigente | `prices.*` cria/altera/arquiva | tabela/item ativo/arquivado; eventos de preço | Variant, Money, vigência; conflito é inválido | preço resolvido; nunca receita/custo |
| Customer | identidade, contatos, documentos, endereço principal e dependentes | comandos Customer criam/altera/transicionam/arquivam | draft/active/inactive/archived; eventos e history append-only | Organization, Company, Branch, Sales, Finance, Analytics e CRM | total, ativos, recorrentes, última compra, ticket, origem e saldo aberto |
| Supplier | identidade, contatos e endereços do fornecedor | comandos Supplier criam/altera/arquivam | ativo/arquivado; create/update/archive/history | Purchase, Payable futuro | contexto de compras |
| PurchaseOrder/Item | intenção de compra e snapshots | `purchasing.orders.*` cria/altera/transiciona | Draft→Sent→Confirmed→Closed ou Cancelled; Purchase events/history | Supplier, Variant, Pricing, Receiving; não altera saldo | pedidos e pendência de recebimento |
| GoodsReceiving/Item | recebimento físico de Purchase confirmada | Receiving cria/inicia/conclui/cancela | Draft→Receiving→Completed ou Cancelled; Receiving events/history | Purchase, Inventory Ledger; não excede pendente; conclusão idempotente | entradas e pendências |
| StockLocation | local de projeção do saldo | Inventory autorizado cria/altera/arquiva | ativo/arquivado; audit conforme foundation | Organization, Inventory Balance/Ledger | saldo por local |
| InventoryLedger/Movement | fato físico imutável; saldo derivado | command Inventory registra; ninguém edita/remove | append-only; Entry/Exit/Transfer/Adjustment/BalanceProjected | Variant, location, documento origem; atomicidade/idempotência/lock | on-hand, reservado, disponível, entradas/saídas |
| InventoryReservation | comprometer disponibilidade sem on-hand | permissionamento específico cria/ativa/libera/cancela | Draft/Active/PartiallyReleased/Released/Cancelled/Archived; history | Sales elegível e availability; lock determinístico | reservado/comprometido |
| SalesQuotation/Item | proposta comercial com snapshots | Sales cria/altera/transiciona | Draft→Sent→Approved/Rejected/Expired→Archived | Customer, Variant, Pricing; sem efeito implícito | propostas |
| SalesOrder/Item | documento comercial rastreável | Sales cria/altera/confirma/cancela conforme lifecycle | Draft→Confirmed/Cancelled→Archived; SalesOrder events/history | Customer, Variant, Pricing; preço/desconto/tenant revalidados | receita/pedidos/ticket só após fato confirmado aprovado |
| AccountsPayable/Installment | obrigação a pagar e parcelas | `payables.*` cria/altera/cancela/arquiva | Draft/Open/PartiallyPaid/Paid/Cancelled/Archived; history | Supplier/origem, Payment futuro; saldo não negativo | contas a pagar e vencimentos |
| AccountsReceivable/Installment | direito a receber com parcela, origem e saldo aberto | Finance cria, liquida parcialmente/integralmente ou cancela; não remove | open/partially_settled/settled/cancelled; eventos e history append-only | Customer, Sales, Branch, PaymentAllocation; original > 0 e open entre 0 e original | receber, vencido e fluxo previsto |
| AccountsPayable/Installment | obrigação a pagar com parcela, origem e saldo aberto | Finance cria, liquida parcialmente/integralmente ou cancela; não remove | open/partially_settled/settled/cancelled; eventos e history append-only | Supplier, Purchase futuro, Branch, PaymentAllocation; original > 0 e open entre 0 e original | pagar, vencido e fluxo previsto |
| Payment/PaymentAllocation | fato financeiro efetivo e sua alocação exclusiva em título | Finance posta ou reverte integralmente; não atualiza destrutivamente | posted/reversed; PaymentPosted, PaymentAllocated, PaymentReversed | CashAccount, Receivable ou Payable, Branch; alocação não supera payment nem título | realizado e saldo |
| CashAccount/CashLedger/FinancialTransfer | manter dinheiro e fatos imutáveis de caixa | Finance cria conta; Ledger é criado por commands; nunca editado/removido | conta ativa/inativa/arquivada; ledger credit/debit/reversal; transferência é par atômico debit/credit | Organization, Company, Branch, Payment; saldo sempre derivado do ledger | saldo, realizado e projeção |
| FiscalProfile/Operation/Rule/Document | contratos fiscais alvo, ainda não operacionais | escrita proibida até escopo aprovado | eventos/lifecycle dependem do Tax Engine/Builder | Variant e FiscalSource | consulta fiscal futura |

## Customer Domain — contrato oficial expandido

### Aggregate, ownership e responsabilidade

`Customer` é o agregado que representa a contraparte comercial da empresa. É a única autoridade para identidade cadastral, contatos, documentos, endereço principal, fonte de aquisição e dependentes. Todo Customer pertence obrigatoriamente a uma `Organization`, `Company` e `Branch`; esses três identificadores integram seu escopo de autorização e não aceitam referência cruzada. Empresa de unidade única usa a Branch padrão, nunca `NULL`.

| Elemento | Contrato canônico |
|---|---|
| Identidade | `id`, `organizationId`, `companyId`, `branchId`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `archivedAt`, `archivedBy` e metadados de auditoria. |
| Dados principais | `fullName`, `shortName`, `phone`, `secondaryPhone`, `email`, `instagram`, `acquisitionSource` e `notes`. Nome completo, nome abreviado, telefone e fonte de aquisição são obrigatórios para ativação. |
| Pessoa e documentos | `personType` é `individual` ou `company`. Individual pode conter CPF e RG; company pode conter CNPJ, razão social, nome fantasia, inscrições estadual e municipal. Documento é validado, normalizado, único no escopo aplicável e auditado quando alterado. |
| Address principal | Endereço principal pertence ao Customer, com CEP, logradouro, número, complemento, bairro, cidade, UF, país Brasil por padrão e referência opcional. A composição permite múltiplos endereços no futuro, mas esta fase reconhece somente o principal. |
| Child/Dependent | Entidade interna do agregado, identificada pelo Customer e mesmo escopo organizacional. Não cria um segundo Customer e não recebe ownership independente. |
| AcquisitionSource | Catálogo organizacional de origem. Valores iniciais aprovados: Instagram, Indicação, Google, WhatsApp, Loja física, Evento, Campanha e Outro; `Outro` exige descrição contextual. |

Customer não possui receita, saldo financeiro, pedido, pagamento ou métrica calculada como estado autoritativo. Sales mantém pedidos e Finance mantém títulos, liquidações e caixa. Customer apenas referencia tais fatos para leitura autorizada.

### Lifecycle, invariantes e transições

| Estado | Significado | Transições permitidas |
|---|---|---|
| `draft` | cadastro iniciado com informações ainda incompletas; não é cliente operacional conforme as regras de negócio vigentes | `active`, `archived` |
| `active` | cadastro válido e elegível para seleção em operações autorizadas | `inactive`, `archived` |
| `inactive` | cadastro preservado, mas indisponível para novas operações | `active`, `archived` |
| `archived` | cadastro retirado de uso corrente, com histórico preservado | `active` ou `inactive` somente por reativação explícita |

Invariantes: Customer não é excluído fisicamente quando possui histórico; `draft` não pode ser selecionado em fluxos operacionais; somente `active` é elegível para novas operações; `Organization`, `Company` e `Branch` são obrigatórios; email é válido quando informado; telefone é normalizado e validado para DDD brasileiro; Instagram é normalizado sem exigir URL; CPF/CNPJ não podem duplicar no escopo da Organization; nomes iguais nunca bloqueiam por si só, mas podem ser sinalizados como possível duplicidade. Todo dependent, address e acquisition source deve pertencer ao mesmo escopo do Customer.

### Permissões, RLS e auditoria

| Permissão | Capacidade |
|---|---|
| `customers.read` | consultar Customer e dados não sensíveis autorizados |
| `customers.create` | iniciar e ativar novo Customer segundo as validações |
| `customers.update` | alterar dados principais, cadastrais e endereço conforme escopo |
| `customers.archive` | arquivar, reativar ou inativar Customer |
| `customers.view_sales` | consultar relações e métricas comerciais derivadas |
| `customers.view_financial` | consultar recebíveis e valores financeiros derivados |
| `customers.manage_dependents` | criar, editar e remover dependentes no agregado |
| `customers.export` | exportar resultados autorizados e filtrados |

RLS aplica Organization, Company e Branch antes de qualquer leitura ou mutação. A autorização do servidor não depende de ocultar ações na interface. A auditoria registra criação, atualização, transição de lifecycle, alteração documental, alteração de endereço, manutenção de dependent, potencial duplicidade e acesso financeiro sensível quando o mecanismo de auditoria suportar essa categoria.

### Eventos e consumidores

| Evento | Quem dispara / quando | Consumidores e efeito permitido |
|---|---|---|
| `CustomerCreated` | command cria Customer em `draft` ou `active` permitido | history/audit, busca e Analytics de cadastro |
| `CustomerUpdated` | command altera dados principais ou cadastrais | history/audit e projeções de busca |
| `CustomerActivated` | transição explícita para `active` | Sales eligibility, history/audit e dimensão Analytics |
| `CustomerInactivated` | transição de `active` para `inactive` | eligibility de novas operações e history/audit |
| `CustomerArchived` | command arquiva o agregado | busca, history/audit e proteção contra novas seleções |
| `CustomerDependentAdded` | command mantém dependent válido | history/audit do Customer |
| `CustomerAddressUpdated` | command cria ou altera address principal | history/audit e leitura autorizada |

Os eventos não escrevem Sales, Finance ou CRM diretamente. Eles atualizam somente history, auditoria, projeções de Customer e dimensões analíticas autorizadas.

### Relações e indicadores derivados

| Relação / indicador | Fonte e regra |
|---|---|
| Sales | SalesOrder mantém o snapshot do Customer. Customer Workspace apenas navega para pedidos autorizados; iniciar venda propaga `customerId`, `companyId` e `branchId` sem duplicar cadastro. |
| Finance | Finance continua autoridade de Receivable, liquidação e caixa. Customer expõe saldo aberto, títulos vencidos, recebido e pendente exclusivamente por leitura autorizada. |
| Analytics | Cliente ativo = Customer em `active` na data de referência; recorrente = cliente com duas ou mais vendas confirmadas no período filtrado; última compra = venda confirmada mais recente; ticket médio = receita confirmada / pedidos confirmados do cliente; origem = dimensão `AcquisitionSource`; saldo aberto = soma dos recebíveis abertos autorizados. |
| CRM | CRM pode consumir Customer e eventos para relacionamento futuro, mas não pode alterar ownership, documento, lifecycle ou dados cadastrais sem commands Customer. |

## Fluxos e invariantes

| Fluxo | Contrato | Invariantes | Resultado/eventos |
|---|---|---|---|
| Produto | Product + Variant + Attribute assignment | simples tem variante padrão; variant/atributo pertencem ao tenant; atributo não duplica | history/audit de Catalog |
| Preço | PriceListItem → Variant/data | uma regra válida e não conflitante; preço não pertence ao Product | PriceSnapshot em documento |
| Compra | Supplier → PurchaseOrder → Item | snapshots, quantidade positiva, lifecycle válido; não altera estoque | Purchase events e projection |
| Recebimento | Purchase Confirmed → GoodsReceiving → Ledger inbound | não excede pendente; lock e idempotência; conclusão única | ReceivingCompleted, inbound, fecha Purchase quando completo |
| Estoque | movimento autorizado → Ledger → Balance projection | ledger imutável; saldo derivado; sem update direto de balance | movement e BalanceProjected |
| Venda | Customer + Variant + Pricing → SalesOrder | snapshots e valores revalidados; sem integração antecipada | Sales events; receita depende de contrato de confirmação |
| Reserva | SalesOrder elegível → Reservation | não muda on-hand; reserved não excede disponibilidade | history/projection de reservation |
| Financeiro | título → PaymentAllocation → CashLedger | saldo nunca negativo; pagamento e ledger idempotentes; estorno é append-only; branch obrigatória | eventos financeiros, history/audit e fluxo derivado |

## Catálogo de eventos

| Evento | Quem dispara/quando | Quem consome e atualiza | Indicadores/logs |
|---|---|---|---|
| Category/Brand/Attribute Created/Updated/Archived | command canônico após persistência | Catalog projection e Search | dimensões; audit/history |
| VariantAttributeAssigned/Removed | comando Variant após validar valor/tenant | Variant projection e filtros | filtros; audit/history |
| PriceList/Item Created/Updated/Archived | command Pricing após validar vigência | resolver e projection Pricing | origem de preço; audit |
| Purchase lifecycle events | Purchase aggregate em transição válida | history/search e elegibilidade Receiving | pedidos/pendências; audit |
| Receiving lifecycle events | Receiving aggregate | Purchase port, Ledger e search | entradas/pendências; audit; Completed pode fechar Purchase |
| InventoryEntry/Exit/Transfer/Adjustment | command/ledger pós-transação | Balance/Reconciliation projections | entradas/saídas/ajustes; audit |
| BalanceProjected | projeção posterior ao ledger | Inventory read models | disponibilidade; log técnico, não novo fato |
| Reservation lifecycle events | Reservation command | availability/search/history | reservado; audit |
| SalesOrderCreated/Updated/Cancelled/Archived | Sales command permitido | Sales history/search | nenhum indicador comercial até confirmação aceita |
| SalesOrderConfirmed | somente após especificação de lifecycle/efeitos | futuro Inventory/Receivable/Analytics | receita/pedidos/ticket; audit |
| Payable lifecycle events | Payable command | history/search | aberto/vencimento; audit |
| AccountsReceivableCreated/PartiallySettled/Settled/Cancelled | command de recebível depois de persistir a transição | history, CashLedger e fluxo | receber/vencido; audit |
| AccountsPayableCreated/PartiallySettled/Settled/Cancelled | command de payable depois de persistir a transição | history, CashLedger e fluxo | pagar/vencido; audit |
| PaymentPosted/PaymentAllocated/PaymentReversed | command de Payment, na mesma transação de allocation/reversal | títulos, CashLedger e projeções | caixa/fluxo; correlation log |
| CashLedgerEntryCreated/FinancialTransferCompleted | command de caixa após persistir o fato imutável | search e fluxo derivado | saldo e realizado; audit |

## Ownership e consultas

| Dado | Owner | Leitura | Alteração/remoção |
|---|---|---|---|
| produto/variant | Catalog | `catalog.*.read` | comandos Catalog; arquivamento preserva referências |
| preço | Pricing | consumidor autorizado | somente Pricing |
| disponibilidade | Inventory Ledger/Balance | Inventory e consumidores autorizados | commands Inventory/fluxos aprovados |
| snapshots | Sales/Purchase document | leitura autorizada do documento | imutável conforme lifecycle |
| obrigação a pagar | Accounts Payable | `payables.*.read` | commands Payable; nunca delete silencioso |
| cliente/fornecedor | respectivos aggregates | tenant autorizado | commands do módulo |
| history/audit | History/Audit | leitura do aggregate ou `audit.view` | nunca editável pelo usuário |

## Dependências e indicadores derivados

| Indicador | Fonte | Estado |
|---|---|---|
| produtos, variants, categorias e marcas | Catalog | disponível sob filtros suportados |
| preço vigente | Pricing resolver | disponível para consulta autorizada |
| disponibilidade, entradas, saídas, ajustes | Inventory Ledger/Balance | disponível sob filtros suportados |
| contas a pagar/vencimentos | Accounts Payable | disponível no escopo AP |
| receita, pedidos e ticket médio | SalesOrder confirmado + projeção reconciliada | bloqueado por confirmação |
| lucro, margem e valor de estoque | valuation/custo médio por ledger | bloqueado por política de custo |
| receber, caixa, fluxo e inadimplência | Receivable/PaymentAllocation/CashLedger | disponível no Finance operacional; lucro/margem continuam bloqueados por valuation |
| vendedor, meta e comissão | Seller/Goal/Commission | fora do Core atual |

## Processo obrigatório de mudança

1. Registrar problema e impacto no Documento Mestre.
2. Atualizar esta especificação com entidade, evento, invariant, ownership e dependência.
3. Criar/atualizar ADR se a decisão for arquitetural.
4. Atualizar backlog e Module Status antes de implementação.
5. Implementar somente com revisão de tenancy, permissions, audit, migrations e testes.

## Contratos fundamentais

| Aggregate | Responsabilidade e invariantes | Eventos/auditoria | Ownership |
|---|---|---|---|
| Branch | Unidade operacional de Organization; uma padrão ativa por organização; arquivamento é soft delete e a padrão não pode ser arquivada. | BranchCreated, BranchUpdated, BranchDefaulted, BranchArchived. | Organization; `branches.read/manage`. |
| PaymentTerm | Define cronograma de cobrança previsível. Parcelas possuem sequência, percentual e dias de vencimento; percentuais ativos somam 100%. | PaymentTermCreated, PaymentTermArchived. | Organization; `payment_terms.read/manage`. |
| InventoryPolicy | Fonte única da política operacional de saldo. Negativo exige confirmação sem saldo habilitada. | InventoryPolicyCreated, InventoryPolicyUpdated. | Organization; `inventory.policy.read/manage`. |

Esses aggregates não criam Sales Order, contas a receber, lançamentos de caixa ou movimentos de estoque. Eles apenas oferecem os contratos necessários para os domínios consumidores.
