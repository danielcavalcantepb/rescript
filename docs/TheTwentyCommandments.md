# Rescript — Os 20 Mandamentos

> Documento oficial de leis supremas do produto.
> Estes 20 princípios têm **prioridade acima de qualquer funcionalidade**. Se uma funcionalidade violar um mandamento, a funcionalidade é descartada — não o mandamento.
> Status: Estratégia. Válido por toda a existência do Rescript.

---

## Preâmbulo

Uma funcionalidade é uma decisão de curto prazo. Um mandamento é uma decisão de 20 anos. Empresas de produto não morrem por falta de ideias — morrem por falta de disciplina para recusá-las. Estes mandamentos existem para dizer "não" quando for mais fácil dizer "sim".

**Regra de alteração:** um mandamento só pode ser alterado por decisão explícita, documentada e justificada da liderança de produto — nunca pela conveniência de uma feature, de um cliente ou de um trimestre. Na dúvida, o mandamento vence.

**Tese central que estes mandamentos protegem:** *"O Rescript organiza a operação comercial e mostra ao dono o que precisa da atenção dele, antes que o problema aconteça."* A obsessão é simplicidade; a inteligência é consequência dela (Mandamentos XIV e XV). A confiança nos dados (Mandamento VIII) é a licença para o Rescript ter o direito de dar conselhos.

---

## Os 20 Mandamentos

### I. A simplicidade está acima de tudo.
Entre um produto poderoso-e-confuso e um simples-e-focado, escolhemos sempre o segundo. A simplicidade é nossa obsessão, não um recurso.

### II. Removeremos antes de adicionar.
A pergunta padrão é "o que podemos tirar?", não "o que podemos incluir?". Adicionar é a exceção que precisa se justificar.

### III. Uma informação será digitada uma única vez.
Nenhum dado será redigitado. Redigitação é um defeito de design, não uma tarefa do usuário.

### IV. O sistema reduzirá trabalho humano, jamais o aumentará.
Todo recurso deve tirar trabalho das costas do cliente. Se cria mais trabalho do que economiza, está errado.

### V. Toda automação economizará tempo real e visível.
Automação que o usuário não sente é complexidade disfarçada. O ganho precisa ser percebido.

### VI. O usuário nunca se sentirá usando um ERP complexo.
Linguagem humana, telas limpas, um caminho óbvio por tarefa. Se ele pensar "isto é complicado", falhamos.

### VII. A operação diária é sagrada.
Os fluxos usados todo dia serão rápidos, memoráveis e à prova de erro. Nada pode deixá-los mais lentos.

### VIII. Os números serão sempre confiáveis.
Estoque e financeiro estarão sempre corretos e consistentes. Não existe "quase certo". Exatidão vence velocidade.

### IX. Entregaremos valor antes de exigir esforço.
O cliente verá benefício antes de precisar cadastrar tudo. Mostramos valor cedo; pedimos trabalho aos poucos.

### X. Bons padrões vencerão a configuração.
O produto vem pronto com escolhas sensatas. Configuração existe só para exceções reais — nunca como pré-requisito de uso.

### XI. Crescer nunca exigirá migrar.
Nenhuma decisão obrigará o cliente a trocar de plataforma ou refazer dados para crescer. A empresa evolui por módulos e planos, sem ruptura.

### XII. O operador importa tanto quanto o dono.
Quem usa no balcão é cliente de primeira classe. Se a equipe não adota, o produto fracassou — independentemente de quem paga.

### XIII. Nunca aprisionaremos o cliente.
Os dados são dele e sempre exportáveis. Retemos por valor, jamais por cadeado.

### XIV. Traduziremos dados em conclusões.
Não entregamos só telas — entregamos entendimento, em português claro. O sistema ajuda o dono a pensar sobre o negócio.

### XV. A inteligência será entregue com simplicidade.
Conclusões, não painéis. Uma frase útil vale mais que dez gráficos. Nunca transformaremos o wow em BI complexo, chatbot genérico ou "ERP com IA". A inteligência nasce da operação e só interpreta o que registramos e automatizamos com confiança (ver `IntelligencePrinciples.md`, `DataTrust.md`).

### XVI. Recusaremos recursos que servem poucos e confundem muitos.
Casos raros viram módulo opcional ou não existem. Nunca otimizamos o comum às custas de quem opera todo dia.

### XVII. Não perseguiremos paridade de funcionalidades.
Não construímos algo só porque o concorrente tem. Nossa estratégia é foco, não cópia.

### XVIII. Cada recurso justificará sua existência.
Todo recurso tem dono, público e valor claros. Na dúvida, não construímos. Menos, porém melhor.

### XIX. A consistência é inegociável.
Padrões visuais e de interação serão iguais em todo o produto. Aprender uma tela é aprender todas.

### XX. Recusaremos o cliente errado, inclusive sua receita.
Não distorceremos o produto para atender quem está fora do foco — mesmo com cheque na mão. Proteger a simplicidade de todos vale mais que a receita de um.

---

## Como os Mandamentos são Aplicados

Antes de qualquer funcionalidade ser aprovada, ela é confrontada com os 20 mandamentos. **Basta violar um para ser descartada.**

- Se um cliente importante pede algo que viola o Mandamento XX ou XVI → recusamos.
- Se um recurso deixa a operação diária mais lenta (VII) → descartamos.
- Se uma entrega compromete a exatidão dos números (VIII) → não lançamos.
- Se algo exige o cliente redigitar dado (III) → redesenhamos.
- Se um recurso serve para "parecer completo" (I, II, XVII) → não existe.

> Os mandamentos não são aspiração. São o critério de "sim" e "não". A funcionalidade é serva; o mandamento é lei.

---

## Relação com os Demais Documentos

- **A mentalidade por trás das leis:** `ProductPhilosophy.md`.
- **A versão operacional/expandida dos princípios:** `CorePrinciples.md`.
- **Por que estas leis existem (a verdade estratégica):** `WhyRescript.md`.
- **Os valores da empresa que as sustentam:** `MissionVisionValues.md`.

> Se qualquer documento, decisão ou funcionalidade entrar em conflito com estes 20 mandamentos, **os mandamentos prevalecem.**
