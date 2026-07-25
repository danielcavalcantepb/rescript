# Rescript — Regras de Negócio

> Documento oficial de regras de negócio do núcleo (MVP).
> Define o comportamento esperado do produto de forma independente de tecnologia.
> Status: Alinhado às decisões do fundador (`docs/domain/FounderDecisions.md`) — 2026-07-24.
> Terminologia: **Venda Confirmada** (não “Concluída”); **Confirmar Venda**; estoque na **variante**.

---

## 1. Escopo e Convenções

Este documento descreve **regras de negócio funcionais** do núcleo do Rescript. Não define esquema de banco, endpoints ou implementação — apenas o **comportamento correto** que o produto deve garantir.

Convenções:
- **RN-XX** = identificador de regra de negócio.
- "Empresa" = Organization / tenant (a conta contratante).
- "Usuário" = pessoa com acesso dentro de uma empresa.
- Todas as regras valem **dentro do contexto de uma única empresa** (isolamento multi-tenant).
- Termos oficiais: ver `docs/domain/Terminology.md`.

---

## 2. Regras Transversais (Plataforma)

- **RN-01 — Isolamento por empresa.** Todo dado pertence a exatamente uma empresa. Um usuário só acessa dados da(s) empresa(s) a que pertence. Nunca há vazamento entre empresas.
- **RN-02 — Papéis mínimos (MVP).** Existem papéis iniciais (Proprietário, Administrador, Gerente, Vendedor, Estoquista, Financeiro, Consulta). Autorização é por **permissão**, não por nome de papel fixo no código.
- **RN-03 — Auditoria básica.** Registros importantes e ações sensíveis guardam quem criou/alterou e quando (data/hora), com trilha quando aplicável.
- **RN-04 — Exclusão segura.** Entidades com histórico (cliente, produto/variante com vendas) não são apagadas fisicamente de forma a corromper registros passados; usa-se **inativação** ou exclusão lógica. Vendas **confirmadas** nunca são apagadas — apenas **canceladas**.
- **RN-05 — Limites por plano.** A criação de registros e o acesso a módulos respeitam os limites do plano contratado. Ao atingir limite, o sistema informa e oferece upgrade, sem perder dados.
- **RN-06 — Consistência é prioridade.** Estoque e financeiro devem estar sempre corretos. Em caso de conflito entre velocidade e correção dos números, a correção vence.

---

## 3. Clientes

- **RN-10 — Identificação.** Um cliente pode ser Pessoa Física ou Jurídica. Nome/razão social é obrigatório.
- **RN-11 — Documento opcional mas único.** Documento (CPF/CNPJ) é opcional no cadastro rápido; quando informado, não deve haver duplicidade dentro da mesma empresa (alerta de possível duplicado).
- **RN-12 — Histórico preservado.** O histórico de vendas de um cliente é mantido mesmo se o cliente for inativado.
- **RN-13 — Inativação.** Cliente pode ser inativado; clientes inativos não aparecem por padrão em novas vendas, mas seu histórico permanece.
- **RN-14 — Cliente avulso.** Uma venda pode ser feita sem cliente identificado ("consumidor/venda avulsa"), quando permitido pela configuração.

---

## 4. Produtos e Variantes

- **RN-20 — Dados essenciais.** Produto exige nome. Preço de venda é obrigatório na variante vendável. Custo, SKU, categoria e unidade são recomendados.
- **RN-21 — SKU único por variante.** Quando informado, o SKU é único dentro da empresa (na variante).
- **RN-22 — Preço e custo.** Preço de venda e custo são valores monetários não negativos (`Money`). Custo alimenta margem/lucro; método oficial = **custo médio ponderado** (RN-37).
- **RN-23 — Controle de estoque.** O controle de estoque aplica-se à **variante** (físicos). Serviços/itens sem controle não sofrem reserva nem baixa.
- **RN-24 — Inativação.** Produto/variante pode ser inativado; não aparece em novas vendas, mas permanece no histórico.
- **RN-25 — Variante é a unidade estocável e vendável.** Toda unidade estocável é uma **ProductVariant**. Produto sem variações visíveis possui **variante padrão**. InventoryItem referencia a variante, não o produto diretamente. SKU, código de barras, preço, custo, saldo e reserva são por variante. UI não expõe complexidade quando há só a variante padrão.
- **RN-26 — Atributos de variante genéricos.** Variantes usam `VariantAttribute` (nome/valor), sem atributos fixos no núcleo (cor, tamanho etc. são valores possíveis, não colunas do modelo). Combinação de atributos única por produto; nomes/valores normalizados; ordem de apresentação definida; prevenção de duplicidade.
- **RN-27 — Unidades inteiras e fracionadas.** Unidades como un, cx, pct (inteiras) e kg, g, m, L (fracionadas) são suportadas. `Quantity` não assume apenas inteiros; precisão e arredondamento são definidos por unidade; nunca ponto flutuante binário. Quantidade mínima e múltiplo de venda podem aplicar-se por variante.

