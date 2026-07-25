# Catálogo de Componentes

> Especificação conceitual. Sem código. Cada componente: propósito, anatomia, variantes, estados, a11y, anti-uso.

---

## RescriptMark / RescriptLogo / BrandLoader

**Propósito:** identidade exclusiva (três barras do “E” + wordmark oficial).  
**Regras:** ver `BrandIdentity.md`. Mark nunca como menu. Degradê só institucional. Loading global usa BrandLoader.

## Button

**Propósito:** ação explícita.  
**Variantes:** primary · secondary (outline/ghost) · danger · quiet (texto).  
**Tamanhos:** sm · md · lg.  
**Estados:** default · hover · active · focus-visible · disabled · loading.  
**Regras:** 1 primary por região; label = verbo (“Confirmar venda”); loading desabilita double-submit.  
**Anti:** botão primary cinza; dois primaries competindo.

## Input / Textarea

Label externa · helper · error below. Placeholder nunca substitui label.  
Estados: focus ring accent 2px.  
Monetário e quantidade: alinhamento e máscara conforme domínio (sem float visual confuso).

## Select

Lista curta (< 12). Caso contrário → Autocomplete.  
Não usar select nativo estilizado de forma inconsistente.

## Autocomplete

Clientes, produtos, SKU, variantes.  
Mostra: nome + meta (SKU/doc). Teclado ↑↓ Enter Esc. Empty: “Nenhum resultado — criar novo?” quando permitido.

## Table

Cabeçalho sticky opcional · rows compact · seleção · sort um critério · ações na row (menu).  
Colunas essenciais only; resto em drawer/detalhe.  
Números à direita, tabular-nums.

## Card

Container de interação ou agrupamento — **não** decorar a home com cards vazios.  
Na Central: preferir **Insight Card** / **Metric Card** tipados.

## Metric Card

Número + label + delta opcional (“vs ontem”).  
Sem sparkline obrigatória. Sem verde automático.

## Insight Card

Anatomia obrigatória (domínio/DecisionCenter):

1. Título (conclusão)  
2. Explicação  
3. Tipo: Fato | Projeção | Recomendação  
4. Impacto  
5. Origem / confiança  
6. CTA  
7. Dispensar  

Severidade: quiet left border ou badge — sem ícone de sirene.

## Alert

Inline, tipado (info/warning/danger). Uma ideia por alert. Com ação opcional.

## Badge / Tag / Status

Badge = status sistema (Sale Confirmada). Tag = taxonomia usuário (cliente).  
Cores semânticas mapeadas em ColorSystem.

## Tooltip

Só para ícone-only ou abreviação. Delay ~400ms. Nunca informação essencial só no tooltip.

## Popover

Menus curtos, preview. Fechar Esc/click outside. Sem formulários longos.

## Dialog (Modal)

**Só se:** decisão modal, destrutivo, ou formulário ≤ ~5 campos que não merece página.  
Foco trap · Esc · título claro · primary + cancel.

## Drawer

Detalhe de entidade (venda, cliente) sem perder lista. Largura 400–480. Nested drawer: evitar.

## Command Palette (`⌘K` / `Ctrl+K`)

Busca global + ações (“Nova venda”, “Ir para estoque”).  
Grupos: Navegação · Criar · Recentes.  
Referência: Raycast/Linear. Essencial para velocidade.

## Empty State

Ícone muted + 1 título + 1 frase + 1 CTA. Ver `EmptyStates.md`.

## Skeleton

Shapes da estrutura real. Sem texto fake. Timeout → empty/error.

## Charts

Raros. Só quando tendência > tabela. Sem 3D. Cores neutras + 1 série accent. Ver `Charts.md`.

## Date Picker

Um dia / intervalo. Presets: Hoje, 7d, 30d, Mês. Locale pt-BR.

## Avatar

Iniciais se sem foto. Cor estável por hash. Menu conta.

## Toast

Sucesso quiet / erro persistente até dismiss. Máx 1–2 visíveis. Ação “Desfazer” só se domínio permitir.

## Navigation / Sidebar

Itens: Central · Clientes · Produtos · Estoque · Vendas · Financeiro · (Importações) · Config.  
Badge numérico só em “atenção” se curado. Colapsável.

## Topbar

Busca · Command hint · Org switcher · Notifications (leve) · User.

## Breadcrumb

Só profundidade ≥ 3. Senão omitir.

## Pagination

Preferir “carregar mais” / cursor em listas longas; páginas em exports/admin.

## Search

Global (palette) + local (tabela). Debounce. Highlight match.

## Filters

Chips ativos · “Limpar”. Filtros avançados em disclosure. Ver `Filters.md`.

## Loading

Button spinner · section skeleton · page progress raro (import).

## Permission UI

Esconder ação se sem permissão **ou** mostrar disabled + tooltip “Sem permissão — peça ao responsável” conforme política (preferir hide em nav; explain em CTA contextual).

---

## Matriz Modal vs Drawer vs Página

| Usar | Quando |
|---|---|
| **Página** | Fluxo principal (venda, cadastro produto com variantes) |
| **Drawer** | Detalhe / edição leve mantendo lista |
| **Modal** | Confirmação destrutiva; formulário muito curto |
| **Popover** | Menu / filtros rápidos |
| **Inline edit** | Nome, tags, campos de baixo risco em rascunho |
