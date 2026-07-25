# Rescript — Filosofia de Produto

> Documento oficial de cultura e filosofia de construção de produto.
> Cinco perguntas: **como pensamos, como decidimos, como priorizamos, como recusamos funcionalidades, como protegemos a experiência.**
> Complementa `CorePrinciples.md` e `TheTwentyCommandments.md` (as leis) com a mentalidade por trás delas.
> Status: Estratégia (pré-arquitetura técnica).

---

## 0. A Tese Central

> **A complexidade é o inimigo. Nosso trabalho não é adicionar recursos — é remover trabalho, decisões e ansiedade da vida do cliente.**

Nossa obsessão é uma só: **simplicidade** — definida não como "ser fácil", mas como **remover**. Velocidade, automação, inteligência e experiência são galhos; simplicidade é a raiz (ver `WhyRescript.md`, Seção 5).

**Tese central do produto:** *"O Rescript organiza a operação comercial e mostra ao dono o que precisa da atenção dele, antes que o problema aconteça."* A inteligência é **consequência** da simplicidade e da confiança nos dados — nunca um "ERP com IA". Ela é entregue como **conclusão simples**, jamais como um painel de BI que transfere ao usuário o trabalho de interpretar (ver `IntelligencePrinciples.md`, `DecisionCenter.md`, `DataTrust.md`).

Somos, antes de tudo, **curadores de simplicidade**. Todo software de gestão tende à entropia: cada cliente pede um campo, cada concorrente lança uma feature, cada exceção vira uma opção. Esta filosofia existe para resistir a essa força por 20 anos.

---

## 1. Como Pensamos

### 1.1. Pensamos em remoção, não em adição.
A pergunta padrão não é "o que podemos adicionar?", mas "o que podemos tirar da vida do cliente?". O sucesso é medido por trabalho eliminado, não por funcionalidades entregues.

### 1.2. O usuário não quer software — quer resultado.
Ninguém acorda querendo "usar um sistema". Querem vender, controlar o estoque, dormir tranquilos. O software é meio; o resultado (clareza, tempo, paz) é o fim.

### 1.3. Cada recurso tem um imposto permanente.
O custo de uma feature não é construí-la — é **conviver com ela para sempre**: mais telas para entender, mais decisões para o usuário, mais peso, mais manutenção. Por isso o padrão é "não" até o valor provar o contrário.

### 1.4. Simplicidade é trabalho duro, não preguiça.
Ser simples por fora exige ser sofisticado por dentro. Pagamos o custo de engenharia e design para que o cliente não pague o custo de complexidade.

### 1.5. A operação diária é o produto.
90% do valor está nos 10% de telas usadas todo dia. O raro pode ser "bom o suficiente"; o comum precisa ser perfeito.

### 1.6. Confiança se perde num número errado.
Um saldo incorreto não é "um bug" — é a quebra do contrato. Preferimos ser mais lentos a ser imprecisos.

### 1.7. Construímos para 20 anos, entregamos valor hoje.
Durabilidade (sem reescrita, sem trair a marca) não é desculpa para paralisia.

---

## 2. Como Decidimos

Toda ideia de produto passa por um **funil de decisão**. Se falhar em qualquer etapa eliminatória, é rejeitada — sem exceção.

1. **Serve ao ICP e às personas?** (`IdealCustomerProfile.md`, `Personas.md`) — se não, pare.
2. **Respeita os princípios inquebráveis?** (`CorePrinciples.md`, `TheTwentyCommandments.md`) — *eliminatório absoluto.*
3. **Fortalece nossa obsessão (simplicidade) ou a corrói?** — se corrói, pare.
4. **Move a North Star ou a retenção?** (`NorthStarMetric.md`, `Retention.md`)
5. **O valor supera o imposto permanente de complexidade?**
6. **É núcleo, módulo ou não-fazer?**

### A pergunta do "só mais um"
Quando alguém disser "é só mais um campo/opção/tela", lembrar: **a morte por complexidade é sempre por mil pequenos "só mais um".** O acúmulo é o inimigo, não o item isolado.

### O teste final
> **"Isso torna a vida do cliente mais simples e o negócio dele mais claro — ou só torna o nosso produto maior?"**
> Se a resposta é "maior", é a decisão errada.

---

## 3. Como Priorizamos

Ordem de prioridade quando há conflito de recursos (alinhada a `Roadmap.md`):

