# Rescript — Retenção

> Documento oficial da estratégia de retenção e combate ao churn.
> Em SaaS PME, retenção é o motor econômico: sem ela, aquisição só queima capital.
> Status: Estratégia (pré-arquitetura técnica).

---

## 1. Por que Retenção é o Coração do Negócio

Um SaaS é um balde. Aquisição enche; churn esvazia. **Não importa quão rápido você enche se o balde vaza.** Para o Rescript, de ticket baixo e alto volume, isso é ainda mais crítico: o LTV depende inteiramente de o cliente ficar meses/anos.

Verdades que orientam este documento:
- **Reter é mais barato que adquirir.**
- **A retenção começa na ativação** (`Activation.md`).
- **Retenção alta viabiliza tudo:** indicação, expansão, unit economics e escala do GTM.
- **A melhor retenção é o produto virar infraestrutura do negócio** — quando desligar o Rescript significa parar a operação.

---

## 2. O que Significa "Reter" no Rescript

Retenção não é "não cancelar" — é **continuar recebendo valor e usando**. Medimos retenção pelo **uso real** (ligado à North Star), não apenas pela assinatura ativa.

### Camadas de retenção
1. **Retenção de uso:** a empresa registra operações toda semana (base da NSM).
2. **Retenção de logo (conta):** a empresa mantém a assinatura.
3. **Retenção de receita:** a receita da base se mantém e cresce (expansão > churn).

---

## 3. O Fosso de Retenção: virar infraestrutura

O Rescript retém quando se torna **indispensável**. Isso acontece por três mecanismos:

1. **Dados acumulados:** quanto mais a empresa usa, mais seu histórico (clientes, vendas, estoque, financeiro) vive no Rescript. Sair significa perder a memória do negócio.
2. **Hábito operacional:** a equipe opera no Rescript todo dia (Aline). O hábito é o fosso comportamental.
3. **Integração do núcleo:** vendas + estoque + financeiro entrelaçados fazem o sistema valer mais que a soma das partes.

> Importante: fosso por **valor**, nunca por **aprisionamento**. Respeitamos o cliente (V2 em `MissionVisionValues.md`) — dados são exportáveis. Retemos porque somos bons, não porque prendemos.

---

## 4. Métricas de Retenção

| Métrica | O que mede | Nota |
|---|---|---|
| **Retenção D30 / D60 / D90** | % de empresas ainda ativas após 30/60/90 dias | Curva deve estabilizar (platô), não cair a zero |
| **Churn de logo (mensal)** | % de empresas que cancelam | Vigiar de perto; alvo baixo |
| **Churn de receita (bruto)** | % de MRR perdido | — |
| **NRR (Net Revenue Retention)** | Receita da base + expansão − churn | **> 100% é o objetivo** |
| **% uso semanal** | Empresas que operam ≥1x/semana | Ligada à NSM |
| **Profundidade de uso** | Empresas usando os 3 pilares | Preditor de retenção |
| **Curva de retenção por coorte** | Comportamento de cada safra | Base da análise |

> Meta estratégica: **curva de retenção com platô** (empresas que ficam, ficam) e **NRR acima de 100%** (a base cresce sozinha via expansão).

---

## 5. Sinais de Churn (early warning)

Monitorar e agir **antes** do cancelamento:

| Sinal | Interpretação | Ação |
|---|---|---|
| Queda no nº de operações/semana | Perda de hábito | Reengajamento proativo |
| Só o dono usa (sem operadores) | Adoção de equipe falhou | Ajudar a convidar/treinar equipe |
| Usa só vendas, ignora estoque/financeiro | Uso raso | Guiar à profundidade (valor integrado) |
| Login sem registrar operações | Valor não percebido | Onboarding de retorno |
| Ticket de suporte não resolvido | Frustração | Suporte prioritário / resgate |
| Descoberta tardia de necessidade fiscal | Gap de produto | Roadmap fiscal / integração |
| Fim do trial sem ativação | Nunca ativou | Fluxo de ativação de resgate |

---

## 6. Alavancas de Retenção

### 6.1. Produto
- **Confiabilidade dos números (P7):** um erro de estoque/financeiro destrói a confiança e gera churn imediato. Consistência é retenção.
- **Operação diária impecável (P6):** velocidade e simplicidade mantêm o hábito.
- **Profundidade progressiva:** guiar a empresa a usar estoque e financeiro, não só vendas.
- **Valor recorrente visível:** indicadores e relatórios que reforçam, toda semana, "olha o que você ganhou usando o Rescript".
- **A Central de Decisão como motor de hábito:** a inteligência é o principal motivo de o dono **voltar todo dia** — o sistema recompensa a visita dizendo o que precisa de atenção e o que pode acontecer em breve. Um insight que evita um problema real (ruptura, caixa negativo, inadimplência) cria dependência emocional que preço nenhum de concorrente quebra (ver `DecisionCenter.md`, `WhyRescript.md`). **Ressalva:** um insight errado tem o efeito oposto — por isso confiança nos dados (`DataTrust.md`) é pré-condição de retenção.
- **Novos módulos** que aumentam a dependência saudável (compras, fiscal — ver `Roadmap.md`).

### 6.2. Experiência / Sucesso do Cliente
- **Onboarding forte** (a raiz da retenção).
- **Suporte humano e rápido** quando o self-service falha.
- **Comunicação de valor** (resumos, dicas, boas práticas).
- **Reengajamento** automatizado nos sinais de risco.

### 6.3. Comercial
- **Preço honesto e previsível** (sem surpresas que geram cancelamento).
- **Plano anual** (compromisso maior, churn menor).
- **Expansão suave** (upgrade quando faz sentido, não forçado).

---

## 7. Expansão (Negative Churn / NRR > 100%)

A retenção ideal é **negativa** em churn líquido: a base cresce mesmo sem novos clientes. Alavancas de expansão:

- **Upgrade de plano** conforme a empresa cresce (mais usuários, mais volume).
- **Ativação de módulos** (compras, fiscal, produção, projetos).
- **Mais assentos** (equipe crescendo).
- **Integrações/marketplace** (futuro).

> Expansão é retenção com sinal positivo. Um produto que "cresce sem migrar" (P10) captura naturalmente o crescimento do cliente como crescimento de receita.

---

## 8. Retenção por Persona

- **Ricardo (dono):** retido pela clareza contínua (dashboard/relatórios) e confiança nos números.
- **Aline (operadora):** retida pela facilidade diária; se a operação fica lenta ou confusa, ela sabota → risco.
- **Fernanda (gestora):** retida por "crescer sem migrar" e por módulos que acompanham a evolução.
- **Carlos (contador):** retido/aliado quando os números batem e exportam sem retrabalho (e vira fonte de indicação).

---

## 9. O Ciclo Virtuoso da Retenção

```
Ativação forte → hábito de uso → confiança nos números →
profundidade (3 pilares) → dependência saudável →
expansão (planos/módulos) → NRR > 100% →
economics saudáveis → reinvestir em produto → ativação ainda melhor
```

Quebrar qualquer elo derruba o ciclo. Por isso retenção é responsabilidade de **produto, sucesso do cliente e comercial juntos** — não de um único time.

---

## 10. Princípios de Retenção (resumo)

1. Retenção começa na ativação.
2. Confiabilidade dos números é inegociável (churn instantâneo se falhar).
3. Reter por valor, nunca por aprisionamento.
4. Profundidade de uso (3 pilares) é o melhor preditor.
5. Agir nos sinais de risco antes do cancelamento.
6. NRR > 100% é o objetivo econômico central.
7. Nunca escalar aquisição sobre retenção fraca.
