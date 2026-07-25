# Rescript — Decisões Oficiais do Fundador

> Registro formal das decisões que fecham pendências da modelagem conceitual (DDD).
> Status: **Oficial.** Sem tabelas, SQL ou código. Impactam domínio, arquitetura e regras de negócio.
> Data: 2026-07-24.

---

## Índice

| ID | Decisão | Escopo |
|---|---|---|
| FD-01 | Custeio por custo médio ponderado | Estoque |
| FD-02 | Reserva de estoque no MVP | Estoque / Vendas |
| FD-03 | Sale único no MVP (sem agregado Order) | Vendas |
| FD-04 | Juros e multa fora do MVP | Financeiro |
| FD-05 | Controle de desconto no MVP | Vendas / Autorização |
| FD-06 | Unidades inteiras e fracionadas | Catálogo / Quantidade |
| FD-07 | Multi-moeda fora do MVP (BRL) | Financeiro |
| FD-08 | VariantAttribute genérico | Catálogo |

---

## FD-01 — Custeio: custo médio ponderado

### Contexto
Saídas de estoque precisam de custo para margem e indicadores. PEPS, custo por entrada e médio foram avaliados.

### Alternativas consideradas
- Custo por entrada (último custo / custo da última entrada).
- Custo médio ponderado.
- PEPS (FIFO).

### Decisão
**Custo médio ponderado** como política oficial. Recalculado a cada entrada que altera o custo do item. Saídas usam o custo médio **vigente no momento da movimentação**. PEPS **não** entra no MVP. Custo histórico **não** é editável silenciosamente.

### Justificativa
Equilibra simplicidade operacional e rastreabilidade de margem para o beachhead (distribuidoras/atacado). PEPS adiciona complexidade de camadas sem benefício claro no MVP.

### Consequências positivas
- Margem consistente e explicável.
- Histórico do custo aplicado em cada saída.
- Reconstrução a partir do ledger + histórico de custo médio.

### Consequências negativas
- Entradas sem custo e devoluções exigem regras explícitas.
- Ajustes podem afetar média — precisam de política clara.

### Impacto no MVP
Custo médio por variante; registro do custo aplicado na saída; sem PEPS.

### Impacto futuro
Possível evoluir para métodos alternativos por organização sem reescrever o ledger (custo aplicado já está no movimento).

### Gatilhos de revisão
Exigência fiscal/contábil de PEPS; demanda enterprise; multi-depósito com custeio distinto.

### Regras oficiais de comportamento
1. Entrada com custo → recalcula média ponderada:  
   `novo_custo_médio = (físico_atual × custo_médio_atual + qty_entrada × custo_entrada) / (físico_atual + qty_entrada)`.
2. Entrada sem custo → não altera o custo médio vigente (quantidade entra; média permanece).
3. Saída → grava no movimento o **custo unitário aplicado** (= média vigente) e o custo total da linha; **não** altera a média.
4. Devolução de cliente (entrada) → trata como entrada; se houver custo associado à venda original, usa esse custo para recalcular a média (rastreável).
5. Estorno/compensação → movimento compensatório com custo do movimento original; não edita o histórico.
6. Ajuste positivo/negativo → quantidade muda; custo médio só muda se a política de ajuste informar custo (senão, só quantidade).
7. Correção de custo errado → **nunca** editar movimento antigo; movimento compensatório + novo lançamento auditável.

---

## FD-02 — Reserva de estoque no MVP

### Contexto
Pedidos B2B, orçamentos convertidos e separação de mercadoria exigem comprometer saldo sem baixar.

### Alternativas consideradas
- Só baixa na confirmação (sem reserva no MVP).
- Reserva no MVP com ciclo completo.
- Reserva sempre obrigatória.

### Decisão
**Reserva entra no MVP.** Reserva ≠ saída. Saldos oficiais: **físico**, **reservado**, **disponível** (= físico − reservado).

### Justificativa
Beachhead (distribuidoras/atacado) opera com pedidos em aberto e risco de vender o mesmo saldo duas vezes. Reserva é requisito de negócio, não antecipação técnica.

### Consequências positivas
- Previne venda duplicada do disponível.
- Suporta orçamento → pedido → confirmação.
- Modelo alinhado a operações B2B.

### Consequências negativas
- Expiração, liberação e concorrência adicionam complexidade.
- UX precisa distinguir disponível vs. físico.

### Impacto no MVP
Reservation como entidade do agregado InventoryItem; política de expiração configurável; conversão reserva→saída na confirmação.

### Impacto futuro
Picking avançado, multi-depósito e backorder podem reutilizar o mesmo modelo.

### Gatilhos de revisão
Fulfillment complexo; múltiplas entregas; canais externos.

### Definições oficiais
| Conceito | Definição |
|---|---|
| Saldo físico | Quantidade existente no estoque |
| Saldo reservado | Quantidade comprometida, ainda não baixada |
| Saldo disponível | Físico − reservado |
| Reserva | Compromisso de estoque com origem, quantidade, data, situação, expiração opcional, liberação, conversão em saída e histórico |

