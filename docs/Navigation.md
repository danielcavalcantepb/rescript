---
Status: Archived
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Archive
Scope: Navigation
Supersedes: None
Superseded-By: 03_PRODUCT_DESIGN.md
Related-Modules: All
---

# Rescript — Navegação, Onboarding e Experiência Inicial

> Documento oficial de arquitetura de navegação, estrutura de menu, telas e experiência inicial do usuário.
> Status: Product Discovery (pré-implementação). Descreve intenção de UX, não implementação.

---

## 1. Princípios de Navegação

1. **Menu lateral fixo como espinha dorsal.** Navegação principal previsível, sempre visível (colapsável no mobile).
2. **Dashboard é a casa.** Ao entrar, o usuário sempre cai na visão geral do negócio.
3. **Ações do dia a dia a um clique.** Registrar venda é a ação mais importante e deve estar sempre acessível.
4. **Profundidade rasa.** Lista → Detalhe → Ação. Evitar hierarquias profundas de menus.
5. **Contexto preservado.** Buscar, filtrar e voltar sem perder o lugar.
6. **Módulos aparecem quando ativos.** O menu cresce conforme a empresa ativa módulos — nunca mostra o que não tem.

---

## 2. Estrutura da Navegação Principal (Menu Lateral)

O menu lateral é dividido em **grupos** para dar clareza mental. No MVP:

```
┌────────────────────────┐
│  RESCRIPT              │  ← logo + seletor de empresa
├────────────────────────┤
│  ▸ Início              │  ← Dashboard / Indicadores
│                        │
│  OPERAÇÃO              │  (grupo)
│  ▸ Vendas             │
│  ▸ Clientes           │
│  ▸ Produtos           │
│  ▸ Estoque            │
│                        │
│  FINANCEIRO           │  (grupo)
│  ▸ Financeiro         │
│                        │
│  ANÁLISE              │  (grupo)
│  ▸ Relatórios         │
│                        │
├────────────────────────┤
│  ⚙ Configurações      │  ← rodapé
│  👤 Perfil / Conta    │
└────────────────────────┘
```

### Racional dos grupos

- **Início:** ponto de partida (indicadores).
- **Operação:** o dia a dia — onde a equipe vive (Vendas em destaque, primeira da lista).
- **Financeiro:** o dinheiro — onde o dono olha.
- **Análise:** relatórios e visão aprofundada.
- **Configurações / Conta:** administração, no rodapé para não competir com a operação.

### Ação global persistente

- Botão **"+ Nova Venda"** (ação primária) sempre acessível no topo/裂 header ou como botão flutuante, pois é a operação mais frequente.
- **Busca global** no topo (encontrar cliente, produto ou venda de qualquer lugar).

---

## 3. Como Organizar o Menu conforme a Plataforma Cresce

Quando módulos futuros forem ativados, eles entram em grupos existentes ou criam novos, sem bagunçar o núcleo:

```
OPERAÇÃO
  ▸ Vendas
  ▸ Clientes
  ▸ Produtos
  ▸ Estoque
  ▸ Compras            (v3 - módulo)
  ▸ Produção           (v4 - módulo)
  ▸ Assistência        (v4 - módulo)
  ▸ Projetos           (v4 - módulo)

FINANCEIRO
  ▸ Financeiro
  ▸ Fiscal / Notas     (v3 - módulo)

GESTÃO
  ▸ RH                 (v5 - módulo)

ANÁLISE
  ▸ Relatórios
  ▸ Indicadores avançados (futuro)

INTEGRAÇÕES
  ▸ Marketplace        (v5 - módulo)
  ▸ API                (v5 - módulo)
```

**Regra:** o menu nunca lista módulos inativos. A ativação (por plano) faz o item aparecer. Isso mantém a interface limpa para quem usa pouco e poderosa para quem usa muito.

---

## 4. Como Dividir os Módulos na Interface

- Cada módulo do menu leva a uma **área** com padrão consistente: **Lista → Detalhe → Formulário**.
- Toda área tem: busca, filtros, ação primária clara e estado vazio orientador.
- Ações que cruzam módulos (ex.: "Nova venda" a partir de um cliente) são atalhos contextuais, não novos itens de menu.

---

## 5. Onboarding (Primeira Experiência)

