---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 04-ProductWithVariants
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 04 — Produto com Variantes

## Cenário

Produto "Camisa" com atributos Cor e Tamanho; combinação duplicada falha; alteração de atributo após movimentação bloqueada; arquivamento de variante.

### Objetivo
Validar FD-08, RN-26 e integridade pós-movimentação (RN-04, I6).

### Atores
- Admin de catálogo
- Estoquista (entrada inicial para bloqueio)

### Estado inicial
Org ativa; atributos livres no escopo do produto (genéricos — não colunas fixas).

### Pré-condições
- Permissões `catalog.create`, `catalog.edit`, `inventory.entry`
- Política anti-caos FD-08 ativa

### Passos executados

#### 1. Criar produto e definir eixos de variação
1. **Comando:** `CreateProduct` + `DefineVariantAxes` (Cor, Tamanho)
2. **Autorização:** `catalog.create`
3. **Validações:** nomes normalizados trim/case-insensitive; ordem de apresentação
4. **Consultadas:** Product existente
5. **Criadas:** Product, AttributeDefinitions (Cor, Tamanho)
6. **Alteradas:** nenhuma variante vendável ainda
7. **Locks:** nenhum
8. **Auditoria:** criação
9. **Eventos:** `ProductCreated`
10. **Outbox:** nenhum
11. **Derivados:** nenhum
12. **Insight:** nenhum
13. **Falha:** nome de atributo vazio
14. **Recuperação:** corrigir input

#### 2. Criar variantes válidas
1. **Comando:** `CreateVariant` (Azul/P), `CreateVariant` (Azul/M), `CreateVariant` (Vermelho/P)
2. **Autorização:** `catalog.create`
3. **Validações:** combinação única por produto (FD-08 regra 4); preço ≥ 0; SKU único por org
4. **Consultadas:** variants existentes do produto
5. **Criadas:** 3 ProductVariants + VariantAttributes + InventoryItems
6. **Alteradas:** nenhuma
7. **Locks:** unique (product_id, attribute fingerprint)
8. **Auditoria:** cada variante
9. **Eventos:** `VariantCreated` ×3
10. **Outbox:** nenhum
11. **Derivados:** nenhum
12. **Insight:** nenhum
13. **Falha:** n/a neste subpasso
14. **Recuperação:** n/a

#### 3. Tentativa de combinação duplicada
1. **Comando:** `CreateVariant` (Azul/P) novamente
2. **Autorização:** `catalog.create`
3. **Validações:** duplicidade detectada → falha
4. **Consultadas:** fingerprint de atributos
5. **Criadas:** nenhuma
6. **Alteradas:** nenhuma
7. **Locks:** constraint previne race
8. **Auditoria:** tentativa opcional
9. **Eventos:** nenhum
10. **Outbox:** nenhum
11. **Derivados:** nenhum
12. **Insight:** nenhum
13. **Falha:** erro claro "combinação já existe"
14. **Recuperação:** editar variante existente se necessário

#### 4. Movimentação e bloqueio de alteração estrutural
1. **Comando:** `RegisterInventoryEntry` Azul/P qty=50; depois `UpdateVariantAttributes` tentando mudar Cor
2. **Autorização:** inventory + catalog.edit
3. **Validações:** variant com movimentos/histórico → bloqueio de alteração de eixo que invalidaria rastreio (RN-04, I6); inativação permitida, não apagar
4. **Consultadas:** InventoryMovement count, SaleItem history
5. **Criadas:** movimento de entrada
6. **Alteradas:** saldo Azul/P
7. **Locks:** balance lock na entrada
8. **Auditoria:** movimento imutável
9. **Eventos:** `InventoryMoved`
10. **Outbox:** nenhum
11. **Derivados:** avg cost Azul/P
12. **Insight:** nenhum
13. **Falha:** alteração de atributo → rejeição; correção via nova variante + transferência futura
14. **Recuperação:** criar nova variante; inativar antiga após estoque zerado

#### 5. Arquivar (inativar) variante
1. **Comando:** `DeactivateVariant` (Vermelho/P sem vendas recentes, saldo=0)
2. **Autorização:** `catalog.edit`
3. **Validações:** RN-24 — não aparece em novas vendas; histórico preservado
4. **Consultadas:** saldo, vendas abertas
5. **Criadas:** nenhuma
6. **Alteradas:** variant status=inactive
7. **Locks:** nenhum
8. **Auditoria:** inativação
9. **Eventos:** `VariantDeactivated`
10. **Outbox:** nenhum
11. **Derivados:** catálogo filtrado
12. **Insight:** nenhum
13. **Falha:** variante com pedido aberto reservando
14. **Recuperação:** cancelar/liberar pedidos primeiro

### Estado final esperado
3 variantes ativas + 1 inativa; duplicata impedida; atributos imutáveis após movimento; histórico intacto.

### Invariantes verificadas
FD-08, RN-26, RN-24, I1, I6, G2; SKU único; combinação única.

### Inconsistências encontradas
- Regra exata "bloquear alteração de atributo após movimento" não está numerada em BusinessRules — inferida de RN-04 + I6; **decisão do fundador necessária** para política de correção (nova variante vs. compensação).
- Limite N de atributos por variante (FD-08 regra 5) sem número fechado.

### Ajustes recomendados
- Formalizar RN ou política: atributos imutáveis após primeiro movimento ou primeira venda confirmada.
- Definir N máximo de atributos no MVP (ex.: 5).

### Classificação
**aprovado com ressalvas**
