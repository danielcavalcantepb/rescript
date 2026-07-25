# Rescript — Documento de Produto

> Documento oficial de produto: personas, jornadas, casos de uso, planos e princípios de experiência.
> Status: Product Discovery (pré-implementação).
> Complementa: `Vision.md`, `Modules.md`, `MVP.md`, `Navigation.md`.

---

## 1. Resumo do Produto

O **Rescript** é uma plataforma SaaS de **operação comercial** para pequenas e médias empresas. Ele reúne, em um único ambiente intuitivo, o cadastro de **clientes** e **produtos**, o controle de **estoque**, o registro de **vendas**, o **financeiro básico**, além de **indicadores** e **conclusões inteligentes** que dão visibilidade imediata do negócio.

Não é um ERP tradicional, nem um "ERP com IA". É uma plataforma enxuta no núcleo e **expansível por módulos**, desenhada para ser adotada sem treinamento e para acompanhar o crescimento da empresa por anos.

### Tese central e as três camadas

> **"O Rescript organiza a operação comercial e mostra ao dono o que precisa da atenção dele, antes que o problema aconteça."**

O produto opera em três camadas (a inteligência só existe sobre dados confiáveis):

1. **Registrar** — dados corretos e íntegros (clientes, produtos, vendas, estoque, recebimentos, movimentações, histórico).
2. **Automatizar** — uma ação gera todas as suas consequências (venda → baixa estoque → gera recebível → atualiza indicadores → registra histórico → recalcula projeções).
3. **Interpretar** — riscos, anomalias, pendências, tendências, oportunidades e a próxima ação recomendada.

A obsessão é **simplicidade**; a inteligência é **consequência** dela. Detalhes em `IntelligencePrinciples.md`, `DecisionCenter.md`, `InsightCatalog.md` e `DataTrust.md`.

---

## 2. Personas

### 2.1. Persona Primária — "Ricardo, o Dono-Gestor"

- **Contexto:** dono de uma distribuidora com 8 funcionários. Faz um pouco de tudo: vende, compra, cobra, gerencia.
- **Objetivos:** ter controle e visão do negócio; parar de depender de planilhas; saber se o mês fechou no positivo.
- **Frustrações:** sistemas complicados; perder tempo com burocracia; não confiar nos próprios números.
- **Como o Rescript ganha o Ricardo:** dashboard claro na primeira tela, controle de estoque e caixa sem esforço, sensação de estar no comando.
- **Frase típica:** *"Eu só quero abrir o sistema e entender na hora como está minha empresa."*

### 2.2. Persona Secundária — "Aline, a Operadora"

- **Contexto:** vendedora/atendente que registra vendas e atende clientes o dia todo.
- **Objetivos:** atender rápido, achar produto e cliente sem demora, não errar.
- **Frustrações:** sistema lento, muitos cliques, telas confusas.
- **Como o Rescript ganha a Aline:** fluxo de venda em poucos passos, busca instantânea, interface limpa.
- **Frase típica:** *"Se for difícil, eu volto pro caderno."*

### 2.3. Persona Terciária — "Carlos, o Contador"

- **Contexto:** contador externo que atende a empresa.
- **Objetivos:** receber números organizados e confiáveis, exportar relatórios.
- **Frustrações:** dados bagunçados, retrabalho de fechamento.
- **Como o Rescript ganha o Carlos:** relatórios exportáveis, financeiro consistente, base sempre atualizada.
- **Frase típica:** *"Me manda organizado que eu resolvo o resto."*

> **Prioridade de design:** encantar a **Aline** (adoção diária) e dar poder ao **Ricardo** (decisão). Se a equipe não usar, o dono cancela.

---

## 3. Jornada do Cliente (macro)

1. **Descoberta** — Ricardo descobre o Rescript (indicação, busca, anúncio) buscando "sistema simples para minha empresa".
2. **Avaliação** — cria conta em minutos, testa grátis, sente que "isso é fácil".
3. **Ativação** — cadastra os primeiros clientes/produtos e **registra a primeira venda** (momento "aha").
4. **Hábito** — a equipe passa a registrar vendas e consultar estoque todo dia.
5. **Confiança** — o dono passa a decidir com base nos indicadores.
6. **Expansão** — a empresa cresce e ativa novos módulos / sobe de plano.
7. **Defesa** — vira promotor e indica para outros donos.

---

## 4. Casos de Uso Centrais (MVP)

- Cadastrar e encontrar **clientes** rapidamente, com histórico de compras.
- Cadastrar **produtos** com preço, custo e controle de estoque.
- Registrar uma **venda**, que automaticamente baixa estoque e gera lançamento financeiro.
- Acompanhar **entradas e saídas** de caixa (contas a receber/pagar básico).
- Ver **indicadores** do negócio (vendas do dia/mês, ticket médio, top produtos, saldo).
- Gerar **relatórios** de vendas, estoque e financeiro.
- Controlar **níveis de estoque** e receber alerta de baixo estoque.

---

## 5. Estrutura de Planos do SaaS

Modelo de assinatura recorrente (mensal/anual), com estratégia **land-and-expand**: entrar fácil e crescer por uso, usuários e módulos.

