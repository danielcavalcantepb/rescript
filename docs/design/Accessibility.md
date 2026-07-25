# Acessibilidade

---

## 1. Alvo

WCAG 2.2 AA como norte do produto. PME inclui usuários com baixa visão e uso intenso de teclado.

---

## 2. Contraste

Texto ≥ 4.5:1 · UI components ≥ 3:1 · Não usar só cor para status (chip + texto).

---

## 3. Teclado

Tab order lógico · focus-visible ring accent · Esc fecha overlays · Palette full keyboard · Tables: atalhos documentados futuramente.

---

## 4. Screen readers

- Labels em todos os controles  
- Dialog: `role=dialog` + labelledby (especificação futura)  
- Toasts anunciados (polite/assertive conforme severidade)  
- Insights: título lido como heading  

---

## 5. Estados

Disabled explicado · loading announced · erro associado via `aria-describedby` (implementação futura).

---

## 6. Motion

Respeitar `prefers-reduced-motion`.

---

## 7. Responsividade e zoom

Layout usável em 200% zoom desktop. Alvos de toque ≥ 44px no mobile.

---

## 8. Escalas

Não depender de hover-only para ações essenciais.
