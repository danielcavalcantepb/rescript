---
Status: Active
Owner: Domain Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: domain / UbiquitousLanguage
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Linguagem Ubíqua

> A linguagem compartilhada entre negócio, produto e engenharia. Cada termo tem **um** significado **dentro do seu contexto** (`BoundedContexts.md`). O código, os documentos e as conversas usam exatamente estes termos.
> Status: Modelagem conceitual (DDD).

---

## 1. Princípios da Linguagem Ubíqua

1. **Um termo, um significado por contexto.** Ambiguidade é bug.
2. **A linguagem é do negócio, não da tecnologia.** Falamos "confirmar venda", não "commit da transação de venda".
3. **Se o especialista de domínio não usa a palavra, nós não usamos.** Nada de jargão técnico vazando para o modelo.
4. **Verbos importam.** "Confirmar", "reservar", "estornar" carregam regras — não são só CRUD.
5. **O que não tem nome, não existe.** Todo conceito relevante recebe um nome explícito.
6. **A linguagem evolui com o entendimento.** Ao descobrir um conceito novo, nomeamos e registramos.

---

## 2. Verbos do Domínio (ações com significado de negócio)

Estes verbos **não** são CRUD genérico; cada um carrega regras e invariantes:

| Verbo | Significado de negócio | Contexto |
|---|---|---|
| **Cadastrar** | Registrar um novo conceito no catálogo/base | Catalog, Customers |
| **Confirmar** (venda) | Efetivar a venda, disparando estoque + financeiro atomicamente | Sales |
| **Cancelar** (venda) | Anular via compensação, sem apagar histórico | Sales |
| **Reservar** (estoque) | Comprometer saldo sem retirar | Inventory |
| **Liberar** (reserva) | Devolver saldo comprometido ao disponível | Inventory |
| **Movimentar** (estoque) | Registrar entrada/saída/ajuste no ledger | Inventory |
| **Ajustar** (estoque) | Corrigir saldo com motivo auditável | Inventory |
| **Estornar** | Compensar um efeito anterior (nunca apagar) | Inventory, Finance |
| **Registrar** (recebimento) | Reconhecer um pagamento recebido | Finance |
| **Quitar** | Zerar o saldo aberto de uma parcela | Finance |
| **Vencer** | Passar da data sem quitação (estado derivado) | Finance |
| **Gerar** (insight) | Produzir uma conclusão rastreável | Insights |
| **Dispensar** (insight) | Silenciar uma conclusão | Insights |
| **Importar** | Trazer dados externos com validação | Imports |
| **Emitir** (documento fiscal) | Solicitar a criação do documento ao provedor | Fiscal |
| **Convidar / Aceitar** | Vincular uma pessoa a uma organização | Tenancy |
| **Trocar organização** | Mudar o contexto ativo da sessão | Tenancy |

---

## 3. Vocabulário por Contexto

### Identity & Access
- **User (Usuário):** pessoa com identidade única na plataforma.
- **Credential:** meio de autenticação (delegado ao provedor).
- **Session:** contexto autenticado ativo.
- **Role (Papel):** conjunto nomeado de permissões.
- **Permission (Permissão):** direito de executar uma ação (`recurso.ação`).

### Tenancy & Organizations
- **Organization (Organização/Empresa):** o tenant; a empresa cliente.
- **Membership (Vínculo):** relação pessoa↔empresa com papéis e status.
- **Invite (Convite):** oferta pendente de vínculo.
- **Active Organization (Organização Ativa):** empresa no contexto da sessão.
- **Ownership (Propriedade):** quem é o dono da organização.

### Catalog
- **Product (Produto):** item conceitual vendável.
- **Product Variant (Variante):** especialização vendável (tamanho/cor); unidade que carrega estoque.
- **SKU:** código único do item vendável na empresa.
- **Price (Preço):** valor de venda.
- **Cost (Custo):** valor de custo (base de margem).
- **Unit (Unidade):** unidade de medida (un, kg, cx...).

