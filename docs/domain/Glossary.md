---
Status: Active
Owner: Domain Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: domain / Glossary
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Glossário do Domínio (referência rápida)

> Definições curtas em ordem alfabética. Para linguagem por contexto ver `UbiquitousLanguage.md`; para decisões de termo ver `Terminology.md`.
> Status: Modelagem conceitual (DDD).

---

## A
- **Agregado (Aggregate):** cluster de entidades/VOs tratado como unidade de consistência, com uma raiz.
- **Aggregate Root (Raiz):** única entidade do agregado acessível de fora; guardiã das invariantes.
- **Ajuste (Adjustment):** correção auditável do saldo de estoque, com motivo.
- **Anonimização:** remoção da identificabilidade de dados pessoais, preservando o histórico agregado (LGPD × integridade).
- **AuditEntry (Registro de Auditoria):** trilha imutável de uma ação sensível.
- **Available (Disponível):** saldo vendável = físico − reservado.

## C
- **Caixa (Cash):** saldo/projeção financeira derivada do razão (FinancialEntry).
- **Cancelar (venda/recebível):** anular via compensação, sem destruir histórico.
- **Comando (Command):** intenção de mudar o estado (imperativo); pode ser rejeitado.
- **Confirmada:** estado oficial da venda efetivada (não "concluída").
- **Customer (Cliente):** quem compra da organização.
- **Custo (Cost):** valor de custo do item; base de margem.

## D
- **Dispensar (Dismiss):** silenciar um insight; só reaparece com mudança material.
- **Document (Documento):** VO de CPF/CNPJ, validado.
- **DomainEvent (Evento de Domínio):** fato de negócio consumado (nome no passado).
- **DomainService (Serviço de Domínio):** regra que coordena vários agregados.

## E
- **Entidade:** objeto com identidade e ciclo de vida.
- **Entitlement (Direito de Uso):** o que o plano contratado libera.
- **Estorno:** movimento/lançamento compensatório (nunca exclusão).
- **Evento derivado do tempo:** fato gerado pela passagem do tempo (ex.: `ReceivableOverdue`).

## F
- **Fato / Projeção / Recomendação:** as três naturezas possíveis de um insight.
- **FinancialEntry (Lançamento Financeiro):** movimento imutável no razão de caixa.
- **FiscalDocument (Documento Fiscal):** nota emitida via provedor (adapter).

## I
- **Idempotência:** repetir a operação não duplica o efeito.
- **Insight:** conclusão gerada, rastreável (fato/projeção/recomendação).
- **Installment (Parcela):** fração de um recebível com vencimento.
- **InventoryItem (Item de Estoque):** saldo de uma variante numa organização (derivado do ledger).
- **InventoryMovement (Movimentação):** lançamento imutável no ledger de estoque.
- **Invariante:** verdade que nunca pode ser violada (não configurável).
- **Invite (Convite):** oferta de uso único para vincular alguém a uma organização.

## L
- **Ledger:** registro append-only que é fonte de verdade de um saldo (estoque/financeiro).
- **Liberação:** movimento que devolve saldo reservado ao disponível.

## M
- **Membership (Vínculo):** relação pessoa↔organização com papéis e status.
- **Money:** VO de dinheiro (valor + moeda); nunca float.
- **Movimentar:** registrar entrada/saída/ajuste no ledger de estoque.

## O
- **On-hand (Físico):** saldo fisicamente em estoque.
- **Pedido / Orçamento:** fases da Sale no MVP (não são agregado Order separado).
- **Organization (Organização/Empresa):** o tenant; a empresa cliente.
- **Ownership (Propriedade):** quem é dono da organização (sempre exatamente um).

## P
- **Payment (Pagamento/Recebimento):** evento de recebimento total/parcial.
- **PaymentMethod (Forma de Pagamento):** dinheiro, PIX, cartão, boleto (pode ter taxa).
- **Percentage:** VO de proporção (desconto, juros, margem).
- **Permission (Permissão):** direito de executar uma ação (`recurso.ação`).
- **Period (Período):** VO de intervalo de datas.
- **Política (Policy):** regra de negócio configurável (ex.: `NegativeStockPolicy`).
- **Product (Produto):** item conceitual vendável.
- **ProductVariant (Variante):** unidade vendável que carrega estoque.

## Q
- **Quantity (Quantidade):** VO de valor + unidade.
- **Query (Consulta):** intenção de ler sem efeito colateral.
- **Quitar:** zerar o saldo aberto de uma parcela.

## R
- **Reservation (Reserva):** compromisso temporário de saldo (≠ saída).
- **Reserved (Reservado):** saldo comprometido, ainda não baixado.
- **Receivable (Recebível):** direito de receber, originado por uma venda.
- **Role (Papel):** conjunto nomeado de permissões.

## S
- **Sale (Venda):** transação comercial; raiz de agregado.
- **SaleItem (Item de Venda):** linha da venda (variante/quantidade/preço/desconto).
- **Severity (Severidade):** nível do insight (informativo/atenção/crítico).
- **SKU:** código único do item vendável por organização.
- **Subscription (Assinatura):** contrato da organização com o Rescript (≠ recebíveis do cliente).

## T
- **Tenant:** termo técnico para organização (uso interno; UX diz "empresa").
- **Trial (Teste):** acesso temporário concedido pela assinatura.

## U
- **User (Usuário):** pessoa com identidade única na plataforma.

## V
- **Value Object (VO):** objeto definido por seus valores, imutável, sem identidade.
- **Vencida:** estado derivado de parcela (passou do vencimento com saldo aberto).

---

> Termos que mudam de sentido entre contextos (ex.: "Item", "Cancelar") estão detalhados em `BoundedContexts.md` §6.
