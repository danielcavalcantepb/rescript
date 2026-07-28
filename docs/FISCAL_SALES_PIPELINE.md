# Sales Fiscal Pipeline

## Escopo

O pipeline transforma uma Sales Order confirmada em um Fiscal Document interno. A origem é lida pelo adapter canônico de Sales; a persistência e a resolução fiscal são executadas pela RPC transacional `build_fiscal_document_from_sales`.

## Pré-condições

- Sales Order pertence à organização e está `confirmed`.
- Existe `fiscal_source_metadata` válida para `SALES_ORDER`.
- Operação fiscal e perfil fiscal estão ativos.
- A ordem possui itens e cada variante pertence à organização.
- O usuário possui `fiscal.documents.create`, `fiscal.resolve` e `fiscal.sources.read`.

## Garantias

A RPC bloqueia a ordem durante a construção, resolve uma regra por item, persiste snapshots fiscais e atualiza a projeção de busca na mesma transação. A chave única por organização/origem torna a operação idempotente para documentos ativos. Nenhum XML, imposto monetário, SEFAZ, estoque ou financeiro é produzido.

## Pendências

O workspace `/fiscal` ainda precisa consumir a projeção para listagem e detalhe operacional; esta etapa entrega o contrato, a migration e o command server-side.