> Nomes e valores abaixo são referência estratégica de Discovery, não decisão final de precificação.

### 5.1. Plano **Free** (aquisição / entrada)

- Objetivo: remover barreira de entrada e provar valor.
- 1 usuário, limites baixos (ex.: nº de produtos/clientes/vendas por mês).
- Núcleo essencial: clientes, produtos, vendas simples, dashboard básico.
- Sem módulos adicionais. Marca "Rescript" visível.

### 5.2. Plano **Essencial** (PME iniciante)

- Núcleo completo: Clientes, Produtos, Estoque, Vendas, Financeiro básico, Indicadores, Relatórios.
- Poucos usuários (ex.: até 3).
- Limites confortáveis para operação real.

### 5.3. Plano **Profissional** (PME em crescimento)

- Tudo do Essencial + mais usuários, mais relatórios, mais indicadores.
- Primeiros módulos avançados / integrações liberados.
- Permissões por papel (perfis de acesso).

### 5.4. Plano **Empresarial** (média empresa)

- Múltiplos usuários, módulos adicionais, integrações via API.
- Suporte prioritário, recursos avançados de relatório e controle.

### 5.5. Dimensões de precificação (drivers)

- **Usuários** (assentos).
- **Módulos ativos** (produção, compras, assistência etc.).
- **Volume** (limites de vendas/produtos/notas).
- **Integrações / API** (marketplace).

> **Princípio de pricing:** o cliente nunca deve ser punido por crescer de repente. Upgrades são suaves e o valor sempre precede o custo.

---

## 6. Princípios de Experiência (UX)

1. **Primeira tela = valor.** O dashboard mostra a saúde do negócio imediatamente.
2. **Um caminho óbvio por tarefa.** Sem labirinto de menus para ações do dia a dia.
3. **Linguagem humana.** "Venda", "Cliente", "Dinheiro que entrou" — não jargão contábil.
4. **Rápido e responsivo.** Busca instantânea, poucos cliques, funciona bem no celular e no desktop.
5. **Erros perdoáveis.** Confirmações claras, desfazer quando possível, validações amigáveis.
6. **Progresso visível.** Onboarding com checklist mostra o quanto falta para "estar pronto".
7. **Consistência.** Padrões visuais e de interação iguais em todos os módulos.

---

## 7. Modelo Mental do Produto

O Rescript se organiza em torno de **entidades** (o que a empresa tem) e **eventos** (o que a empresa faz):

- **Entidades:** Clientes, Produtos, Estoque, Contas financeiras.
- **Eventos:** Vendas, Movimentações de estoque, Lançamentos financeiros.
- **Leitura:** Indicadores e Relatórios (a interpretação dos eventos sobre as entidades).

Toda a experiência deriva desse modelo: você **cadastra entidades**, **registra eventos**, e o sistema **transforma em visão** — e, acima disso, em **conclusões e próximas ações** (a Camada 3, Interpretar).

---

## 7.1. A Inteligência do Produto

A inteligência do Rescript é o que diferencia "guardar dados" de "cuidar do negócio". Ela:

- **Emerge da operação** — não é uma camada de IA colada por cima.
- **É entregue como conclusão simples**, em linguagem humana, na Central de Decisão (`DecisionCenter.md`).
- **É confiável e rastreável** — toda conclusão responde "por que o Rescript está dizendo isso?" (`DataTrust.md`).
- **Começa determinística** (regras, cálculos, comparações, projeções auditáveis) e só usa IA generativa quando ela realmente simplifica.

Exemplos de conclusões: "Você pode ficar sem este produto em 6 dias.", "R$ 8.420 vencem nos próximos 7 dias.", "As vendas cresceram, mas sua margem caiu.". Catálogo completo em `InsightCatalog.md`; leis em `IntelligencePrinciples.md`.

---

## 7.2. WhatsApp como Ponto de Entrada (estratégia)

O ICP inicial vive no WhatsApp. O Rescript deve **reduzir fricção onde o cliente já trabalha** — sem transformar o WhatsApp em dependência obrigatória e sem virar uma central de atendimento completa agora.

Possibilidades avaliadas (evolução progressiva, principal foco em V2 — ver `Roadmap.md`):
- criar venda a partir de uma conversa;
- compartilhar orçamento e pedido;
- enviar cobrança de recebíveis;
- enviar acompanhamento e confirmação;
- enviar **resumo diário ao dono** e notificar **apenas o que é relevante** (ligado à Central de Decisão).

Princípios: o WhatsApp é **canal de conveniência**, não o sistema de registro; toda operação continua íntegra e rastreável no núcleo (`DataTrust.md`). Ver também `BeachheadAnalysis.md` (o wedge de WhatsApp é mais forte no segmento de distribuidoras).

---

## 8. Fora de Escopo do Produto (agora)

Para manter o foco, o Rescript **não** pretende ser, no MVP:

- Um sistema de contabilidade completo.
- Uma loja virtual / e-commerce próprio.
- Um sistema de manufatura complexa (MRP).
- Um sistema fiscal (emissão de NF-e) como recurso central.
- Uma ferramenta de marketing/CRM avançado.

Esses itens ou entram como **módulos futuros** ou como **integrações** (ver `Roadmap.md` e `Modules.md`).
