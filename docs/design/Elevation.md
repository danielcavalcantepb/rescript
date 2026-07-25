# Elevação e Superfícies

---

## 1. Filosofia

Elevação comunica **camada**, não luxo. Preferir **borda + superfície** a sombra multicamada (anti-ERP glassmorphism).

| Nível | Tratamento | Uso |
|---|---|---|
| 0 Canvas | `canvas` | Fundo |
| 1 Surface | `surface` + `line` 1px | Cards, painéis, tabelas |
| 2 Overlay | surface + `--shadow-overlay` (`0 8px 24px rgba(11,18,32,0.08)`) | Popover, dropdown, command palette |
| 3 Modal | sombra um pouco maior + scrim `--color-overlay` | Dialog |

**Radius:** ver DesignSystem — tipicamente 8–12px; **não** `rounded-full` em cards.

---

## 2. O que evitar

- Sombra em todo card da home  
- Glow colorido  
- Empilhar 3 overlays  

---

## 3. Separação sem sombra

Muitas listas usam apenas `line` divisória — mais calmo e mais rápido de escanear (GitHub/Linear).
