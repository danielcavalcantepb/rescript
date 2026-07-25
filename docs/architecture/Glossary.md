# Rescript — Glossário (Linguagem Ubíqua)

> Vocabulário compartilhado entre produto, design e engenharia. Termos usados de forma consistente em toda a documentação e no código.
> Status: Design de arquitetura (pré-implementação).

---

## 1. Multi-tenancy e identidade

- **Tenant / Organização (Organization):** a empresa cliente. Unidade de isolamento de dados. Todo dado de negócio pertence a exatamente uma organização.
- **User (usuário):** uma pessoa com identidade única na plataforma. Pode pertencer a várias organizações.
- **Membership (vínculo):** a relação entre um usuário e uma organização, com papel(is) e status. É onde moram os papéis, não no usuário.
- **Organização ativa (active org):** a organização no contexto da sessão atual do usuário (quando ele participa de várias).
- **Unit / Filial (futuro):** subdivisão de uma organização (ex.: loja, depósito). Não faz parte do MVP, mas o modelo não deve impedi-la.
- **Usuário interno:** membro do time Rescript. Acesso a dados de tenants apenas via mecanismo de suporte controlado e auditável.

## 2. Autorização

- **Autenticação:** provar quem você é (Supabase Auth).
- **Autorização:** decidir o que você pode fazer.
- **Role (papel):** conjunto nomeado de permissões (Proprietário, Vendedor, etc.).
- **Permission (permissão):** direito de executar uma ação específica sobre um recurso (ex.: `sales.confirm`).
- **Entitlement (direito de uso):** o que o **plano contratado** libera (limites, módulos). Diferente de permissão (ver `Entitlements.md`).
- **Feature flag:** chave que liga/desliga um recurso (rollout, teste, acesso temporário).
- **Plano comercial:** o pacote pago (Free, Essencial, Profissional, Empresarial).
- **Segregação de funções (SoD):** garantir que a mesma pessoa não acumule permissões conflitantes sensíveis.

## 3. Domínio comercial

- **Customer (cliente):** quem compra da organização (PF ou PJ).
- **Product (produto):** item vendável. Pode ter variantes.
- **Product Variant (variante):** especialização vendável de um produto (ex.: tamanho, cor). Unidade que carrega estoque quando aplicável.
- **SKU:** código único de um item vendável dentro da organização.
- **Sale (venda):** o registro de uma transação comercial com um cliente.
- **Sale Item (item de venda):** uma linha da venda (variante, quantidade, preço, desconto).
- **Pedido / Orçamento:** fases da Sale no MVP (FD-03). Agregado Order **não** existe no MVP; extração futura só com necessidade operacional comprovada.

## 4. Estoque (ver `InventoryArchitecture.md`)

- **Ledger de estoque:** registro imutável e sequencial de todas as movimentações. Fonte de verdade do saldo.
- **Movimentação (inventory movement):** lançamento do ledger **físico** (entrada, saída, ajuste, devolução, estorno) — **não** inclui reserva.
- **Saldo físico / reservado / disponível:** grandezas oficiais; disponível = físico − reservado.
- **Reserva (reservation):** compromisso distinto do movimento físico; situações ativa/consumida/liberada/expirada/cancelada (FD-02).
- **Custo médio ponderado:** política oficial de custeio (FD-01); custo aplicado gravado na saída.
- **Ajuste (adjustment):** correção manual auditável do saldo (com motivo).
- **Custo (cost):** valor de custo associado a movimentações de entrada (base para margem).

## 5. Financeiro (ver `FinancialArchitecture.md`)

- **Receivable (recebível):** direito de receber um valor, originado por uma venda.
- **Installment (parcela):** fração de um recebível com vencimento próprio.
- **Payment (pagamento):** o ato de receber (ou pagar), total ou parcial, referente a uma parcela/recebível.
- **Financial Transaction (movimentação financeira):** lançamento no razão financeiro (entrada/saída efetivada). Fonte de verdade do caixa.
- **Situação da venda:** estados da Sale (rascunho, orçamento, pedido, confirmada, cancelada + terminais pré-confirmação).
- **Situação da parcela:** estado da parcela (em aberto, paga, parcialmente paga, vencida, cancelada).
- **Situação do pagamento:** estado do pagamento (registrado, estornado).
- **Caixa projetado:** projeção auditável de saldo futuro a partir de recebíveis e contas a pagar.

## 6. Inteligência (ver `InsightArchitecture.md`)

- **Insight:** uma conclusão gerada pelo sistema (fato, projeção ou recomendação).
- **Regra de insight (insight rule):** a lógica determinística que produz um insight (ver `InsightCatalog.md`).
- **Fato / Projeção / Recomendação:** classificação obrigatória de todo insight quanto à sua natureza.
- **Severidade:** informativo / atenção / crítico.
- **Relevância:** prioridade do insight para exibição.
- **Dispensa (dismiss):** ação do usuário de silenciar um insight.
- **Central de Decisão:** a Home inteligente (ver `DecisionCenterArchitecture.md`).

## 7. Assíncrono e eventos (ver `DomainEvents.md`)

- **Domain event (evento de domínio):** fato ocorrido no negócio (ex.: `SaleConfirmed`).
- **Outbox:** tabela que registra eventos na mesma transação do dado, para publicação confiável posterior.
- **Idempotência:** propriedade de uma operação produzir o mesmo efeito quando repetida.
- **Idempotency key (chave de idempotência):** identificador que evita processar duas vezes a mesma requisição/mensagem.
- **Dead-letter:** destino de mensagens que falharam repetidamente.
- **Consistência eventual:** estado que converge após um intervalo (aceitável para efeitos secundários, nunca para a operação crítica).

## 8. Operação e qualidade

- **Audit log:** trilha de ações sensíveis (quem, quando, o quê) — ver `AuditArchitecture.md`.
- **Histórico de domínio:** a evolução de estado de uma entidade de negócio (distinto de audit log e de logs técnicos).
- **Observabilidade:** logs estruturados, métricas, tracing e alertas (ver `Observability.md`).
- **RLS (Row Level Security):** filtro de acesso a linhas no PostgreSQL por tenant/usuário.
- **ADR:** Architecture Decision Record.
- **Bounded context:** fronteira de um domínio com modelo e linguagem próprios.

## 9. Integrações

- **Provedor fiscal:** serviço externo de emissão fiscal (ver `FiscalIntegration.md`).
- **Adapter:** camada que isola o Rescript de um fornecedor externo específico.
- **BSP (Business Solution Provider):** provedor de API de WhatsApp (futuro).
- **Webhook:** notificação HTTP recebida de um sistema externo.

---

> Regra: se um termo é usado em código ou documento e não está aqui, ele deve ser adicionado. A linguagem ubíqua evita ambiguidade entre times.
