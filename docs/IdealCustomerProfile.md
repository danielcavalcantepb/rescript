---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: IdealCustomerProfile
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Perfil de Cliente Ideal (ICP)

> Documento oficial de definição de cliente ideal e papéis de compra.
> Perspectiva crítica: quem compra, usa, aprova, paga, influencia, cancela — e quem NÃO atender.
> Status: Estratégia (pré-arquitetura técnica).

---

## 1. Por que o ICP é Decisão de Vida ou Morte

O erro mais comum de SaaS não é produto ruim — é **cliente errado**. Atender todo mundo significa não encantar ninguém e inflar o produto até virar o ERP complexo que juramos não ser. Este documento afunila o foco de propósito.

> Princípio de investidor: **um ICP estreito e apaixonado vale mais que um mercado amplo e morno.** Começamos estreitos de propósito.

---

## 2. ICP Primário (o foco inicial obsessivo)

**Pequenas empresas comerciais brasileiras, de 3 a 20 funcionários, que vendem produtos e sofrem com planilhas/caderno ou com um sistema que odeiam.**

### Firmográfico
- **Porte:** 3 a 20 funcionários (o "sweet spot" inicial).
- **Faturamento:** ~R$ 30 mil a R$ 800 mil/mês.
- **Setores de entrada (beachhead):**
  1. Comércio varejista especializado (lojas de nicho: autopeças, materiais, moda, pet, etc.).
  2. Distribuidoras e pequeno atacado.
  3. Prestadores de serviço que também vendem produtos (ex.: assistências, oficinas — ponte para módulos futuros).
- **Geografia:** Brasil, começando por regiões/segmentos onde conseguimos densidade e indicação.

### Comportamental / dor
- Já usa WhatsApp Business e ao menos uma planilha crítica.
- Sente a dor de não saber estoque/caixa em tempo real.
- Já tentou (ou teme) um ERP e associa "sistema" a "complicado".
- Quer começar sozinho, hoje, sem projeto de implantação.
- Tem quem opere no dia a dia (não é só o dono).

### Sinais de encaixe perfeito ("green flags")
- "Perco vendas porque não sei o que tenho em estoque."
- "Meu controle está todo na minha cabeça / numa planilha."
- "Já testei [ERP] e minha equipe não usou."
- "Quero ver quanto vendi e quanto tenho a receber sem fazer conta."

---

## 3. ICP Secundário (expansão natural — fase seguinte)

**Médias empresas comerciais (20 a 50 funcionários) em crescimento**, que precisam de mais usuários, permissões e primeiros módulos (compras, fiscal). Atendidas quando o núcleo estiver maduro e os módulos existirem (ver `Roadmap.md`).

---

## 4. Os Seis Papéis de Compra

Em PMEs os papéis se sobrepõem, mas precisam ser entendidos separadamente para vender e para desenhar o produto.

### 4.1. Quem COMPRA (Comprador econômico)
- **Normalmente o dono/sócio-gestor.** Decide investir baseado em promessa de controle, simplicidade e preço justo.
- **O que precisa ver:** valor rápido, risco baixo (free/trial), preço previsível.

### 4.2. Quem USA (Usuário final)
- **O operador:** vendedor, atendente, estoquista, auxiliar financeiro.
- **É quem faz ou quebra a adoção.** Se acha difícil, sabota.
- **O que precisa sentir:** rapidez, clareza, menos trabalho.

### 4.3. Quem APROVA (Aprovador)
- **O dono/sócio** (nas menores, é o mesmo comprador). Em empresas maiores do ICP, pode haver um gerente.
- **O que precisa:** confiança de que a equipe vai usar e de que os números são corretos.

### 4.4. Quem PAGA (Pagador)
- **A empresa**, via cartão/boleto, decisão do dono ou do financeiro.
- **O que precisa:** cobrança transparente, sem surpresas, fácil de gerenciar plano.

### 4.5. Quem INFLUENCIA (Influenciadores)
- **O contador** (recomenda ou desaconselha sistemas).
- **Outros donos** (indicação boca a boca — canal poderoso na PME).
- **Comunidades e associações setoriais.**
- **O que precisa:** confiar nos números (contador) e ter boa experiência para indicar (donos).

### 4.6. Quem CANCELA (Risco de churn)
- **O dono**, quando: a equipe não adotou, não viu valor, ou apareceu uma exigência não atendida (ex.: nota fiscal).
- **Gatilhos de cancelamento a monitorar:** baixa ativação, queda de uso, ticket de suporte não resolvido, necessidade fiscal descoberta tarde.
- **Defesa:** ativação forte, onboarding, roadmap fiscal claro (ver `Retention.md`).

---

## 5. Quem NÃO Devemos Atender (anti-ICP)

Dizer "não" preserva o produto. **Não** miramos:

- **Grandes empresas / corporações** com múltiplas filiais integradas, processos complexos e necessidade de ERP tier-1. Aumentariam a complexidade para todos.
- **Indústrias com manufatura complexa** (MRP, chão de fábrica multinível).
- **Empresas cuja dor primária é contabilidade completa/fiscal avançado** (SPED, apuração complexa) — o contador/sistema fiscal resolve melhor.
- **E-commerces puros satisfeitos com Shopify** que só querem vitrine.
- **Quem exige customização sob medida** com consultoria dedicada.
- **Micro operação sem nenhum operador além do dono e sem intenção de crescer** — pode usar o free, mas não é foco de receita.
- **Empresas que compram exclusivamente por causa de emissão de NF-e hoje** — até o módulo fiscal amadurecer, deixamos claro que não somos a melhor escolha para elas.

> **Regra:** se atender um segmento exige inflar o produto para todos os outros, esse segmento não é nosso — agora.

---

## 6. Dimensionamento (visão de mercado)

- O Brasil tem milhões de PMEs comerciais; mesmo uma fração pequena do ICP primário representa um mercado grande.
- **Estratégia de mercado:** *beachhead* (cabeça de ponte) em poucos segmentos onde geramos densidade e indicação, e só então expandir horizontalmente. Dominar um nicho antes de ampliar.

> Números precisos de TAM/SAM/SOM serão estimados com dados na etapa de GTM detalhado; aqui fixamos a **lógica**: estreito e profundo primeiro, amplo depois.

---

## 7. Critérios de Qualificação (para vendas/GTM)

Um lead é qualificado quando:
1. É comercial e vende produtos (fit de produto).
2. Tem 3–20 funcionários com ao menos um operador (fit de uso).
3. Sofre com planilha/caderno ou sistema rejeitado (dor real).
4. Pode começar sem exigência fiscal imediata bloqueante (fit de timing) — ou aceita a integração fiscal do roadmap.
5. Tem quem decida rápido (dono acessível).

Se falha em (1) ou (3), provavelmente não é nosso cliente agora.