---

## 5. Estoque

- **RN-30 — Saldo por variante.** Cada variante que controla estoque tem saldos por empresa: **físico**, **reservado**, **disponível** (= físico − reservado).
- **RN-31 — Movimentações do ledger (físico).** O saldo **físico** só muda por `InventoryMovement`: **entrada**, **saída**, **ajuste positivo**, **ajuste negativo**, **devolução**, **estorno** (e transferência futura). Toda movimentação registra tipo, quantidade, custo aplicado quando cabível, origem, data e responsável. Movimentos são imutáveis; correção = compensação.
- **RN-31b — Reserva não é movimento físico.** `Reservation` é compromisso distinto: situações **ativa**, **consumida**, **liberada**, **expirada**, **cancelada**. Reserva altera o **reservado** (e portanto o disponível), **não** o físico. Reserva exige origem, quantidade, data, situação, expiração opcional e histórico.
- **RN-32 — Baixa na confirmação.** Ao **confirmar** uma venda, reservas ativas dos itens são **consumidas** e o estoque físico dos itens controlados é reduzido (movimentação de **saída** vinculada à venda), de forma atômica.
- **RN-33 — Estorno no cancelamento.** Ao cancelar uma venda **confirmada**, o estoque dos itens é devolvido por movimento de **estorno/compensação** (não se edita nem apaga a saída original).
- **RN-34 — Estoque negativo (política).** Por padrão, o sistema **alerta** ao vender sem disponível suficiente. A empresa pode configurar se **bloqueia** ou **permite** com alerta. Padrão recomendado: permitir com alerta.
- **RN-35 — Estoque mínimo e alerta.** Cada variante pode ter estoque mínimo sobre o saldo **disponível** ou físico (política); alerta no Decision Center/notificações.
- **RN-36 — Ajuste rastreável.** Ajustes manuais exigem motivo e ficam registrados para auditoria.
- **RN-37 — Custeio (custo médio ponderado).** Política oficial: custo médio ponderado por variante. Recalculado a cada **entrada** que informe custo. Saídas usam o custo médio **vigente** no momento e **gravam** esse custo no movimento. Entradas sem custo não alteram a média. Devoluções, estornos e ajustes seguem regras de compensação; **proibida** edição silenciosa de custo histórico. PEPS fora do MVP.
- **RN-38 — Reserva no MVP.** Reserva existe para pedidos/orçamentos/vendas ainda não confirmadas, separação de mercadoria e operações B2B, prevenindo venda duplicada do mesmo disponível.

---

## 6. Vendas (agregado Sale — sem Order separado no MVP)

- **RN-40 — Composição da venda.** Uma venda (Sale) tem: cliente (ou avulso), um ou mais itens (variante, quantidade, preço unitário), descontos e total calculado. Não há agregado Order separado no MVP; orçamento e pedido são **fases/estados** da Sale.
- **RN-41 — Cálculo automático.** O total da venda é sempre calculado pelo sistema: soma dos itens (quantidade × preço) menos descontos. O usuário não digita o total manualmente.
- **RN-42 — Quantidades e preços válidos.** Quantidade > 0 (respeitando precisão da unidade) e preço ≥ 0 por item. Desconto não pode tornar o total negativo.
- **RN-43 — Estados da venda (oficiais).** Uma Sale pode estar em:
  - **Rascunho** — edição inicial; sem efeito em estoque/financeiro.
  - **Orçamento** — proposta ao cliente; pode expirar ou ser recusada; reserva conforme política.
  - **Pedido** — compromisso comercial pré-confirmação; tipicamente com reserva ativa.
  - **Confirmada** — efetivada; dispara baixa de estoque e efeitos financeiros.
  - **Cancelada** — pós-confirmação, via compensação.
  - Terminais pré-confirmação: **Descartada** (rascunho), **OrçamentoRecusado**, **OrçamentoExpirado**, **PedidoCancelado**.
  - Detalhe de transições: `docs/domain/StateMachines.md`.
- **RN-44 — Efeitos da confirmação.** **Confirmar Venda** sempre gera, de forma atômica: (a) consumo de reservas + saída de estoque dos itens controlados e (b) geração de recebível (à vista com pagamento ou a prazo com parcelas). Idempotente.
- **RN-45 — Imutabilidade após confirmação.** Uma venda **confirmada** não é editada livremente; para corrigir, **cancela-se** e cria-se nova (ou fluxo de correção auditável).
- **RN-46 — Cancelamento controlado.** Cancelar venda confirmada exige permissão, reverte estoque (estorno) e financeiro (cancela não pagos; estorna recebimentos quando aplicável). Registrado (quem, quando, motivo). Impacto fiscal é desacoplado (documento fiscal tratado à parte).
- **RN-47 — Condição de pagamento.** A venda define como será recebida: à vista ou a prazo (recebível com parcela(s) e vencimento).
- **RN-48 — Descontos controlados.** A organização define teto de desconto sem autorização; permissões permitem conceder ou autorizar acima do teto; descontos sensíveis exigem motivo. Registrar percentual, valor, responsável, autorização, motivo, data e efeito na margem. Não vincular a regra somente ao nome de um papel fixo.

