# Brand Identity — Rescript (oficial)

> Fonte da verdade da identidade visual do produto.  
> Toda a linguagem nasce da **logo oficial** (`docs/design/assets/rescript-wordmark.png`).  
> Não redesenhar. Não propor marca alternativa. Trabalhar em cima dela.

**Status:** Oficial  
**Direção:** Quiet Instrument  
**Precedência:** este documento > `Brand.md` > demais docs de design para decisões de marca.

---

## 1. Essência

O Rescript é um **instrumento quieto**.  
Quando alguém olha uma tela, deve reconhecer imediatamente: precisão, calma, organização — não um ERP.

| Transmitir | Nunca transmitir |
|---|---|
| Precisão | ERP antigo |
| Clareza | Sistema pesado |
| Organização | Dashboard poluído |
| Calma | Corporativo anos 2000 |
| Controle | Excesso de efeitos |
| Confiabilidade | Interface chamativa |
| Tecnologia silenciosa | “AI glow” / confete |

---

## 2. Análise da logo oficial

### 2.1 Geometria
- Wordmark geométrico em caixa alta: **RESCRIPT**
- Curvas abertas e circulares (R, S, C, P) — precisão matemática, sem ornamentação
- Verticais e horizontais limpos (I, T)
- Proporção horizontal alongada; a marca “respira” no eixo X

### 2.2 Traço
- Espessura **fina e uniforme** (hairline / extra-light)
- Mesmo peso em curvas e retas → sensação de instrumento calibrado
- Sem fill pesado; a marca é desenhada por linha, não por massa

### 2.3 Espaçamento e ritmo
- Tracking generoso entre letras → ar, organização, premium operacional
- O ritmo visual é **horizontal e periódico**
- O “E” de três barras reforça o pulso: camada / camada / camada

### 2.4 Cantos e curvas
- Terminais levemente suaves (não lâmina agressiva)
- Evita frialdade clínica; mantém precisão humana

### 2.5 Contraste e peso
- Contraste vem do **espaço negativo + gradiente**, não da espessura
- A marca nunca compete com o conteúdo — ela define o tom

### 2.6 Degradê (institucional)
Gradiente horizontal L→R:

| Posição | Leitura | Uso |
|---|---|---|
| Esquerda | Carvão oliva profundo | Estabilidade, base |
| Centro | Verde floresta / teal | Clareza, ordem |
| Direita | Verde primavera / mint vivo | Progresso, luz |

**Regra:** degradê **apenas** em momentos institucionais (splash, onboarding hero, marketing, favicon mark).  
**No produto operacional:** cores sólidas derivadas.

### 2.7 Conceito do “E” (símbolo mestre)
Três linhas horizontais paralelas, iguais em comprimento e espessura, com gaps iguais.

Significa:
- **Camadas** (Registrar → Automatizar → Interpretar)
- **Ordem** (dados alinhados)
- **Script / linhas** (registro operacional)
- **Clareza progressiva** (do denso ao legível)

É o ativo exclusivo da marca. Nunca virar hamburger genérico, equalizer ou ícone de menu.

---

## 3. Símbolo — usos oficiais

Asset: componente `RescriptMark` / SVG `brand-mark.svg`.

| Contexto | Como usar |
|---|---|
| **Favicon** | Mark solo, gradiente institucional ou primary sólido em fundo claro |
| **Splash** | Mark centrado + fade curto; wordmark opcional abaixo |
| **Loading** | Três barras com opacity stagger (calmo) — nunca spin genérico |
| **Onboarding** | Wordmark com degradê; mark como marcador de passo |
| **Separadores** | Três linhas curtas (mark reduzido) entre seções institucionais |
| **Padrões** | Repetição muito sutil do mark a 3–6% opacity (watermark) |
| **Marca d’água** | Mark ou wordmark ghost em empty/export PDF futuro |
| **Ilustrações** | Geometria derivada das 3 barras; sem personagens |
| **Animações** | Opacity / translateY ≤ 4px nas barras; sem bounce |
| **Empty states** | Mark muted + título + 1 frase + 1 CTA |
| **Estados de carregamento** | `BrandLoader` (3 barras) no lugar de spinners redondos |

### Proibições do símbolo
- Não colorir cada barra de cor diferente no app
- Não adicionar glow, sombra 3D, fill sólido grosso
- Não rotacionar / distorcer / arredondar excessivamente
- Não usar como ícone de “menu” ou “filtros”

