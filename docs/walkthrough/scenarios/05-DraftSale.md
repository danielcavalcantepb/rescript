# Cenário 05 — Venda em Rascunho

## Cenário

Vendedor monta venda em Rascunho: adiciona itens com cópia de preço, altera quantidades, aplica desconto permitido, salva; edição concorrente dispara optimistic locking por versão.

### Objetivo
Validar RN-40–42, S1–S2, FD-05 e concorrência em edição pré-confirmação.

### Atores
- Vendedor A
- Vendedor B (edição concorrente, opcional)
- Cliente cadastrado

### Estado inicial
Variantes com preço e estoque; Sale inexistente; política de desconto: teto 10% sem autorização (**HYPOTHESIS:** org-configurable — alinha FD-05).

### Pré-condições
- `sales.create`, `sales.edit`
- Variantes ativas com preço de lista

### Passos executados

#### 1. Criar rascunho e adicionar itens
1. **Comando:** `CreateSale` → `AddSaleItem` × N
2. **Autorização:** `sales.create`
3. **Validações:** qty > 0 com precision da unidade; preço ≥ 0; total calculado (S1)
4. **Consultadas:** ProductVariant.price, unit precision, customer status
5. **Criadas:** Sale (status=Rascunho, version=1), SaleItems com **preço copiado** do catálogo no momento da adição
6. **Alteradas:** total derivado recalculado
7. **Locks:** nenhum pesado
8. **Auditoria:** criação
9. **Eventos:** `SaleCreated`, `SaleItemAdded`
10. **Outbox:** nenhum
11. **Derivados:** subtotal, total
12. **Insight:** nenhum
13. **Falha:** variante inativa
14. **Recuperação:** escolher variante ativa

#### 2. Alterar quantidade e desconto permitido
1. **Comando:** `UpdateSaleItem` (qty); `ApplyDiscount` (8% — abaixo do teto)
2. **Autorização:** `sales.edit`; `sales.discount`
3. **Validações:** S2 — total não negativo; desconto dentro da política (S7)
4. **Consultadas:** DiscountAuthorizationPolicy
5. **Criadas:** registro de desconto (percentual, responsável)
6. **Alteradas:** SaleItems, total, version++
7. **Locks:** optimistic version check
8. **Auditoria:** desconto registrado (FD-05)
9. **Eventos:** `SaleUpdated`, `DiscountApplied`
10. **Outbox:** nenhum
11. **Derivados:** margem estimada se custo conhecido
12. **Insight:** margem reduzida se abaixo do limiar
13. **Falha:** desconto 15% sem autorização → bloqueio ou fluxo de autorização
14. **Recuperação:** solicitar autorização (`sales.discount.authorize`)

#### 3. Salvar rascunho
1. **Comando:** implícito em updates ou `SaveSaleDraft`
2. **Autorização:** `sales.edit`
3. **Validações:** estado=Rascunho; G6
4. **Consultadas:** Sale
5. **Criadas:** nenhuma adicional
6. **Alteradas:** updated_at, version
7. **Locks:** optimistic
8. **Auditoria:** persistência
9. **Eventos:** `SaleSaved`
10. **Outbox:** nenhum
11. **Derivados:** nenhum efeito estoque/financeiro (StateMachines T1)
12. **Insight:** pedido parado (futuro se abandonado)
13. **Falha:** n/a
14. **Recuperação:** n/a

#### 4. Edição concorrente (optimistic locking)
1. **Comando:** Vendedor A e B leem version=3; A salva (version→4); B tenta salvar com version=3
2. **Autorização:** ambos `sales.edit`
3. **Validações:** version mismatch → conflito
4. **Consultadas:** Sale.version, status=Rascunho
5. **Criadas:** nenhuma duplicata
6. **Alteradas:** só commit de A
7. **Locks:** optimistic version (ConcurrencyModel)
8. **Auditoria:** tentativa de B registrável
9. **Eventos:** apenas update de A
10. **Outbox:** nenhum
11. **Derivados:** nenhum
12. **Insight:** nenhum
13. **Falha:** B recebe 409/conflict com diff ou reload
14. **Recuperação:** B recarrega e reaplica edição

### Estado final esperado
Sale em Rascunho persistida; preços snapshot nos itens; total correto; desconto auditado; sem reserva/saída/recebível; version incrementada.

### Invariantes verificadas
S1, S2, S5, S7, S8, G6; nenhum efeito estoque/financeiro em Rascunho.

### Inconsistências encontradas
- Preço copiado na adição vs. recálculo ao confirmar (ConcurrencyModel: snapshot no confirm) — rascunho pode divergir do preço atual do catálogo; UX deve avisar.
- Desconto acima do teto: fluxo de autorização em dois passos não detalhado no MVP.

### Ajustes recomendados
- Indicador visual "preço desatualizado" se catálogo mudou desde última edição.
- Teste de desconto no limite exato do teto.

### Classificação
**aprovado**
