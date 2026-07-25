# Rescript — Política de Confiança nos Dados (Data Trust)

> Documento oficial da política de integridade e confiança dos dados.
> Premissa: **o Rescript não pode ser percebido como inteligente se os números forem inconsistentes.**
> Status: Estratégia (pré-arquitetura técnica). Define princípios, não implementação.

---

## 0. Por que este documento existe

A tese central do Rescript ("mostrar ao dono o que precisa da atenção dele, antes do problema") **depende inteiramente da confiança nos dados**. Uma única conclusão baseada em número errado destrói mais credibilidade do que dez conclusões certas constroem.

Por isso, a inteligência (Camada 3) **só é ligada sobre dados confiáveis** (Camadas 1 e 2). Este documento define o que "confiável" significa e como garantimos isso.

> Toda conclusão do Rescript precisa poder responder: **"Por que o Rescript está dizendo isso?"** — com dados rastreáveis.

---

## 1. Princípios de Confiança (invioláveis)

### DT1 — Integridade
Os dados refletem a realidade da operação. Uma venda registrada corresponde a produtos, valores e cliente reais; saldos batem com movimentações. Nenhum estado "impossível" é permitido (ex.: recebimento sem origem, baixa sem venda).

### DT2 — Rastreabilidade
Todo número tem origem. Um saldo de estoque é a soma auditável de suas movimentações; um valor a receber aponta para a venda que o gerou. Nada é "mágico".

### DT3 — Idempotência
A mesma operação nunca é contada duas vezes. Confirmar uma venda duas vezes (duplo clique, reenvio, falha de rede) gera **um** efeito, não dois. Duplicidade é a principal fonte de números errados — é combatida por design.

### DT4 — Consistência dos efeitos (atomicidade)
Os efeitos de uma operação acontecem por completo ou não acontecem. Nunca existirá venda confirmada sem baixa de estoque e sem recebível correspondente. Não há "meia operação".

### DT5 — Atualização confiável de indicadores
Indicadores e projeções derivam sempre dos dados reais. Se um dado muda (venda cancelada), os indicadores e conclusões refletem a mudança de forma coerente. Indicadores nunca são digitados nem "estimados na tela".

### DT6 — Histórico imutável
O que aconteceu não é reescrito silenciosamente. Correções geram registros novos e auditáveis (estorno, ajuste), preservando a trilha do que ocorreu. O passado é memória, não rascunho.

### DT7 — Correções auditáveis
Corrigir é permitido e esperado — mas sempre visível: quem corrigiu, quando, o que mudou e por quê. Correção nunca apaga a história.

### DT8 — Exclusões controladas
Entidades com histórico não são apagadas de forma a corromper registros passados (usa-se inativação/exclusão lógica). Operações efetivadas (vendas **confirmadas**) não são apagadas — são canceladas com rastro.

### DT9 — Conciliação
O sistema oferece formas de confirmar que os números batem (ex.: saldo de caixa vs. lançamentos; estoque físico vs. sistema via ajuste auditável). Divergências são visíveis e reconciliáveis, não escondidas.

### DT10 — Transparência de projeções
Projeções (caixa futuro, dias até ruptura) são sempre marcadas como estimativas, com o método e as premissas acessíveis (IP4 em `IntelligencePrinciples.md`). Projeção nunca se disfarça de fato.

### DT11 — Dados insuficientes = honestidade
Quando não há dados suficientes para uma conclusão confiável, o Rescript **diz isso** em vez de arriscar um palpite. "Ainda não temos histórico suficiente para projetar" é uma resposta válida e preferível a um número inventado.

### DT12 — Atrasos de sincronização visíveis
Quando um dado ainda está sendo processado ou veio de uma integração com atraso, o estado é comunicado (ex.: "atualizado há X min"), para o usuário nunca decidir sobre informação que ele acredita ser atual mas não é.

---

## 2. Como cada camada sustenta a confiança

| Camada | Papel na confiança | Garantias-chave |
|---|---|---|
| **1. Registrar** | Dado entra correto | DT1 integridade, DT2 rastreabilidade, DT8 exclusões |
| **2. Automatizar** | Consequências corretas | DT3 idempotência, DT4 atomicidade, DT5 indicadores |
| **3. Interpretar** | Conclusões honestas | DT10 projeções, DT11 dados insuficientes, DT12 sync |

> A inteligência (Camada 3) **não é ativada** para um domínio enquanto as Camadas 1 e 2 daquele domínio não forem confiáveis. Ex.: só projetamos ruptura de estoque quando as movimentações daquele produto são íntegras.

---

## 3. A pergunta que todo insight deve responder

Cada conclusão exibida precisa ter uma resposta pronta para:

> **"Por que o Rescript está dizendo isso?"**

A resposta é composta por:
1. **O dado** que originou (quais vendas/movimentações/contas).
2. **A regra ou cálculo** aplicado (ver `InsightCatalog.md`).
3. **O tipo** (fato, projeção ou recomendação).
4. **A confiança** (alta/média/baixa) e por quê (ex.: pouco histórico).

Se um insight não consegue responder isso, ele **não é exibido**.

---

## 4. Tratamento de casos difíceis

- **Estoque negativo:** permitido com alerta por padrão (não trava a operação — ver `BusinessRules.md`), mas sinalizado como inconsistência a reconciliar.
- **Venda cancelada após efeitos:** estorno auditável de estoque e financeiro; indicadores e projeções recalculados.
- **Importação de dados:** dados importados são marcados quanto à origem; o sistema não trata estimativa de importação como fato operacional sem validação.
- **Dados de demonstração:** claramente identificados como demo; nunca se misturam com dados reais nem alimentam conclusões reais.
- **Integrações externas (futuro):** dados de terceiros carregam origem e horário de sincronização (DT12).

---

## 5. Confiança como métrica

A confiança não é só técnica — é **percebida**. Medimos (ver `NorthStarMetric.md`):
- **Confiança declarada nos números** (o usuário confia sem reconferir?).
- **% de insights considerados úteis** e **% dispensados** (proxy de qualidade/ruído).
- **Taxa de correção/estorno** (proxy de integridade operacional).

> Meta cultural: o cliente parar de "conferir na planilha por segurança". O dia em que ele confia no número sem recalcular é o dia em que a confiança venceu (momento wow #8 em `WhyRescript.md`).

---

## 6. Relação com os Demais Documentos

- **O que a confiança habilita:** `IntelligencePrinciples.md`, `DecisionCenter.md`, `InsightCatalog.md`.
- **As regras operacionais que a sustentam:** `BusinessRules.md`.
- **As leis supremas:** `TheTwentyCommandments.md` (Mandamento VIII — números sempre confiáveis).
- **A fundação técnica futura:** `ArchitectureOverview.md` (consistência, idempotência, auditoria).

> Confiança nos dados não é um recurso — é a licença para o Rescript ter o direito de dar conselhos.