### Customers
- **Customer (Cliente):** quem compra da empresa (PF/PJ).
- **Contact (Contato):** telefone/e-mail do cliente.
- **Document (Documento):** CPF/CNPJ.

### Sales
- **Sale (Venda):** agregado comercial único no MVP; fases incluem rascunho, orçamento, pedido, confirmada, cancelada.
- **Orçamento / Pedido:** fases (estados) da Sale — **não** agregados separados no MVP.
- **Sale Item (Item de Venda):** linha (variante, quantidade, preço, desconto).
- **Confirmar Venda:** ato de efetivar → estado **Confirmada**.
- **Cancelar Venda:** compensação após confirmação.

### Inventory
- **Inventory Item (Item de Estoque):** posição de estoque de uma **variante**.
- **Inventory Movement (Movimentação):** lançamento do ledger **físico** (entrada/saída/ajuste/devolução/estorno).
- **Reservation (Reserva):** compromisso de estoque — **não** é movimento de saída.
- **Saldo físico / reservado / disponível:** as três grandezas oficiais (disponível = físico − reservado).
- **Custo médio ponderado:** política oficial de custeio; custo aplicado gravado na saída.
- **Adjustment (Ajuste):** correção explícita e auditada.

### Receivables & Finance
- **Receivable (Recebível):** direito de receber, originado por uma venda.
- **Installment (Parcela):** fração do recebível com vencimento.
- **Payment (Pagamento/Recebimento):** evento de recebimento (total/parcial).
- **Financial Entry (Lançamento Financeiro):** movimento no razão de caixa.
- **Due Date (Vencimento):** data-limite de uma parcela.
- **Cash (Caixa):** saldo/projeção financeira derivada.

### Insights & Decision Center
- **Insight:** conclusão gerada (fato/projeção/recomendação).
- **Rule (Regra):** lógica determinística que produz o insight.
- **Severity (Severidade) / Relevance (Relevância):** o quão sério × o quão prioritário.
- **Dismissal (Dispensa):** silenciar um insight.
- **Decision Center (Central de Decisão):** a home que prioriza a atenção do dono.

### Subscriptions & Entitlements
- **Plan (Plano):** pacote comercial.
- **Subscription (Assinatura):** contrato ativo da organização com o Rescript.
- **Entitlement (Direito de Uso):** o que o plano libera.
- **Limit (Limite):** teto quantitativo.
- **Feature Flag:** liga/desliga um recurso.
- **Trial (Teste):** acesso temporário.

### Bordas (Imports, Fiscal, Messaging, Audit)
- **Import Job (Importação):** processo de trazer dados externos.
- **Fiscal Document (Documento Fiscal):** nota emitida via provedor.
- **Message (Mensagem):** comunicação enviada por um canal.
- **Audit Entry (Registro de Auditoria):** trilha de ação sensível.

---

## 4. Palavras banidas (não usar no domínio)

| Não dizer | Dizer | Porquê |
|---|---|---|
| "linha da tabela" | entidade/registro de negócio | Modelamos negócio, não banco |
| "flag pago" | situação da parcela | "Pago" é derivado, não booleano |
| "deletar venda" | cancelar venda | Nunca destruímos histórico |
| "baixar do banco" | consultar/registrar | Linguagem de negócio |
| "venda concluída" | venda **confirmada** | Termo oficial (`Terminology.md`) |
| "estoque da tabela" | saldo do item de estoque | Saldo é derivado do ledger |

---

## 5. Frases-modelo (como falamos no Rescript)

- "O vendedor **confirma** a venda; o sistema **reserva/baixa** o estoque e **gera** o recebível, tudo junto."
- "A parcela **vence** quando passa do vencimento sem **quitação**."
- "O Rescript **gera** um insight de inadimplência e o dono pode **dispensá-lo**."
- "A pessoa **troca a organização ativa** para operar em outra empresa."
- "Cancelar a venda **estorna** o estoque e **cancela** os recebíveis não pagos."

> Estas frases são o teste de coerência: se uma feature não pode ser descrita com a linguagem ubíqua, provavelmente o modelo está errado ou incompleto.