---

## 7. Financeiro Básico

- **RN-50 — Conceitos separados.** **Recebível** = obrigação/direito de receber originado pela venda. **Parcela** = divisão do recebível com vencimento. **Pagamento** = ocorrência de liquidação (total/parcial). **Estorno** = reversão de pagamento. Situação de “pago” é **derivada**, nunca booleano na venda.
- **RN-51 — Contas a receber.** Vendas a prazo geram recebível com parcela(s): situações derivadas (**em aberto**, **parcialmente paga**, **paga**, **vencida**, **cancelada**).
- **RN-52 — Contas a pagar.** Despesas e (futuramente) compras geram contas a pagar (escopo conforme roadmap).
- **RN-53 — Situação automática.** Parcela em aberto cujo vencimento passou torna-se **vencida** (derivado). Pagamentos recalculam a situação.
- **RN-54 — Saldo e fluxo.** O caixa é derivado dos lançamentos financeiros efetivados. Fluxo mostra previsto (em aberto) e realizado.
- **RN-55 — Vínculo com a venda.** Recebível mantém origem na venda; cancelar a venda reflete no financeiro (RN-46).
- **RN-56 — Moeda.** Valores usam `Money` com moeda da organização. MVP: operação em **BRL**; sem conversão cambial, FX ou multi-moeda. Não espalhar literal de moeda de forma rígida pelo domínio.
- **RN-57 — MVP sem juros/multa.** No MVP: valor original, desconto, pagamento parcial, vencimento, atraso (vencido), estorno, cancelamento. Juros, multa, renegociação automática e encargos ficam para **V1**.

---

## 8. Indicadores (Central de Decisão / Dashboard)

- **RN-60 — Fonte única de verdade.** Indicadores são **derivados** dos dados operacionais, nunca digitados.
- **RN-61 — Período padrão.** Dia atual e mês corrente, com possibilidade de ajustar.
- **RN-62 — Indicadores mínimos.** Vendas do dia/mês, ticket médio, top produtos/clientes, saldo/caixa, a receber, alertas de estoque, insights prioritários.
- **RN-63 — Ticket médio.** Total vendido no período ÷ número de vendas **confirmadas** no período.
- **RN-64 — Consistência com relatórios.** Indicador e relatório correspondente, mesmo período, devem bater.

---

## 9. Relatórios

- **RN-70 — Baseados em dados reais e por período.**
- **RN-71 — Relatórios mínimos (MVP).** Vendas, estoque/movimentações/reservas, financeiro (recebimentos, em aberto).
- **RN-72 — Exportação.** PDF/planilha quando aplicável.
- **RN-73 — Consistência.** Isolamento por empresa e permissões.

---

## 10. Regras de Integração entre Módulos (Efeitos em Cadeia)

| Evento | Efeito automático |
|---|---|
| **Venda → Pedido** (quando política reserva) | Cria/atualiza **reservas** (não baixa físico) |
| **Venda Confirmada** | Consome reservas + **saída** de estoque + gera **recebível** (+ pagamento à vista se houver) |
| **Venda Cancelada** (pós-confirmação) | Estorno de estoque + cancelamento/estorno financeiro |
| **Pedido cancelado / orçamento expirado / recusado** | Libera reservas ativas |
| **Movimentação de estoque** | Atualiza físico (ledger); ajustes exigem motivo |
| **Parcela vencida** | Situação derivada “vencida” |
| **Pagamento registrado** | Recalcula situações; gera lançamento financeiro |
| **Estoque baixo** | Insight/alerta na Central de Decisão |

> **RN-80 — Atomicidade dos efeitos.** Os efeitos essenciais de **Confirmar Venda** (estoque + financeiro + situação) ocorrem de forma consistente: ou tudo, ou nada. Nunca venda confirmada sem os efeitos essenciais correspondentes.

---

## 11. Regras de Configuração (Empresa)

- **RN-90 — Padrões sensatos.** A empresa opera com padrões prontos; configuração é exceção (estoque negativo, desconto máximo, expiração de reserva, venda avulsa).
- **RN-91 — Moeda e localidade.** MVP: BRL e português do Brasil. Evolução multi-moeda/localidade sem reescrever o núcleo (Money já carrega moeda).
- **RN-92 — Reversibilidade.** Mudar configuração afeta operações futuras, não reescreve o histórico.

---

## 12. Regras Não Cobertas no MVP (declaração explícita)

O MVP **não** define regras de: juros/multa/encargos, multi-moeda/FX, PEPS, emissão fiscal completa (só fronteira por integração quando no roadmap), multi-filial, conciliação bancária, Order como agregado separado, fulfillment complexo (múltiplas entregas, backorder, picking avançado). Ver `Roadmap.md` e `FounderDecisions.md`.