---

## 4. Paleta oficial (derivada da logo)

Verde = **clareza · ordem · confiança** — não dinheiro.

### 4.1 Brand (institucional)

| Token | Hex | Nota |
|---|---|---|
| `brand.from` | `#1A2820` | Carvão oliva (início do degradê) |
| `brand.via` | `#2A7A56` | Verde floresta (meio) |
| `brand.to` | `#5FE09A` | Verde primavera (fim) |
| `brand.gradient` | `linear-gradient(90deg, #1A2820 0%, #2A7A56 48%, #5FE09A 100%)` | Só institucional |

### 4.2 Produto (sólidos)

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#1F7A56` | CTA, links ativos, foco de ação |
| `primary-hover` | `#259366` | Hover |
| `primary-active` | `#176345` | Pressed |
| `primary-soft` | `#E8F7F0` | Selection, nav active, chips suaves |
| `canvas` | `#F3F5F7` | Fundo app (frio) |
| `surface` | `#FFFFFF` | Painéis, cards |
| `surface-alt` | `#F8FAFB` | Zebra / alt rows |
| `border` | `#E4E8EE` | Bordas padrão |
| `border-soft` | `#EEF1F5` | Divisores leves |
| `ink` | `#0B1220` | Texto forte / ícones |
| `text-primary` | `#0B1220` | Alias de ink |
| `text-secondary` | `#4A5568` | Corpo secundário |
| `muted` | `#7A8494` | Meta, captions |
| `success` | `#027A48` | Confirmação |
| `warning` | `#B54708` | Atenção |
| `danger` | `#B42318` | Erro / destrutivo |
| `info` | `#175CD3` | Informação neutra |
| `focus` | `#1F7A56` | Ring de foco |
| `selection` | `#E8F7F0` | Highlight de seleção |
| `overlay` | `rgba(11, 18, 32, 0.40)` | Scrim modal / palette |

Fundos semânticos: `success-bg` `#ECFDF3` · `warning-bg` `#FFFAEB` · `danger-bg` `#FEF3F2` · `info-bg` `#EFF8FF`.

### 4.3 Regras de cor
1. Um acento de ação por região (`primary`).
2. Semântica ≠ decoração — não pintar KPIs de verde.
3. Degradê nunca em botões, tabelas ou insight cards do dia a dia.
4. Canvas frio; **não** cream editorial.

---

## 5. Tipografia

### 5.1 Escolha: **Geist**

| Critério | Por quê Geist |
|---|---|
| Geometria | Sans geométrica alinhada ao wordmark |
| Peso fino disponível | Conversam com o traço hairline da logo |
| Produto | Já é a tipografia Quiet Instrument / Linear-like |
| Mono | Geist Mono para SKU, dinheiro, códigos |

Alternativas aceitas se Geist indisponível: Inter (fallback técnico), Söhne / Aeonik / Suisse (marketing).  
**Não** usar serif editorial nem display ornamentado no app.

### 5.2 Papéis

| Papel | Família | Peso | Uso |
|---|---|---|---|
| Display | Geist | Medium 500 | Onboarding, splash |
| Heading | Geist | Medium 500 | Título de página / seção |
| Body | Geist | Regular 400 | Texto padrão |
| Label | Geist | Medium 500 | Labels de form / nav |
| Caption | Geist | Regular 400 | Meta, ajuda |
| Monospace | Geist Mono | Regular 400 | Dinheiro, SKU, docs |

### 5.3 Escala

| Token | Size / Line | Letter-spacing |
|---|---|---|
| `display` | 32 / 40 | −0.01em |
| `title` | 24 / 32 | −0.01em |
| `heading` | 18 / 28 | 0 |
| `body` | 14 / 22 | 0 |
| `label` | 13 / 18 | 0.01em |
| `caption` | 12 / 16 | 0.01em |
| `metric` | 28 / 36 | −0.02em · tabular-nums |

**Wordmark tipográfico (texto):** tracking aberto (~0.12–0.18em) só quando o logo em imagem não for usado.

---

## 6. Sistema visual

### 6.1 Radius
`sm` 6 · `md` 8 · `lg` 12 · `xl` 16  
Sem pill em CTA. Pill só badge/chip pequeno.

### 6.2 Grid & spacing
Base 4px. Sidebar 240. Conteúdo max ~72rem. Gutters 24/16/12.  
Ritmo generoso na Central; denso em tabelas.

