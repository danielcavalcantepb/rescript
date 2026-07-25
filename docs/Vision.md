# Rescript — Visão do Produto

> Documento oficial de visão estratégica.
> Público-alvo: fundadores, liderança de produto, engenharia, design, vendas e investidores.
> Status: Product Discovery (pré-implementação).

---

## 1. Visão do Produto

**Rescript é a plataforma que centraliza toda a operação comercial de uma pequena ou média empresa em um único lugar, de forma tão simples que qualquer pessoa consegue usar no primeiro dia — sem consultor, sem treinamento e sem manual.**

A maioria dos sistemas de gestão foi construída por engenheiros para contadores. São completos, mas hostis. O empreendedor brasileiro típico — o dono de loja, o distribuidor, o prestador de serviço, a pequena indústria — não quer aprender um ERP. Ele quer **saber o que vender, para quem vender, quanto tem em estoque, quanto entrou de dinheiro e se o mês fechou no positivo**.

O Rescript nasce para responder essas perguntas com clareza imediata, e para crescer junto com o negócio do cliente ao longo dos próximos 10 anos, sem nunca perder a simplicidade que o tornou adotável no primeiro dia.

### Frase de posicionamento (one-liner)

> **"O sistema de gestão que a sua equipe realmente vai usar."**

### Tese central do produto

> **"O Rescript organiza a operação comercial e mostra ao dono o que precisa da atenção dele, antes que o problema aconteça."**

A obsessão principal continua sendo **SIMPLICIDADE**. A **inteligência** — mostrar ao dono o que importa, antes do problema — é **consequência** dessa simplicidade, não um recurso à parte. O Rescript não é um "ERP com IA": a inteligência emerge da própria operação bem organizada e é entregue como **conclusões simples, confiáveis, acionáveis e contextualizadas** (ver `IntelligencePrinciples.md`, `DecisionCenter.md`).

### As três camadas do produto

O Rescript se organiza em três camadas, e a inteligência só existe quando as duas primeiras são confiáveis:

1. **Registrar** — clientes, produtos, vendas, estoque, recebimentos, movimentações e histórico, de forma correta e íntegra.
2. **Automatizar** — uma única ação gera automaticamente todas as suas consequências (venda → baixa estoque → gera recebível → atualiza indicadores → registra histórico → recalcula projeções).
3. **Interpretar** — o sistema identifica riscos, anomalias, pendências, tendências, oportunidades e a próxima ação recomendada.

> Regra de ouro: **o Rescript nunca interpreta o que não registra e automatiza com confiança** (ver `DataTrust.md`).

### Visão de longo prazo (10 anos)

Tornar o Rescript o **sistema operacional comercial** das PMEs da América Latina: o lugar onde a empresa cadastra o que vende, registra o que vendeu, controla o que tem, entende como está indo e conecta todas as ferramentas externas que usa. Um núcleo simples, extensível por módulos e integrações, que acompanha a empresa desde o MEI até a média empresa consolidada — sem exigir migração de plataforma no caminho.

---

## 2. Posicionamento de Mercado

### O mapa competitivo

| Concorrente | Força | Fraqueza que o Rescript explora |
|---|---|---|
| **Tiny ERP** | Simples, foco em e-commerce | Fica raso quando a empresa cresce; UX datada |
| **Bling** | Integrações e marketplaces | Curva de aprendizado alta, interface densa |
| **Omie** | Robusto, financeiro/contábil forte | Complexo, parece um ERP tradicional; caro para começar |
| **Conta Azul** | Marca forte, integração contábil | Foco contábil/financeiro, fraco em operação comercial ampla |
| **Odoo** | Extremamente modular e completo | Complexidade altíssima, exige implantação e consultoria |
| **Shopify** | UX excelente, ecossistema | É e-commerce, não gestão comercial da empresa inteira |
| **HubSpot** | CRM e UX de referência | Foco em marketing/vendas, não em estoque/financeiro/operação |

### Onde o Rescript se posiciona

O Rescript ocupa o espaço **entre a simplicidade do Shopify/HubSpot e a abrangência operacional do Omie/Bling**.

- Mais **fácil** que Omie, Bling e Odoo.
- Mais **completo em operação comercial** que Conta Azul e Tiny.
- Mais **focado em gestão do negócio** que Shopify (que é vitrine) e HubSpot (que é CRM).

**Categoria que queremos criar/dominar:** *Commercial Operations Platform* (Plataforma de Operação Comercial) para PMEs — não "mais um ERP".

### Declaração de posicionamento

> Para **donos e gestores de pequenas e médias empresas** que se sentem sufocados por planilhas ou por ERPs complexos, o **Rescript** é uma **plataforma de operação comercial** que centraliza clientes, produtos, estoque, vendas e financeiro em uma experiência simples e visual.
> Diferente do Omie, Bling e Odoo, o Rescript foi desenhado para ser **usado sem treinamento** e para **crescer por módulos** conforme a empresa evolui.

---

## 3. Qual Problema o Rescript Resolve

