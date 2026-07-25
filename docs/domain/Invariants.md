# Rescript — Invariantes

> Verdades que **sempre** devem valer. Uma invariante nunca é violada em nenhum estado válido do domínio. Se uma operação a violaria, a operação falha.
> Status: Modelagem conceitual (DDD). Configuráveis (políticas) em `BusinessPolicies.md`.

---

## 1. Invariantes Globais (todo o domínio)

- **G1 — Tudo pertence a uma organização.** Todo dado de negócio tem um tenant; nada existe "solto".
- **G2 — Histórico não se destrói.** Nenhuma operação apaga histórico financeiro ou operacional (cancela/estorna/inativa/anonimiza).
- **G3 — Dados derivados não substituem a fonte.** Saldos, situações e caixa são reconstruíveis dos ledgers/registros-fonte.
- **G4 — Dinheiro é `Money`, quantidade é `Quantity`.** Nunca primitivos soltos; dinheiro nunca em float binário.
- **G5 — Ações sensíveis são auditáveis e idempotentes.**
- **G6 — Toda mudança de estado respeita a máquina de estado** da entidade (`StateMachines.md`).

---

## 2. Invariantes por Agregado

### Organization / Access
- Sempre existe **exatamente um proprietário** por organização.
- Papéis existem **apenas** dentro de uma membership.
- Remover membership **revoga acesso imediatamente**.
- Convite é de **uso único**, escopado e expirável.
- Não há membership ativa sem organização (ativa).

### User
- **E-mail único** por identidade.
- User **não carrega** papéis nem organização.

### Customer
- **Documento único por organização** quando informado.
- Cliente **com histórico** não é apagado (inativa/anonimiza).

### Product / Catalog
- Todo produto tem **ao menos uma variante** (variante única quando não há variação).
- **SKU único por organização**.
- **Preço e custo ≥ 0**.
- Produto **vendido** não é apagado (inativa).

### InventoryItem (Core) ⭐
- **I1 — Nenhum movimento sem origem.**
- **I2 — Físico = soma do ledger** (InventoryMovement).
- **I3 — Disponível = físico − reservado.**
- **I4 — Reserva ≠ saída.** Reservation ≠ InventoryMovement.
- **I5 — Sem baixa duplicada.**
- **I6 — Movimentos e custo aplicado são imutáveis** (sem edição silenciosa; FD-01).
- **I7 — Cancelamento gera compensação.**
- **I8 — Custeio = médio ponderado**; saídas gravam custo vigente.
- **I9 — Estoque na variante** (não no Product diretamente).

### Sale (Core) ⭐
- **S1 — Total sempre calculado pelo sistema.**
- **S2 — Quantidade > 0 (precisão da unidade); preço ≥ 0; desconto não torna total negativo.**
- **S3 — Confirmação é atômica** (consumir reserva + saída + recebível + Confirmada).
- **S4 — Confirmada não é editada** (só cancelada).
- **S5 — SaleItem só via raiz Sale.**
- **S6 — Confirmação idempotente.**
- **S7 — Desconto respeita DiscountAuthorizationPolicy** (FD-05).
- **S8 — Sem agregado Order no MVP** — fases são estados da Sale.

### Receivable (Core) ⭐
- **R1 — "Pago" é derivado** dos pagamentos, nunca um booleano.
- **R2 — Saldo aberto = valor − pagamentos válidos.**
- **R3 — Soma das parcelas = total do recebível.**
- **R4 — Sem duplicidade de recebimento** (idempotência do pagamento).
- **R5 — Recebível tem origem** (venda/importação).
- **R6 — "Vencida" é derivado** da data + saldo aberto.
- **R7 — Estorno é compensação**, nunca exclusão do pagamento.
- **R8 — Cancelar venda não apaga o histórico financeiro** (cancela não pagos; estorna recebidos).

### FinancialEntry (Core)
- **F1 — Append-only**; nunca editado.
- **F2 — Caixa reconstruível** dos lançamentos.
- **F3 — Todo lançamento tem origem.**

### Insight (Core) ⭐
- **N1 — Rastreável:** regra, registros, período, natureza.
- **N2 — Sem dados suficientes → não é gerado.** Nunca inventa.
- **N3 — Deduplicado** (uma dedup-key = um insight ativo).
- **N4 — Expira / resolve;** nada de alertas velhos eternos.
- **N5 — Só lê o núcleo; nunca escreve.**

### ImportJob
- **IM1 — Idempotente** (reenvio não duplica).
- **IM2 — Não corrompe dados existentes** (valida + preview antes de aplicar).
- **IM3 — Escreve via serviços do domínio** (respeita as invariantes do núcleo).
- **IM4 — Registros criados marcam a origem** (rastreáveis).

### FiscalDocument
- **FD1 — Idempotente** (sem nota duplicada).
- **FD2 — Não altera estoque/financeiro.**
- **FD3 — Via adapter** (sem lock-in de provedor).

### Subscription
- **SB1 — Um plano vigente por vez.**
- **SB2 — Estado reflete em entitlements.**
- **SB3 — Assinatura do SaaS ≠ recebíveis do cliente** (Billing ≠ Finance).

### AuditEntry
- **A1 — Imutável e append-only.**
- **A2 — Isolado por organização.**
- **A3 — Registra quem/quando/organização/ação/entidade/estados/contexto.**

---

## 3. Invariantes Inter-Agregado (garantidas por serviços de domínio)

- **X1 — Confirmar venda** garante, atomicamente: baixa de estoque **e** geração de recebível **e** situação confirmada — ou nada (S3 + I5 + R5).
- **X2 — Cancelar venda** garante compensação coordenada de estoque e financeiro sem destruição (G2 + I7 + R8).
- **X3 — Registrar pagamento** recalcula a situação da parcela/recebível e gera lançamento — atomicamente (R2 + F1).
- **X4 — Autorização e Entitlement** são checagens independentes; ambas passam para a ação ocorrer.

---

## 4. Matriz Invariante × Onde é garantida

| Invariante | Garantida por |
|---|---|
| Sem baixa duplicada (I5, S6) | Idempotência + máquina de estado da venda |
| Saldo reconstruível (I2, F2) | Ledger append-only |
| "Pago" derivado (R1) | Modelo de Payment + situação derivada |
| Atomicidade da venda (S3, X1) | `SaleConfirmationService` + transação |
| Reserva ≠ saída (I4) | Modelo de Inventory + `StockAllocationService` |
| Insight rastreável (N1) | `InsightEvaluationService` + estrutura do Insight |
| Histórico preservado (G2) | Soft delete/anonimização + compensação |
| Isolamento por tenant (G1) | Modelo + (na implementação) RLS |

---

## 5. O que uma invariante NÃO é

- **Não** é validação de formulário (isso é conveniência de UI).
- **Não** é configurável (isso é política — `BusinessPolicies.md`).
- **Não** depende de ordem de execução externa — vale em qualquer estado consistente.

> Regra de ouro: se violar isto corrompe a confiança nos dados (`docs/DataTrust.md`), é invariante e o domínio a protege ativamente.