### 6.3 Elevation
Preferir borda + superfície. Sombra só em overlay (palette, dialog): `0 8px 24px rgba(11,18,32,0.08)`.

### 6.4 Dividers
`border` 1px ou `border-soft`. Evitar linhas duplas e grades pesadas.

### 6.5 Containers / Cards
Cards só quando há agrupamento ou interação. Na Central: Insight/Metric tipados — não “card wall”.

### 6.6 Inputs / Buttons / Tables / Badges / Chips / Timeline
Ver `DesignSystem.md` + `ComponentCatalog.md` — tokens de cor apontam para esta paleta.

### 6.7 Insight / Metric
Insight: borda esquerda 3px `primary`, surface branca, tipografia calma.  
Metric: número mono tabular, label muted, sem sparkline obrigatória.

### 6.8 Dialog / Drawer / Command Palette / Sidebar / Topbar
Overlay `overlay`. Sidebar: mark + org name. Topbar: busca quieta. Palette: fade+scale discreto.

---

## 7. Motion

| Princípio | Regra |
|---|---|
| Calma | Fade / opacity primeiro |
| Precisão | Slide ≤ 8px; scale 0.98→1 |
| Tempo | 120–240ms (fast/base) |
| Curva | ease-out / ease-in-out |
| Proibido | Bounce, confetti, glow pulse, parallax |

Loading brand: barras do mark com opacity 0.25→1 em sequência (stagger 80ms).

---

## 8. Ícones

- Lucide, stroke **1.5**
- Lineares apenas
- Cor: `ink` / `muted` / `primary` quando ativo
- Sem filled coloridos por módulo

---

## 9. Ilustrações

- Raras, geométricas, muito negativo
- Derivadas do ritmo das 3 barras
- Sem personagens, sem cartoon, sem stock lifestyle no app

---

## 10. Voz da interface

Fala como especialista operacional.

| ✔ | ✘ |
|---|---|
| “2 itens precisam da sua atenção.” | “Parabéns!” |
| “Hoje está tudo sob controle.” | “Incrível!” |
| “Recebimento registrado.” | “Fantástico!” |
| “Nenhum risco encontrado.” | “Nossa IA detectou…” |

Detalhes: `UXWriting.md` · `Personality.md`.

---

## 11. Aplicação nas telas

| Área | Regra de marca |
|---|---|
| Login / Onboarding | Wordmark oficial + degradê institucional permitido |
| Sidebar | Mark ou wordmark compacto; org abaixo |
| Topbar | Sem logo repetido se sidebar já marca |
| Central | Clareza > logo; insights quietos; primary só em CTA |
| Listas (Clientes/Produtos/Vendas) | Tabelas limpas; status chips; ar entre blocos |
| Estoque / Financeiro / Import / Config | Mesmos tokens; módulos “soon” muted, não coloridos |
| Empty / Loading | Mark / BrandLoader |

---

## 12. Design QA (marca)

Antes de aprovar qualquer tela:

- [ ] A tela parece **Rescript**?
- [ ] Transmite **calma**?
- [ ] Transmite **precisão**?
- [ ] Transmite **organização**?
- [ ] Excesso de informação?
- [ ] Excesso de cor?
- [ ] Excesso de bordas?
- [ ] Excesso de sombras?
- [ ] Excesso de animações?
- [ ] Degradê só onde é institucional?
- [ ] Tipografia conversa com a logo (Geist, leve, clara)?
- [ ] O símbolo de 3 barras está correto (não genérico)?

---

## 13. Assets

| Arquivo | Uso |
|---|---|
| `docs/design/assets/rescript-wordmark.png` | Logo oficial (fonte) |
| `apps/web/public/brand/rescript-wordmark.png` | Runtime |
| `apps/web/public/brand/mark.svg` | Símbolo 3 barras |
| `apps/web/src/components/brand/*` | React: Logo, Mark, Loader |

**Não alterar a arte da logo.** Só aplicar (tamanho, clear space, contraste de fundo).

---

## 14. Clear space & mínimos

- Clear space ≥ altura do “E” (três barras) em todos os lados
- Wordmark mínimo em UI: ~96px de largura
- Mark mínimo: 16×16 (favicon); preferir 20–24 em chrome

---

## 15. Relação com Quiet Instrument

Quiet Instrument permanece a **direção de produto**.  
Brand Identity define **como a marca oficial se manifesta** nessa direção.  
Conflito de token/cor → prevalece este documento.