### O problema central

**A operação comercial das PMEs está fragmentada e ilegível.** As informações vitais do negócio moram em lugares desconectados: o cadastro de clientes no WhatsApp e no caderno, o estoque na cabeça do dono, as vendas em um bloco de notas ou em uma planilha, o financeiro em outra planilha (ou nenhuma), e os indicadores... não existem.

O resultado:

1. **Falta de visibilidade** — o dono não sabe, em tempo real, quanto vendeu, quanto tem em caixa ou o que está acabando no estoque.
2. **Retrabalho e erro** — o mesmo dado é digitado várias vezes em ferramentas diferentes.
3. **Decisões no escuro** — sem indicadores, decisões de compra, preço e crédito são feitas por intuição.
4. **Dependência de pessoas** — quando o funcionário-chave sai, o conhecimento vai junto.
5. **Rejeição a sistemas** — quando tentam adotar um ERP, a complexidade faz a equipe abandonar em semanas.

### Por que os concorrentes não resolvem bem

Os ERPs tradicionais resolvem o problema da fragmentação, mas **criam um novo problema: a complexidade**. A adoção falha não por falta de recursos, mas por excesso. O Rescript ataca exatamente essa lacuna: **centralização com simplicidade**.

### A dor em uma frase

> "Eu tenho o negócio na cabeça e em dez planilhas, e toda vez que tento organizar num sistema, ele é complicado demais e eu desisto."

---

## 4. Quem é o Cliente Ideal (ICP)

### Perfil da empresa (ICP primário)

- **Porte:** pequenas e médias empresas, tipicamente de **2 a 50 funcionários**.
- **Faturamento:** de aproximadamente **R$ 20 mil a R$ 2 milhões/mês**.
- **Setores prioritários no início:**
  - Comércio varejista e atacadista (lojas, distribuidoras).
  - Prestadores de serviço com venda de produtos (ex.: assistências, oficinas).
  - Pequenas indústrias e fabricação sob encomenda (fase 2).
- **Maturidade digital:** usa WhatsApp Business, talvez uma planilha, talvez um sistema que odeia. Tem smartphone e computador, mas **não tem TI**.

### Perfil de quem decide e usa

- **O Decisor (Dono/Sócio-gestor):** quer visibilidade e controle, tem pouco tempo, é sensível a preço e a promessa de simplicidade.
- **O Operador (vendedor, estoquista, atendente, financeiro):** usa o sistema no dia a dia. Se for difícil, sabota a adoção. **É quem o produto precisa encantar.**
- **O Parceiro (contador):** influencia a decisão e consome relatórios. Precisa confiar nos números.

### Sinais de "encaixe perfeito"

- Já sente dor de planilha / caderno / grupos de WhatsApp.
- Já tentou um ERP e desistiu por complexidade.
- Quer começar hoje, sozinho, sem projeto de implantação.
- Cresce e precisa de organização, mas não de burocracia.

---

## 5. Quem NÃO é Cliente Ideal

Definir o não-cliente é tão importante quanto definir o cliente. Dizer "não" mantém o produto simples.

- **Grandes empresas e corporações** com processos complexos, múltiplas filiais integradas em tempo real, e exigência de ERP tier-1 (SAP, TOTVS). *Não atenderemos no MVP.*
- **Indústrias com manufatura complexa** (MRP, chão de fábrica, ordens de produção multinível). *Fica para módulo futuro, e mesmo assim de forma simplificada.*
- **Empresas que precisam de contabilidade completa interna** (plano de contas, SPED, apurações fiscais complexas). O Rescript faz **financeiro operacional**, não substitui o contador nem o sistema contábil.
- **Negócios puramente digitais / e-commerce que já vivem no Shopify** e só querem vitrine — o Rescript integra, mas não compete como loja virtual no MVP.
- **Quem busca customização profunda sob medida** com consultoria e desenvolvimento dedicado. O Rescript é padronizado e configurável, não sob encomenda.
- **Empresas que querem um sistema fiscal (emissão de NF-e) como razão principal de compra** — no MVP a emissão fiscal não é o carro-chefe (entra via integração/módulo posterior).

> **Regra de ouro:** se atender um cliente exige aumentar a complexidade do produto para todos os outros, esse não é o nosso cliente agora.

---

## 6. Diferenciais Competitivos

1. **Simplicidade radical (usável sem treinamento).** Onboarding guiado, linguagem humana (não contábil), telas limpas, um caminho óbvio para cada tarefa. O sucesso é medido em "tempo até a primeira venda registrada".

2. **Centralização real da operação comercial.** Cliente, produto, estoque, venda e financeiro conversam entre si nativamente. Uma venda baixa o estoque e gera o lançamento financeiro automaticamente — sem integração, sem gambiarra.

3. **O sistema pensa pelo dono (inteligência como consequência).** A página inicial é uma **Central de Decisão**, não um painel de gráficos: mostra conclusões em linguagem clara ("você pode ficar sem este produto em 6 dias", "seu caixa pode ficar negativo no dia 28") e a próxima ação. Concorrentes entregam dados e transferem ao usuário o trabalho de interpretar; o Rescript entrega a conclusão. Ver `DecisionCenter.md` e `InsightCatalog.md`.