1. **Confiabilidade dos números** — nada é lançado se compromete a exatidão.
2. **A operação diária** — o que a Aline e o Ricardo fazem todo dia vem antes de tudo.
3. **Ativação e retenção** — antes de aquisição e antes de expansão (`Activation.md`, `Retention.md`).
4. **Desbloqueadores de mercado** (ex.: fiscal) — antes de expansões de nicho.
5. **Demanda comprovada** — muitos pedidos do mesmo tipo, não uma anedota.
6. **Alavancas de receita** (planos/módulos) — expansão saudável (NRR).
7. **Apostas de escala** (BI, IA avançada, geografia) — por último.

**Regra de priorização inegociável:** um núcleo excepcional vem antes de qualquer módulo. Profundidade de valor antes de superfície de recursos.

---

## 4. Como Recusamos Funcionalidades

Dizer "não" é a habilidade central de produto do Rescript. É uma **política**, não um humor (`WhyRescript.md`, Seção 9).

### Recusamos com método:
- **Escutamos a dor, não a solução.** O cliente é especialista no problema; "quero o campo X" pode significar "preciso resolver Y". Muitas vezes a resposta é simplificar o que já existe, não adicionar.
- **Buscamos o padrão, não o caso único.** Um pedido é anedota; muitos pedidos são sinal.
- **Resolvemos para muitos, não para um.** Não distorcemos o produto por um cliente — mesmo pagante, mesmo grande.
- **Preferimos remover atrito a adicionar recurso.**

### Dizemos não a:
- **Feature parity** — não construímos algo só porque o concorrente tem.
- **O "e se"** — casos hipotéticos raros.
- **Recursos que servem poucos e confundem muitos** — viram módulo opcional ou não existem.
- **Clientes fora do foco** — inclusive recusando receita (a decisão impopular).

### Como registramos um "não":
Um pedido recusado não é ignorado — é **registrado com a dor por trás**. Se a dor reaparecer em escala, reavaliamos. "Não" hoje não é "nunca"; é "não sem evidência".

---

## 5. Como Protegemos a Experiência

A experiência é protegida ativamente, como um sistema imunológico contra a complexidade.

### 5.1. Guardas de simplicidade
- **Bons padrões vencem configuração** (nenhuma config obrigatória antes do primeiro valor).
- **Uma informação, digitada uma vez** — redigitação é bug de design.
- **Consistência total** — aprender uma tela é aprender todas.
- **Linguagem humana** — zero jargão de ERP na interface do operador.

### 5.2. Guardas de confiança
- **Exatidão inegociável** de estoque e financeiro.
- **Erros perdoáveis** — confirmação, desfazer, validações amigáveis.

### 5.3. Guardas de foco
- **O operador é cliente de primeira classe** — se a equipe não adota, falhamos.
- **Mobile e desktop de primeira classe** — o balcão, a rua e o escritório.
- **A inteligência é entregue como conclusão simples**, nunca como painel complexo (protege o wow de virar BI).

### 5.4. A métrica que prova que continuamos simples
Simplicidade é medida, não afirmada: acompanhamos **time-to-value e ativação** (`Activation.md`). Se subirem, complicamos — e corrigimos. Simplicidade sem métrica é só um adjetivo.

---

## 6. Anti-Exemplos (o que trai esta filosofia)

- Um "modo avançado" que vira o padrão.
- Copiar uma feature do concorrente sem passar pelo funil de decisão.
- Resolver o pedido de um cliente grande às custas de mil pequenos.
- Aceitar um número "quase certo" para entregar mais rápido.
- Empurrar configuração para o usuário em vez de escolher um bom padrão.
- Medir sucesso por features entregues em vez de valor adotado.
- Transformar o "wow inteligente" em um dashboard de BI cheio de gráficos.

---

## 7. Relação com os Demais Documentos

| Camada | Documento |
|---|---|
| Por que existimos (a verdade) | `WhyRescript.md` |
| Valores da empresa | `MissionVisionValues.md` |
| Leis do produto | `CorePrinciples.md` / `TheTwentyCommandments.md` |
| Como isso vira mercado | `Positioning.md` |
| Como priorizamos no tempo | `Roadmap.md` / `FutureModules.md` |
| Como medimos fidelidade | `NorthStarMetric.md` / `Activation.md` / `Retention.md` |

> A filosofia não é um texto inspiracional na parede — é o sistema imunológico do produto. Quando qualquer decisão a contrariar, a filosofia vence ou o conflito sobe para a liderança de produto.
