---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: Personas
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Personas

> Documento oficial de personas de produto.
> Retratos humanos por trás do ICP, para orientar produto, design, conteúdo e vendas.
> Status: Estratégia (pré-arquitetura técnica). Complementa `IdealCustomerProfile.md`.

---

## 1. Como Usar as Personas

Personas não são decoração — são **ferramentas de decisão**. Ao desenhar qualquer fluxo, pergunte: *"A Aline consegue fazer isso em segundos? O Ricardo entende isso num relance?"* Se a resposta é não, redesenhe.

Prioridade de design: **encantar a Aline (adoção) e dar poder ao Ricardo (decisão).**

---

## 2. Persona Primária — Ricardo, o Dono-Gestor

> *"Eu só quero abrir o sistema e entender na hora como está minha empresa."*

- **Idade/Perfil:** 38 anos, dono de uma distribuidora de autopeças com 9 funcionários.
- **Rotina:** faz de tudo — vende, negocia com fornecedor, cobra, confere caixa no fim do dia.
- **Relação com tecnologia:** usa bem o celular e o WhatsApp; desconfia de "sistemas complicados"; não tem paciência para manual.
- **Objetivos:**
  - Saber, a qualquer momento, quanto vendeu, o que tem em estoque e o saldo do caixa.
  - Parar de depender de planilhas e da própria memória.
  - Descobrir se o mês fechou no positivo.
- **Frustrações:**
  - Já pagou por um ERP e a equipe não usou.
  - Perde vendas por não saber o estoque.
  - Não confia nos próprios números.
- **O que o faz comprar:** ver valor rápido, risco baixo (testar de graça), sensação de controle.
- **O que o faz cancelar:** a equipe não adotar, ou descobrir tarde que precisa de algo (ex.: nota fiscal).
- **Como o Rescript vence:** dashboard claro na entrada, operação que se atualiza sozinha, começar sem implantação.
- **Papéis (ver ICP):** compra, aprova, paga e (risco) cancela.

---

## 3. Persona Primária de Uso — Aline, a Operadora

> *"Se for difícil, eu volto pro caderno."*

- **Idade/Perfil:** 26 anos, vendedora/atendente na loja; também lança vendas e confere estoque.
- **Rotina:** atende cliente atrás de cliente; precisa ser rápida; erra quando o sistema atrapalha.
- **Relação com tecnologia:** nativa de apps de consumo; espera que "funcione como Instagram/iFood".
- **Objetivos:**
  - Registrar uma venda em segundos.
  - Achar cliente e produto na hora.
  - Não errar preço nem estoque.
- **Frustrações:**
  - Sistemas lentos, com muitos cliques e telas confusas.
  - Ter que digitar a mesma coisa duas vezes.
- **O que a encanta:** fluxo enxuto, busca instantânea, interface limpa, feedback imediato.
- **O que a afasta:** lentidão, complexidade, erros sem explicação.
- **Como o Rescript vence:** operação diária desenhada para ela (P6, P11 em `CorePrinciples.md`).
- **Papéis (ver ICP):** usa (é a chave da adoção e, indiretamente, da retenção).

---

## 4. Persona Influenciadora — Carlos, o Contador

> *"Me manda organizado que eu resolvo o resto."*

- **Idade/Perfil:** 45 anos, contador externo que atende dezenas de PMEs.
- **Relação com o Rescript:** consome relatórios; recomenda ou desaconselha sistemas aos clientes.
- **Objetivos:**
  - Receber números confiáveis e organizados.
  - Exportar relatórios sem retrabalho.
- **Frustrações:**
  - Dados bagunçados dos clientes; fechamento trabalhoso.
- **O que o conquista:** consistência dos números, exportação fácil, base sempre atualizada.
- **Como o Rescript vence:** confiabilidade (P7) + relatórios exportáveis; futuramente, canal de contadores.
- **Papéis (ver ICP):** influencia (forte); não usa no dia a dia.
- **Nota estratégica:** o contador é um **canal de distribuição** potencial (ver `GoToMarket.md`), além de influenciador.

---

## 5. Persona Secundária — Fernanda, a Gestora em Crescimento

> *"Preciso organizar a operação antes que ela vire um caos."*

- **Idade/Perfil:** 34 anos, sócia/gerente de uma empresa de 25 pessoas em expansão.
- **Contexto:** já passou do "caderno" e sente que a empresa está ficando grande demais para improviso.
- **Objetivos:**
  - Padronizar processos, dar acesso à equipe com controle (permissões).
  - Preparar a empresa para o próximo nível (compras, fiscal, mais relatórios).
- **Frustrações:**
  - Ferramentas simples demais que "estouram" quando a empresa cresce.
  - Medo de escolher um sistema e ter que migrar depois.
- **Como o Rescript vence:** "crescer sem migrar" (P10) + módulos que ativam conforme a necessidade.
- **Papéis (ver ICP):** aprova e influencia; representa o ICP secundário e a expansão de receita.

---

## 6. Anti-Persona — Roberto, o que NÃO atendemos (agora)

> *"Preciso de um sistema que faça tudo, com integração fiscal completa, multi-filial e customização."*

- **Perfil:** diretor de uma empresa de 120 funcionários, 3 filiais, manufatura e exigências fiscais complexas.
- **Por que não é nosso cliente:** atendê-lo exigiria inflar o produto e trair a simplicidade para todos os outros.
- **Uso do documento:** reconhecer o Roberto rápido para **não** distorcer o roadmap por ele.

---

## 7. Mapa Persona × Necessidade × Módulo

| Persona | Necessidade central | Onde o Rescript entrega |
|---|---|---|
| Ricardo (dono) | Controle e clareza | Dashboard, financeiro, relatórios |
| Aline (operadora) | Velocidade e simplicidade | Vendas, busca, estoque |
| Carlos (contador) | Números confiáveis | Financeiro, relatórios exportáveis |
| Fernanda (gestora) | Crescer com ordem | Permissões, módulos, relatórios avançados |
| Roberto (anti) | Tudo, complexo | — (fora de escopo) |

---

## 8. Frases de Verificação (usar nas revisões de produto)

- **Teste Aline:** "Ela registra uma venda sem pensar?"
- **Teste Ricardo:** "Ele entende a saúde do negócio em 5 segundos na tela inicial?"
- **Teste Carlos:** "Os números batem e exportam sem retrabalho?"
- **Teste Fernanda:** "Isso ainda serve quando a empresa dobrar de tamanho?"
- **Teste Roberto:** "Estamos construindo isso só para o Roberto? Então pare."
