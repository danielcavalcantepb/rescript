# Motion

> Toda animação comunica **calma**. Autoridade: `BrandIdentity.md` §7.

---

## 1. Intenção

Presença e hierarquia — não entretenimento.  
Referência: Linear · Apple · Raycast.

---

## 2. Tokens

| Token | Duração | Easing | Uso |
|---|---|---|---|
| `instant` | 0–80ms | — | press |
| `fast` | 120–160ms | ease-out | hover, tabs |
| `base` | 200–240ms | ease-in-out | drawer, palette |
| `slow` | 320ms | ease | raro |

---

## 3. Prioridade de efeitos

1. **fade / opacity**  
2. **scale discreto** (0.98→1)  
3. **slide curto** (≤ 8px)  

---

## 4. Onde usar

1. Command Palette — fade + scale  
2. Insight entrar/sair — fade  
3. Toast — slide da borda  
4. **BrandLoader** — opacity stagger nas 3 barras (80ms)  
5. Sidebar collapse — width smooth  

---

## 5. Proibido

Bounce · confetti · glow pulse · parallax · skeleton shimmer agressivo  

---

## 6. Prefers-reduced-motion

Crossfade instantâneo ou sem animação. BrandLoader vira mark estático.
