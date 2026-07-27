---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: CorePrinciples
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Princípios do Produto (Inquebráveis)

> Documento oficial de princípios fundamentais.
> Estas são leis, não sugestões. Toda decisão futura de produto, design e engenharia deve respeitá-las.
> Status: Estratégia (pré-arquitetura técnica).

---

## 1. Por que Princípios Inquebráveis

Empresas de produto não morrem por falta de ideias — morrem por falta de disciplina. À medida que o Rescript crescer, haverá pressão constante para adicionar recursos, atender exceções e complicar. **Estes princípios existem para dizer "não" quando for difícil dizer não.**

Regra de governança: **um princípio só pode ser alterado por decisão explícita da liderança de produto, documentada e justificada.** Nunca por conveniência de uma feature.

---

## 2. Os Princípios Inquebráveis

### P1 — Simplicidade sempre vence quantidade de funcionalidades.
Entre um produto poderoso-e-confuso e um produto simples-e-focado, escolhemos sempre o segundo. Recurso que ajuda poucos e confunde muitos não entra no núcleo — vira módulo opcional ou não existe.

### P2 — Uma informação é digitada uma única vez.
Nenhum dado deve ser redigitado. O que já existe é reutilizado. Redigitar é erro de design, não tarefa do usuário.

### P3 — O sistema reduz trabalho manual, nunca aumenta.
Toda funcionalidade deve tirar trabalho das costas do usuário. Se um recurso cria mais trabalho do que economiza, ele está errado.

### P4 — Toda automação economiza tempo real e visível.
Automação só se justifica se o usuário sente o ganho. Automação que só existe "por dentro" e não muda a vida do usuário é complexidade disfarçada.

### P5 — O usuário nunca deve se sentir usando um ERP complexo.
Linguagem humana, telas limpas, um caminho óbvio por tarefa. Se em algum momento o usuário pensar "isso é complicado como um ERP", falhamos.

### P6 — A operação diária é sagrada.
Os fluxos usados todo dia (registrar venda, achar cliente/produto, ver o caixa) devem ser rápidos, memoráveis e à prova de erro. Nada pode deixá-los mais lentos.

### P7 — Os números são sempre confiáveis.
Estoque e financeiro precisam estar sempre corretos e consistentes. Aqui não existe "quase certo". Confiança nos dados é inegociável.

### P8 — Valor antes de esforço.
O usuário deve ver benefício antes de ter que cadastrar tudo. Mostramos valor cedo; pedimos trabalho aos poucos.

### P9 — Bons padrões vencem configuração.
Configurar é atrito. O produto vem pronto com escolhas sensatas. Configuração existe só para exceções reais, nunca como pré-requisito de uso.

### P10 — Crescer nunca exige migrar.
Nenhuma decisão pode obrigar o cliente a trocar de plataforma ou refazer dados para crescer. A empresa evolui por módulos e planos, sem rupturas.

### P11 — O operador importa tanto quanto o dono.
Quem usa todo dia (vendedor, estoquista, atendente) é tão prioritário quanto quem paga. Se a equipe não adota, o dono cancela.

### P12 — Consistência é experiência.
Padrões visuais e de interação são iguais em todos os módulos. Aprender uma tela é aprender todas.

### P13 — Erros são perdoáveis.
Confirmações claras, possibilidade de desfazer, validações amigáveis. O sistema protege o usuário de si mesmo sem tratá-lo como incapaz.

### P14 — Cada recurso justifica sua existência.
Todo recurso tem dono, público e valor claros. Na dúvida, não construímos. Menos, porém melhor.

### P15 — Mobile e desktop são cidadãos de primeira classe.
A operação acontece no balcão, na rua e no escritório. A experiência precisa ser excelente em qualquer tela.

### P16 — A inteligência é consequência da simplicidade, não um recurso.
O Rescript mostra ao dono o que precisa de atenção antes do problema. Isso emerge da operação organizada — não é um "ERP com IA", chatbot ou copiloto genérico. Inteligência nunca substitui simplicidade; nasce dela (ver `IntelligencePrinciples.md`).

### P17 — Entregamos conclusões, não gráficos.
O sistema interpreta os dados e apresenta a conclusão e a próxima ação em linguagem clara. Se o usuário precisa montar relatório ou analisar para entender, falhamos (ver `DecisionCenter.md`).

### P18 — Nenhuma conclusão sem base rastreável.
Toda afirmação do sistema responde "por que o Rescript está dizendo isso?". Nunca inventamos dados; sempre diferenciamos fato, projeção e recomendação; sem alarmismo e sem sobrecarga de alertas (ver `IntelligencePrinciples.md`, `DataTrust.md`).

### P19 — Só interpretamos o que registramos e automatizamos com confiança.
A inteligência (Camada 3) só é ligada sobre dados confiáveis (Camadas 1 e 2). Um número errado destrói a credibilidade mais rápido do que dez conclusões certas a constroem (ver `DataTrust.md`).

---

## 3. Como Aplicar os Princípios (teste de decisão)

Antes de aprovar qualquer feature, ela passa por este filtro. **Se violar qualquer princípio, é repensada:**

1. Simplifica ou complica? (P1, P5)
2. Reaproveita dado ou pede redigitação? (P2)
3. Tira ou adiciona trabalho manual? (P3, P4)
4. Afeta a velocidade da operação diária? (P6)
5. Mantém os números confiáveis? (P7)
6. Entrega valor antes de exigir esforço? (P8)
7. Funciona com bons padrões, sem obrigar configuração? (P9)
8. Preserva o "crescer sem migrar"? (P10)
9. Serve o operador, não só o dono? (P11)
10. É consistente com o resto do produto? (P12)
11. Justifica existir? (P14)
12. Se envolve inteligência: entrega conclusão (não gráfico), é rastreável e nasce de dados confiáveis? (P16–P19)

---

## 4. Anti-Padrões (o que estes princípios proíbem)

- Telas com dezenas de campos "porque alguém pode precisar".
- Pedir o mesmo dado em dois lugares.
- Recursos que exigem tutorial para serem usados.
- Configuração obrigatória antes do primeiro valor.
- Jargão contábil/fiscal na interface do operador.
- "Modo avançado" que vira o modo padrão.
- Otimizar para o caso raro às custas do caso comum.
- Prender dados ou dificultar exportação/crescimento.

---

## 5. Relação com o Resto da Documentação

- Os princípios operacionalizam a `Vision.md` e o `Positioning.md`.
- Guiam a priorização do `Roadmap.md` e o desenho em `Navigation.md`.
- São detalhados em cultura de produto em `ProductPhilosophy.md`.
- Protegem as regras de `BusinessRules.md` (especialmente P7).

> Quando qualquer documento entrar em conflito com estes princípios, **os princípios prevalecem** — ou o conflito é escalado à liderança de produto.
