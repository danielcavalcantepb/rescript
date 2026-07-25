# Sistema de Cores

> Tokens oficiais derivados da logo. Autoridade: `BrandIdentity.md`.

---

## 1. Intenção

- **Calma:** neutros frios, saturação baixa  
- **Confiança:** contraste AA+ em texto  
- **Velocidade:** um acento só para ação  
- **Verde da marca:** clareza · ordem · confiança — **não** dinheiro  
- **Não ERP:** sem azul 2005, sem limão neon em tudo, sem roxo AI  

**Default:** luz (dia de trabalho). Escuro = preferência futura.

---

## 2. Brand (institucional)

| Token | Hex | Uso |
|---|---|---|
| `brand.from` | `#1A2820` | Início do degradê |
| `brand.via` | `#2A7A56` | Meio |
| `brand.to` | `#5FE09A` | Fim |
| `brand.gradient` | `90deg → from/via/to` | Splash, onboarding, marketing |

---

## 3. Paleta de produto

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#1F7A56` | CTA, foco, links ativos |
| `primary-hover` | `#259366` | Hover |
| `primary-active` | `#176345` | Active |
| `primary-soft` | `#E8F7F0` | Selection / nav active |
| `canvas` | `#F3F5F7` | Fundo app |
| `surface` | `#FFFFFF` | Cards, painéis |
| `surface-alt` | `#F8FAFB` | Alt rows |
| `border` | `#E4E8EE` | Bordas |
| `border-soft` | `#EEF1F5` | Divisores leves |
| `ink` / `text-primary` | `#0B1220` | Texto forte |
| `text-secondary` | `#4A5568` | Secundário |
| `muted` | `#7A8494` | Meta |
| `focus` | `#1F7A56` | Ring |
| `selection` | `#E8F7F0` | Highlight |
| `overlay` | `rgba(11,18,32,0.40)` | Scrim |

Aliases de implementação: `accent` = `primary`, `line` = `border`, `ink-muted` ≈ `text-secondary`/`muted` conforme contexto.

---

## 4. Semânticos

| Token | Hex | Uso |
|---|---|---|
| `danger` | `#B42318` | Erro destrutivo |
| `danger-bg` | `#FEF3F2` | Fundo |
| `warning` | `#B54708` | Atenção |
| `warning-bg` | `#FFFAEB` | |
| `success` | `#027A48` | Confirmação concluída |
| `success-bg` | `#ECFDF3` | |
| `info` | `#175CD3` | Info neutra |
| `info-bg` | `#EFF8FF` | |

**Insight severidade** → warning/danger/info — nunca rainbow.  
**Não** pintar métricas “boas” de verde o tempo todo.

---

## 5. Status de domínio (chips)

| Status Sale | Cor |
|---|---|
| Rascunho | muted/gray |
| Orçamento | info |
| Pedido | primary-soft / warning suave |
| Confirmada | success quiet |
| Cancelada | muted + danger text se necessário |

Financeiro: Em aberto / Parcial / Quitado / Vencido — nunca booleano “Pago”.

---

## 6. Contraste

- Texto primário em canvas/surface ≥ 4.5:1  
- Branco sobre `primary` ≥ 4.5:1  
- Não usar `muted` em texto essencial de ação  

---

## 7. Evitar

| Evitar | Motivo |
|---|---|
| Roxo / indigo glow | Clichê AI SaaS |
| Cream + terracotta + serif | Clichê editorial |
| Dashboard dark neon | Ansiedade |
| Verde em todo KPI | Inflação de “sucesso” |
| Degradê em CTA do app | Reserva institucional |
