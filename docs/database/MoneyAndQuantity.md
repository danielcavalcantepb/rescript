# Money e Quantity — Modelo Lógico

> FD-06, FD-07. Sem float binário. Implementação física **não** fechada (OQ-05).

---

## 1. Money (value object persistido)

| Componente | Categoria |
|---|---|
| amount | decimal monetário |
| currency | código ISO (org.currency; MVP operacional BRL) |

### Regras
- Operações só entre mesma currency.
- Sem FX no MVP.
- Não espalhar literal `"BRL"` no domínio — ler moeda da Organization.
- Preços ≥ 0; estornos/ajustes podem usar sinal conforme contexto.
- Totais sempre calculados no servidor.

### Recomendação para fase física (não aprovada como decisão)
| Opção | Prós | Contras |
|---|---|---|
| **A. Inteiro em menor unidade (centavos)** | Evita erro de arredondamento | Conversão UX; multi-currency menor unidade varia |
| **B. NUMERIC(p,s) decimal** | Natural; BRL 2 casas | Disciplina de arredondamento |

**Recomendação técnica:** NUMERIC com scale 2 para BRL no MVP **ou** centavos inteiros — escolher em OQ-05. Ambos válidos; ambos sem float.

---

## 2. Quantity

| Componente | Categoria |
|---|---|
| amount | decimal exato |
| unit_id | referência |
| precision | casas permitidas (da unit) |

### Regras
- Unidades inteiras: precision = 0.
- Fracionadas: precision > 0 (valores exatos por unit — OQ-01).
- Rounding mode por unit ao validar input.
- min_sale_qty / sale_multiple na variante.
- Comparação só na mesma unit.
- Conversão entre units: **proibida** sem fator explícito futuro (ConversionFactor FUT).

### Recomendação física
NUMERIC com scale ≥ max precision das units (ex.: 6) **ou** inteiro em “micros” com scale metadata — preferir NUMERIC alinhado à unit.precision. Nunca float/double.

---

## 3. Valores negativos
- Money negativo: estorno, ajuste financeiro.
- Quantity negativa: **não** em SaleItem; movimentos usam tipo (saída) + quantidade positiva **ou** signed quantity no ledger — **recomendação:** quantity sempre ≥ 0 + movement_type define direção (clareza).

---

## 4. Somas, rateios, descontos
- Soma de Money: mesma currency.
- Rateio futuro: regra de arredondamento documentada (último item absorve diferença).
- Desconto: Percentage ou Money; validação FD-05.
