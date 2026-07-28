# ADR-0026 — Fiscal Source Contract

Status: Accepted

## Decisão

O domínio Fiscal recebe dados operacionais exclusivamente por `FiscalSource` e `FiscalSourceItem`. O contrato é transportável, explícito e não executa consultas ao banco.

`SourceTypeRegistry` reconhece `SALES_ORDER`, `GOODS_RECEIVING`, `PURCHASE_RETURN` e `INVENTORY_TRANSFER`.

## Responsabilidades

Sales, Receiving, Purchase Returns e Transfers deverão fornecer os campos do contrato por adapters futuros. O domínio Fiscal transforma cada item em `FiscalContext`, executa o Tax Engine e, posteriormente, o Builder.

## Pendências documentadas

Os módulos atuais ainda não possuem, de forma uniforme, operação fiscal, perfil fiscal, UF de origem e UF de destino. Nenhuma regra foi inventada nesta decisão; cada adapter deverá declarar a ausência como inelegibilidade até que o módulo de origem forneça o dado.

## Evolução

Adapters concretos, RPC de geração, snapshots e integrações operacionais são decisões posteriores. Nenhum módulo operacional pode gravar diretamente em tabelas fiscais ou duplicar regras tributárias.
