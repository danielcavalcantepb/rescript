---
Status: Active
Owner: Domain Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: domain / ValueObjects
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Value Objects

> Objetos definidos pelos seus **valores**, sem identidade própria, **imutáveis**. Encapsulam regras que, de outra forma, se espalhariam pelo sistema.
> Status: Modelagem conceitual (DDD).

---

## 1. O que faz um Value Object

- **Sem identidade:** `Money(10, BRL)` é igual a qualquer outro `Money(10, BRL)`.
- **Imutável:** operar cria um novo VO; nunca se altera o existente.
- **Auto-validante:** um VO inválido **não pode existir** (ex.: `Email` sem "@" não é construído).
- **Rico em comportamento:** encapsula regras (ex.: `Money.add` respeita a moeda).

> Critério de decisão: "isto tem ciclo de vida e identidade?" → Entidade. "Isto é um valor com regras?" → Value Object.

---

## 2. Avaliação dos VOs propostos

Cada candidato do briefing foi avaliado: **adotar agora**, **adotar (VO simples)**, **futuro** ou **não é VO**.

| Candidato | Veredito | Racional |
|---|---|---|
| **Money** | ✅ Adotar (crítico) | Dinheiro nunca é `float`; carrega valor + moeda + regras |
| **Email** | ✅ Adotar | Validação e normalização centralizadas |
| **Phone** | ✅ Adotar | Formato BR; base para WhatsApp futuro |
| **Document** (CPF/CNPJ) | ✅ Adotar (crítico) | Validação de dígito; tipo PF/PJ; unicidade por org |
| **Address** | ✅ Adotar | Agrupa CEP/logradouro/cidade/UF |
| **Period** | ✅ Adotar | Intervalo de datas; base para insights e relatórios |
| **Percentage** | ✅ Adotar | Descontos, juros, margens; evita erro de 0.1 vs 10% |
| **Quantity** | ✅ Adotar (crítico) | Valor + unidade; regras de não-negatividade e fracionamento |
| **SKU** | ✅ Adotar | Código único por org; formato normalizado |
| **Barcode** | ✅ Adotar (simples) | EAN/GTIN; validação opcional |
| **TaxRate** | 🟡 Futuro (Fiscal) | Nasce quando o Fiscal for detalhado; delegado ao provedor |
| **Color** | 🟡 Repensar | É **atributo de variante**, não VO universal; ver §5 |
| **Dimension** | 🟡 Futuro | Só quando houver logística/frete |
| **Weight** | 🟡 Futuro | Só quando houver logística/frete/venda por peso |

---

## 3. Value Objects Centrais (detalhe)

### 3.1. Money (o mais importante)
- **Representa:** uma quantia monetária.
- **Composição:** `amount` (decimal exato, nunca float) + `currency` (da organização; MVP operacional = BRL — FD-07).
- **Regras/invariantes:** operações só entre mesma moeda; sem FX no MVP; não espalhar literal `"BRL"` pelo domínio — usar moeda da org; preços ≥ 0.
- **Comportamento:** somar, subtrair, multiplicar por `Quantity`, aplicar `Percentage`, comparar.
- **Nunca:** número solto sem moeda; float binário; conversão cambial no MVP.

### 3.2. Quantity (FD-06 — inteiras e fracionadas)
- **Representa:** uma quantidade de item.
- **Composição:** `value` (decimal exato, **nunca** float binário) + `unit`.
- **Regras oficiais:** unidades inteiras (un, cx, pct → precisão 0) e fracionadas (kg, g, m, L → precisão por unidade); arredondamento explícito; quantidade mínima e múltiplo de venda opcionais por variante; em venda, quantity > 0.
- **Comportamento:** somar/subtrair (mesma unidade), comparar, multiplicar por `Money`.

### 3.3. Document (CPF/CNPJ)
- **Representa:** documento fiscal de uma pessoa/empresa.
- **Composição:** `value` normalizado + `type` (CPF/CNPJ).
- **Regras:** validação de dígitos verificadores; tipo derivado do formato; **unicidade é regra de Customer por organização** (não do VO em si).
- **Nunca:** aceitar documento inválido; guardar formatação inconsistente.