4. **Arquitetura modular que cresce sem reescrever.** A empresa começa com o núcleo e ativa módulos (produção, compras, assistência, projetos) conforme cresce — sem trocar de plataforma, sem migração de dados.

5. **Multi-tenant nativo pensado para escala.** Isolamento de dados por empresa desde a fundação, permitindo servir de um MEI a uma média empresa com a mesma base de código.

6. **Extensibilidade futura via API e marketplace de integrações.** O Rescript quer ser plataforma, não silo: conectar marketplaces, meios de pagamento, logística e o ecossistema que a PME já usa.

7. **Preço e time-to-value honestos.** Começar rápido, plano de entrada acessível, valor percebido na primeira semana. Sem taxa de implantação obrigatória.

### O nosso "fosso" (defensibilidade)

- **Experiência de uso** difícil de copiar por incumbentes presos a bases legadas.
- **Dados operacionais** que ficam mais valiosos quanto mais a empresa usa (efeito de retenção).
- **Rede de integrações** que cresce com o tempo (efeito de rede pelo marketplace).

---

## 7. Proposta de Valor

### Para o Dono / Gestor

> "Tenha o controle total do seu negócio na palma da mão. Saiba o que você vendeu, o que tem em estoque e quanto entrou de dinheiro — em tempo real, sem planilha e sem complicação."

### Para o Operador (equipe)

> "Registre uma venda em segundos. Encontre um cliente ou produto na hora. Trabalhe em um sistema que ajuda em vez de atrapalhar."

### Para o Contador / Parceiro

> "Números organizados e confiáveis, relatórios prontos e uma base sempre atualizada da operação do seu cliente."

### Canvas de valor (resumo)

| Dor | Como o Rescript alivia |
|---|---|
| Informação espalhada | Centraliza tudo em uma plataforma |
| Sistemas complicados | Experiência intuitiva, sem treinamento |
| Falta de visão do negócio | Dashboard e indicadores nativos |
| Erro e retrabalho | Dados integrados entre módulos |
| Medo de não conseguir crescer no sistema | Arquitetura modular que acompanha o crescimento |

| Ganho desejado | Como o Rescript entrega |
|---|---|
| Ver a saúde do negócio num relance | Indicadores em tempo real |
| Vender mais rápido | Fluxo de venda enxuto |
| Comprar melhor | Alertas de estoque e histórico |
| Dormir tranquilo | Financeiro claro e organizado |

---

## 8. Princípios do Produto (guias de decisão)

Sempre que houver dúvida sobre o que construir, estes princípios decidem:

1. **Simplicidade vence completude.** Se um recurso adiciona poder para poucos e confusão para muitos, ele espera ou vira módulo opcional.
2. **O padrão certo é melhor que a configuração.** Configurar é atrito. Boas escolhas padrão fazem o cliente ter sucesso sem pensar.
3. **A operação diária é sagrada.** Fluxos usados todo dia (registrar venda, achar cliente, ver caixa) devem ser rápidos, memoráveis e à prova de erro.
4. **Mostre valor antes de pedir esforço.** O usuário deve ver benefício antes de ter que cadastrar tudo.
5. **Crescer nunca deve exigir migrar.** Nenhuma decisão de curto prazo pode obrigar o cliente (ou a empresa) a reescrever/migrar depois.
6. **Confiança nos números.** Dados financeiros e de estoque precisam ser sempre corretos e auditáveis. Aqui não há espaço para "quase certo".

---

## 9. Métricas de Sucesso (North Star)

- **North Star Metric:** número de **operações comerciais registradas por empresa ativa por semana** (vendas + movimentações + lançamentos). Mede se o Rescript virou o hábito operacional da empresa.
- **Ativação:** % de empresas que registram a **primeira venda em até 24h** após o cadastro.
- **Time-to-value:** tempo até o primeiro insight no dashboard.
- **Retenção:** retenção de empresas em 3, 6 e 12 meses.
- **Expansão:** % de empresas que ativam ao menos **um módulo adicional** ou sobem de plano.
- **NPS** do dono e do operador (medidos separadamente).

---

## 10. Riscos e Como Mitigar

| Risco | Mitigação |
|---|---|
| Cair na tentação de virar "mais um ERP complexo" | Governança pelos princípios do produto; módulos opcionais em vez de inchar o núcleo |
| Concorrentes com marca e caixa | Ganhar por UX e nicho; foco obsessivo em ativação e retenção |
| Cliente precisar de nota fiscal cedo demais | Roadmap prevê integração fiscal como módulo; deixar claro o posicionamento no início |
| Complexidade fiscal/regulatória do Brasil | Financeiro operacional no MVP; fiscal via integração especializada depois |
| Churn por baixa adoção da equipe | Onboarding e simplicidade como prioridade número um do produto |
