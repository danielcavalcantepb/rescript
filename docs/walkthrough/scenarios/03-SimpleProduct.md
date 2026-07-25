# Cenário 03 — Produto Simples

## Cenário

Cadastro de produto sem variações visíveis: sistema cria variante padrão, unidade "un", SKU, preço, controle de estoque, entrada inicial e verificação de saldos físico/reservado/disponível e custo médio.

### Objetivo
Validar RN-25, FD-08 (variante padrão), FD-01/FD-06 e saldos I2–I3.

### Atores
- Estoquista ou Admin
- Sistema (cálculo de custo médio)

### Estado inicial
Organization com local padrão (**HYPOTHESIS:** 1 StockLocation "Principal"); unidade `un` (precision=0, inteira — FD-06).

### Pré-condições
- Permissão `catalog.create`, `inventory.adjust`
- Entitlement de produtos não esgotado

### Passos executados

#### 1. Criar produto simples
1. **Comando:** `CreateProduct` (nome, preço, SKU, unit=un, tracks_inventory=true)
2. **Autorização:** `catalog.create`
3. **Validações:** nome obrigatório (RN-20); preço ≥ 0; SKU único por org se informado (RN-21)
4. **Consultadas:** SKU uniqueness, Unit catalog
5. **Criadas:** Product, **ProductVariant padrão** (implícita — FD-08), InventoryItem (variant, location padrão)
6. **Alteradas:** nenhuma movimentação ainda
7. **Locks:** SKU unique constraint
8. **Auditoria:** criação de produto/variante
9. **Eventos:** `ProductCreated`, `VariantCreated`
10. **Outbox:** nenhum crítico
11. **Derivados:** saldos zerados
12. **Insight:** "Produto sem movimentação" (futuro)
13. **Falha:** SKU duplicado
14. **Recuperação:** outro SKU

#### 2. Entrada inicial de estoque com custo
1. **Comando:** `RegisterInventoryEntry` (variant, qty=100, unit_cost=R$ 10,00, motivo=estoque inicial)
2. **Autorização:** `inventory.entry`
3. **Validações:** qty > 0; precision da unidade (un = inteiros); custo ≥ 0 (RN-22)
4. **Consultadas:** InventoryItem, avg cost vigente
5. **Criadas:** InventoryMovement (tipo=entrada, custo aplicado na entrada)
6. **Alteradas:** físico 0→100; reservado 0; disponível 100; **custo médio → R$ 10,00** (FD-01 regra 1)
7. **Locks:** row lock InventoryItem/balance
8. **Auditoria:** movimento imutável (I6)
9. **Eventos:** `InventoryMoved`
10. **Outbox:** insight estoque ok
11. **Derivados:** valor em estoque = qty × avg_cost — **HYPOTHESIS:** avg por org+location+variant; FD-01 oficial diz por variante (location preparatório)
12. **Insight:** estoque saudável
13. **Falha:** qty fracionária em un → rejeição
14. **Recuperação:** corrigir quantidade

#### 3. Verificação de saldos
1. **Comando:** query `GetInventoryBalance`
2. **Autorização:** `inventory.read`
3. **Validações:** I3 disponível = físico − reservado
4. **Consultadas:** ledger sum, reservations active sum
5. **Criadas:** nenhuma
6. **Alteradas:** nenhuma
7. **Locks:** leitura consistente
8. **Auditoria:** n/a
9. **Eventos:** n/a
10. **Outbox:** n/a
11. **Derivados:** G3 reconstruível do ledger
12. **Insight:** nenhum
13. **Falha:** divergência ledger vs. cache → bug crítico
14. **Recuperação:** job de reconciliação

### Estado final esperado
Produto com 1 variante padrão; SKU único; físico=100, reservado=0, disponível=100; custo médio R$ 10,00; UI não expõe "variante" desnecessariamente.

### Invariantes verificadas
RN-25, RN-27, I2, I3, I8, I9, FD-01, FD-06, FD-08; movimento com origem (I1).

### Inconsistências encontradas
- **HYPOTHESIS** avg cost por location conflita levemente com FD-01 (variante only) — aceitável se location única no MVP.
- **HYPOTHESIS** precision default 3 decimais irrelevante para `un` (precision=0) — ok para kg/m futuros.
- Entrada sem custo (FD-01 regra 2) não exercitada neste cenário — documentar em cenário separado.

### Ajustes recomendados
- Teste explícito: produto simples na UI = 1 variant no modelo sempre.
- Documentar que serviço sem tracks_inventory não cria saldo/reserva.

### Classificação
**aprovado**