**Reservation não é InventoryMovement.** São conceitos distintos; a confirmação da venda **consome** a reserva e **gera** saída física no ledger.

---

## FD-03 — Sale único no MVP (sem agregado Order)

### Contexto
Orçamento, pedido e venda poderiam ser agregados separados. No MVP, isso fragmentaria o modelo sem necessidade operacional comprovada.

### Alternativas consideradas
- Agregado Order separado + Sale.
- Sale único com estados cobrindo o ciclo comercial.
- Order apenas como tipo de documento externo.

### Decisão
**Não criar agregado Order no MVP.** Um único agregado **Sale** com estados que representam fases anteriores e posteriores à confirmação (rascunho, orçamento, pedido, confirmada, cancelada e estados terminais de orçamento/pedido). Extração futura de Order só com necessidade operacional comprovada.

### Justificativa
Simplicidade (obsessão do produto). Orçamento e pedido são **fases** da mesma intenção comercial até a confirmação. Extrair Order cedo cria fronteiras e sincronização prematuras.

### Consequências positivas
- Um ciclo comercial coerente.
- Menos agregados e coordenação.
- UX pode usar rótulos amigáveis (Orçamento/Pedido) sem fragmentar o domínio.

### Consequências negativas
- Máquina de estados da Sale fica mais rica.
- Risco de Sale “inchada” se regras específicas não forem bem encapsuladas.

### Impacto no MVP
Sale = raiz; estados e políticas por fase; reserva tipicamente a partir de Pedido.

### Impacto futuro
Extrair Order quando houver fulfillment complexo, múltiplas entregas, backorder, aprovação comercial, picking avançado ou canais externos.

### Gatilhos de revisão
Qualquer um dos sinais acima com demanda comprovada.

---

## FD-04 — Juros e multa fora do MVP

### Contexto
Inadimplência no Brasil frequentemente envolve juros/multa, mas o MVP precisa de financeiro confiável sem complexidade de encargos.

### Alternativas consideradas
- Juros/multa no MVP.
- Fora do MVP; V1.
- Só multa simples no MVP.

### Decisão
**Juros e multa não entram no MVP.** MVP cobre: valor original, desconto, pagamento parcial, vencimento, atraso (estado vencido), estorno, cancelamento. Encargos e renegociação automática ficam para **V1**. Fronteira de evolução reservada, sem complexidade no MVP.

### Justificativa
Confiança nos dados > feature completa de cobrança. Atraso e vencido já alimentam insights; encargos podem ser adicionados sem quebrar o modelo de Receivable/Payment.

### Consequências positivas
- Financeiro MVP mais simples e testável.
- Modelo pronto para encargos como lançamentos adicionais no futuro.

### Consequências negativas
- Clientes que precisam de juros no dia 1 terão gap até V1.

### Impacto no MVP
Sem InterestPolicy ativa; parcelas vencidas sem cálculo de encargos.

### Impacto futuro
V1: InterestPolicy, lançamentos de encargos rastreáveis, possível renegociação.

### Gatilhos de revisão
Demanda recorrente do beachhead; módulo financeiro avançado no roadmap.

---

## FD-05 — Controle de desconto no MVP

### Contexto
Descontos sem controle destroem margem e confiança. Papéis fixos sozinhos não bastam.

### Alternativas consideradas
- Sem limite no MVP.
- Limite só por nome de papel fixo.
- Política por organização + permissões granulares.

### Decisão
**Controle de desconto no MVP**, baseado em **permissão e política da organização** (não só no nome de um papel). Organização define teto sem autorização, quem pode conceder acima do teto, necessidade de autorização e motivo obrigatório em descontos sensíveis. Sistema registra percentual, valor, responsável, autorização, motivo, data e efeito na margem.

### Justificativa
Protege margem (tese de inteligência) e permite papéis personalizados futuros (`Authorization.md`).

### Consequências positivas
- Margem auditável.
- Flexível para papéis customizados.
- Alinha com RBAC por permissão.

### Consequências negativas
- Configuração inicial e UX de autorização a desenhar com cuidado.

### Impacto no MVP
`DiscountAuthorizationPolicy`; permissões `sales.discount` / `sales.discount.authorize`; auditoria de desconto sensível.

### Impacto futuro
Fluxos de aprovação em dois passos; limites por categoria/cliente.

### Gatilhos de revisão
Aprovações multi-nível; desconto por lista de preço/cliente.

---

## FD-06 — Unidades inteiras e fracionadas

### Contexto
Atacado e materiais usam kg, m, L; varejo usa un/cx. Quantity não pode ser só inteiro.

### Alternativas consideradas
- Só unidades inteiras no MVP.
- Inteiras + fracionadas desde o início.
- Fracionadas só em V1.

### Decisão
**Suportar unidades inteiras e fracionadas desde o início.** Quantity com precisão decimal controlada (nunca float binário). Definir precisão, arredondamento, unidade, quantidade mínima e múltiplo de venda quando aplicável.

### Justificativa
Beachhead e expansão (materiais, agro) exigem fração. Adiar forçaria reescrita de Quantity e do ledger.