O onboarding é **a parte mais importante do produto para adoção**. Objetivo: levar o usuário do cadastro até a **primeira venda registrada** o mais rápido possível.

### 5.1. Fluxo de Onboarding

1. **Cadastro rápido** — nome, e-mail, senha, nome da empresa. Nada além do essencial.
2. **Boas-vindas + pergunta de contexto** — 1 a 3 perguntas leves (ramo, tamanho) para personalizar. Puláveis.
3. **Checklist de primeiros passos** (persistente no dashboard):
   - [ ] Cadastrar seu primeiro produto
   - [ ] Cadastrar seu primeiro cliente
   - [ ] Registrar sua primeira venda
   - [ ] Conhecer seu dashboard
   - [ ] (opcional) Convidar um membro da equipe
4. **Dados de exemplo opcionais** — oferecer "explorar com dados de demonstração" para quem quer ver antes de cadastrar.
5. **Comemoração do "aha"** — ao registrar a primeira venda, feedback positivo mostrando estoque baixando e financeiro atualizando (o momento mágico).

### 5.2. Princípios do Onboarding

- **Mostrar valor antes de exigir esforço.** Deixar explorar antes de obrigar a cadastrar tudo.
- **Progresso visível.** O checklist mostra o quanto falta.
- **Sem obrigar configuração pesada.** Bons padrões evitam telas de setup longas.
- **Ajuda contextual.** Dicas no lugar certo, não um manual.
- **Time-to-first-value mínimo.** Meta: primeira venda em minutos.

---

## 6. Experiência Inicial do Usuário (pós-onboarding)

### 6.1. O Dashboard como Casa

Ao entrar, o usuário vê a **saúde do negócio**:

- **Cartões de indicadores:** vendas de hoje, vendas do mês, ticket médio, saldo financeiro.
- **Alertas:** produtos com estoque baixo, contas a vencer.
- **Atalhos rápidos:** "+ Nova venda", "+ Novo produto", "+ Novo cliente".
- **Resumo visual:** gráfico simples de vendas no período, top produtos/clientes.
- **Checklist de onboarding** (até ser concluído).

### 6.2. Estados Vazios (Empty States) Orientadores

Quando não há dados, cada tela **ensina o próximo passo** em vez de mostrar vazio:

- Clientes vazio → "Cadastre seu primeiro cliente" + botão.
- Produtos vazio → "Adicione seu primeiro produto" + botão.
- Vendas vazio → "Registre sua primeira venda" + botão.

### 6.3. Consistência de Interação

- Mesmos padrões de botão, formulário, tabela e busca em todos os módulos.
- Feedback imediato em toda ação (salvou, deu erro, está carregando).
- Confirmação em ações destrutivas (cancelar venda, excluir).

---

## 7. Telas da Primeira Versão (mapa de navegação)

```
[Cadastro] → [Onboarding] → [Dashboard]
                                 │
     ┌───────────────┬──────────┼───────────┬──────────────┐
     ▼               ▼          ▼           ▼              ▼
 [Vendas]       [Clientes]  [Produtos]  [Estoque]   [Financeiro]
     │               │          │           │              │
  Lista           Lista      Lista       Saldos      A receber
  Nova venda      Cadastro   Cadastro    Movimentar  A pagar
  Detalhe         Detalhe    Detalhe                 Lançamento
                                                    Fluxo de caixa
                          [Relatórios]
                  (vendas / estoque / financeiro)

 [Configurações] · [Usuários & Convites] · [Plano/Assinatura] · [Perfil]
```

Lista completa de telas em `MVP.md`, seção 5.

---

## 8. Comportamento Responsivo

- **Desktop:** menu lateral expandido, tabelas completas.
- **Tablet:** menu colapsável, layout adaptado.
- **Mobile (web):** menu vira drawer/inferior; ação "+ Nova venda" em destaque; foco nas tarefas mais comuns.

> O MVP é **web responsivo**. App nativo é item de roadmap futuro.

---

## 9. Acessibilidade e Clareza

- Contraste adequado, alvos de toque generosos, navegação por teclado.
- Textos em linguagem simples e direta (português claro, sem jargão).
- Mensagens de erro que explicam o que fazer, não códigos técnicos.
