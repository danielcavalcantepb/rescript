# Design System — Rescript UI

> Quiet Instrument + Brand Identity oficial.  
> Fundações: `BrandIdentity.md` · `ColorSystem.md` · `Typography.md` · `Spacing.md` · `Elevation.md` · `Motion.md` · `ComponentCatalog.md`.

---

## 1. Propósito

Sistema para interfaces reconhecíveis como **Rescript**: calmas, precisas, organizadas — instrumentos de trabalho, nunca brinquedos.

---

## 2. Fundações

| Camada | Doc |
|---|---|
| Marca | `BrandIdentity.md` / `BrandGuidelines.md` |
| Cor | `ColorSystem.md` |
| Tipo | `Typography.md` |
| Espaço | `Spacing.md` |
| Elevação | `Elevation.md` |
| Ícone | `Iconography.md` |
| Motion | `Motion.md` |
| Componentes | `ComponentCatalog.md` |
| Escrita | `UXWriting.md` |

---

## 3. Radius

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 6px | inputs, badges |
| `radius-md` | 8px | botões, menus |
| `radius-lg` | 12px | cards, dialogs |
| `radius-xl` | 16px | sheets raros |

Sem pill em CTAs. Pills só em badges/chips.

---

## 4. Grid & spacing

Base 4px · Sidebar 240 · max content ~72rem · gutters 24/16/12.  
Comfortable na Central; Compact em tabelas.

---

## 5. Elevation

| Nível | Tratamento |
|---|---|
| Canvas | `canvas` |
| Surface | `surface` + `border` 1px |
| Overlay | surface + `0 8px 24px rgba(11,18,32,0.08)` |
| Modal | overlay + scrim `overlay` |

---

## 6. Linguagem de componentes

| Peça | Regra |
|---|---|
| Dividers | `border` / `border-soft` — sem grade pesada |
| Containers | Agrupamento real; ar generoso |
| Cards | Só interação/agrupamento; sem card wall |
| Inputs | Label externa; focus ring `focus` 2px |
| Buttons | 1 primary/região; sólido `primary` |
| Tables | Compact; números mono à direita |
| Badges / Chips | Semântica quieta; sem rainbow |
| Timeline | Linha fina `border`; pontos `primary`/`muted` |
| Insight Cards | Borda esq. 3px primary; tipografia calma |
| Metric Cards | Metric type; sem verde automático |
| Dialogs / Drawers | Overlay discreto; copy de especialista |
| Command Palette | Fade+scale; Raycast/Linear |
| Sidebar | Mark + org; nav quieta |
| Topbar | Busca; sem logo duplicado se sidebar presente |
| Brand mark / loader | Três barras — ver `BrandIdentity.md` §3 |

---

## 7. Densidade

| Modo | Onde |
|---|---|
| Comfortable | Central, settings, onboarding |
| Compact | Vendas, estoque, recebíveis |

Toggle de densidade: não no MVP.

---

## 8. Anatomia de tela

```
[Topbar: busca · user]
[Sidebar + mark] [ Título + ação primária ]
                 [ Contexto / filtros ]
                 [ Conteúdo ]
```

---

## 9. Tokens CSS (implementação)

Ver `apps/web/src/styles.css` — variáveis `--color-primary*`, `--color-canvas`, `--brand-gradient`, aliases `accent`/`line` para compatibilidade.