### Consequências positivas
- Modelo genérico por segmento.
- Ledger e vendas corretos para kg/m/L.

### Consequências negativas
- Regras de precisão/arredondamento a formalizar por unidade.
- UX de entrada de quantidade mais cuidadosa.

### Impacto no MVP
Catálogo de unidades; precisão por unidade; Quantity decimal exato.

### Impacto futuro
Múltiplo de compra; conversão entre unidades (cx↔un) quando houver fator.

### Gatilhos de revisão
Conversão de unidades compostas; venda por peso com balança.

### Regras oficiais
- Unidades exemplo: unidade, caixa, pacote, quilo, grama, metro, litro.
- Unidades **inteiras** (ex.: un, cx, pct): quantidade em inteiros (precisão 0).
- Unidades **fracionadas** (ex.: kg, g, m, L): precisão decimal definida por unidade (ex.: kg até 3 casas).
- Arredondamento: regra única e explícita por unidade (nunca float).
- Quantidade mínima e múltiplo de venda opcionais por variante.

---

## FD-07 — Multi-moeda fora do MVP

### Contexto
Money deve carregar moeda conceitualmente, mas o mercado inicial é Brasil.

### Alternativas consideradas
- Multi-moeda no MVP.
- BRL operacional; Money com moeda para evolução.
- Money sem conceito de moeda.

### Decisão
**Multi-moeda não entra no MVP.** Moeda operacional: **BRL**. Money continua capaz de carregar moeda. Sem conversão cambial, taxas, relatórios multi-moeda ou recebíveis em moeda estrangeira. Não espalhar a string `"BRL"` de forma rígida pelo domínio — usar a moeda da organização (padrão BRL).

### Justificativa
Evita complexidade inútil no MVP preservando evolução (AP7 / simplicidade).

### Consequências positivas
- Simplicidade; Money pronto para o futuro.

### Consequências negativas
- Organizações multi-moeda não são atendidas no MVP.

### Impacto no MVP
Organization.currency = BRL (padrão); Money sempre com currency; sem FX.

### Impacto futuro
Multi-moeda / FX quando houver demanda internacional.

### Gatilhos de revisão
Expansão internacional; clientes com compra/venda em USD/EUR.

---

## FD-08 — VariantAttribute genérico

### Contexto
Segmentos diferentes usam atributos distintos (cor, voltagem, aroma…). Atributos fixos no núcleo engessam o produto.

### Alternativas consideradas
- Atributos fixos (cor, tamanho…).
- VariantAttribute genérico com regras anti-caos.
- Sem atributos (só nome da variante).

### Decisão
**Manter VariantAttribute genérico.** Variante pode ter cor, tamanho, material, voltagem, embalagem, aroma, peso comercial ou qualquer atributo do segmento. Evitar flexibilidade descontrolada com regras de padronização, unicidade de combinação, validação e filtro.

### Justificativa
Beachhead e expansão multi-segmento exigem genérico; regras de disciplina evitam “lixo de atributos”.

### Consequências positivas
- Catálogo agnóstico de segmento.
- SKU/preço/custo/saldo por variante.

### Consequências negativas
- Precisa de governança de nomes/valores.
- UX de variantes deve esconder complexidade quando há só a variante padrão.

### Impacto no MVP
Product sempre tem ≥1 variante (padrão se não houver variações); InventoryItem → Variant; atributos genéricos com regras.

### Impacto futuro
Bibliotecas de atributos por segmento; atributos obrigatórios por categoria.

### Gatilhos de revisão
Necessidade de atributos tipados por integração marketplace/fiscal.

### Regras oficiais anti-caos
1. Nome de atributo normalizado (trim, case-insensitive) no escopo do produto.
2. Valor normalizado; vazio não é atributo.
3. Ordem de apresentação definida por produto.
4. Combinação de atributos **única** por produto (sem duas variantes iguais).
5. Validação: no máximo N atributos por variante (limite sensato); nomes com tamanho máximo.
6. Atributos obrigatórios configuráveis por produto/categoria (opcional no MVP).
7. Pesquisa/filtro por atributo nome+valor.
8. Produto sem variações → **variante padrão** única; UI não obriga o usuário a “criar variante”.

---

## Relação com ADRs

| Decisão | ADR |
|---|---|
| FD-01 Custeio | ADR-0005 (atualizado) + ADR-0016 |
| FD-02 Reserva | ADR-0005 (atualizado) + ADR-0017 |
| FD-03 Sale único | ADR-0007 (atualizado) + ADR-0018 |
| FD-04 Juros/multa | ADR-0006 (atualizado) |
| FD-05 Desconto | ADR-0019 |
| FD-06 Quantity | ADR-0016 (contexto de precisão) / domínio ValueObjects |
| FD-07 Multi-moeda | ADR-0006 (atualizado) |
| FD-08 VariantAttribute | ADR-0018 / domínio Catalog |

---

## Status das pendências anteriores

Todas as 8 decisões listadas no resultado da modelagem DDD foram **fechadas** por este documento. Pontos ainda abertos (não bloqueantes para modelagem lógica) estão no resumo final desta etapa.