### 3.4. Percentage
- **Representa:** uma proporção (desconto, juros, margem, alíquota comercial).
- **Composição:** um valor proporcional único (representação interna única e sem ambiguidade).
- **Regras:** faixa válida conforme uso (ex.: desconto 0–100%); aplicar a `Money` retorna `Money`.
- **Evita:** o clássico erro "0.1 significa 10% ou 0,1%?".

### 3.5. Period
- **Representa:** um intervalo de tempo (início–fim).
- **Regras:** início ≤ fim; pode ser aberto (sem fim); base para insights ("período analisado") e relatórios.
- **Comportamento:** conter uma data, sobrepor outro período, duração.

### 3.6. Email / Phone / Address
- **Email:** normalizado, validado; identidade de contato.
- **Phone:** formato BR (DDD + número); base para mensageria futura; distinção fixo/móvel/WhatsApp opcional.
- **Address:** CEP, logradouro, número, complemento, bairro, cidade, UF; VO agrupador (endereço muda como um todo).

### 3.7. SKU / Barcode
- **SKU:** código interno único por organização; normalizado (sem espaços/caixa inconsistente). Unicidade é invariante de Catalog.
- **Barcode:** código de barras (EAN/GTIN); validação de formato opcional; pode haver mais de um por variante (futuro).

---

## 4. Value Objects adicionais que o domínio revelou

Conceitos que **emergiram** da modelagem e merecem ser VOs:

| VO | Representa | Contexto |
|---|---|---|
| **MoneyRange / AmountRange** | Faixa de valores (ex.: filtro, meta) | Insights |
| **DiscountLine** | Um desconto aplicado (valor **ou** percentual) com motivo | Sales |
| **PaymentMethod** | Forma de pagamento (dinheiro, PIX, cartão, boleto) | Finance |
| **InstallmentPlan** | Plano de parcelamento (nº de parcelas, intervalo) | Sales/Finance |
| **DueDate** | Data de vencimento com regras de dia útil (futuro) | Finance |
| **Severity** | Nível de um insight (informativo/atenção/crítico) | Insights |
| **InsightNature** | Fato / Projeção / Recomendação | Insights |
| **ColumnMapping** | Mapa coluna→campo de uma importação | Imports |
| **PermissionKey** | `recurso.ação` | Access |

> `PaymentMethod` e `Severity`/`InsightNature` poderiam ser enums; tratamo-los como VOs por carregarem regras/comportamento (ex.: `PaymentMethod` pode ter taxa associada).

---

## 5. Casos que **não** são Value Objects universais

- **Color / Size:** não são VOs fixos do núcleo — são possíveis **valores** de `VariantAttribute` genérico (FD-08), com regras anti-caos (normalização, combinação única, ordem, validação, filtro).
- **Dimension / Weight:** futuros (logística).
- **TaxRate:** futuro / provedor fiscal.

### VariantAttribute (regras oficiais — FD-08)
1. Nome normalizado no escopo do produto.
2. Valor normalizado; vazio inválido.
3. Ordem de apresentação por produto.
4. Combinação de atributos **única** por produto.
5. Limites sensatos de quantidade/tamanho de atributos.
6. Atributos obrigatórios opcionais por produto/categoria.
7. Pesquisa/filtro por nome+valor.
8. Produto sem variações → variante padrão; UI simples.

---

## 6. Invariantes gerais de Value Objects

1. VO inválido nunca é construído.
2. Imutáveis; igualdade por valor.
3. Sem ciclo de vida/eventos.
4. Sempre `Money` / `Quantity` — sem primitive obsession; sem float binário.

---

## 7. Decisões do fundador (fechadas)
- FD-06 unidades inteiras/fracionadas; FD-07 BRL operacional; FD-08 VariantAttribute genérico — ver `FounderDecisions.md`.
