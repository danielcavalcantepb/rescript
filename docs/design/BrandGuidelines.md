---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: design / BrandGuidelines
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Brand Guidelines — Rescript

> Guia prático de aplicação da marca.  
> Autoridade: `BrandIdentity.md`.

---

## 1. Logo oficial

Arquivo-fonte: `docs/design/assets/rescript-wordmark.png`

### Usar
- Wordmark completo em login, onboarding, splash, materiais institucionais
- Fundo branco ou `canvas` claro
- Proporção original — sem stretch

### Não usar
- Recolorir letras individualmente
- Adicionar sombra, outline, glow
- Colocar sobre foto busy ou verde saturado sem contraste
- Redesenhar o “E” ou tipografia

### Clear space
Espaço livre ≥ altura do bloco das três barras do “E”, em todos os lados.

---

## 2. Símbolo (três barras)

O “E” isolado é o **mark** da marca.

| Do | Don’t |
|---|---|
| Gaps iguais | Espaçar irregular |
| Traço fino uniforme | Engrossar para “parecer botão” |
| Gradiente só institucional | Gradiente em favicon dark-mode improvisado sem QA |
| Opacity stagger no loading | Spinner redondo genérico como default |

---

## 3. Degradê

`linear-gradient(90deg, #1A2820, #2A7A56, #5FE09A)`

**Permitido:** splash, onboarding hero, site marketing, mark institucional.  
**Proibido:** botões do app, tabelas, badges de status, cards de insight do dia a dia.

---

## 4. Cor no produto

Primary sólido `#1F7A56` = ação e confiança.  
Verde ≠ dinheiro. Verde = clareza e ordem.

Ver tabela completa em `BrandIdentity.md` §4 e `ColorSystem.md`.

---

## 5. Tipografia

Geist + Geist Mono. Escala e papéis em `Typography.md` / `BrandIdentity.md` §5.

Wordmark tipográfico (texto) só como fallback — preferir o PNG oficial.

---

## 6. Voz

Especialista calmo. Sem marketing efusivo. Exemplos em `UXWriting.md`.

---

## 7. Checklist rápido

1. Parece Rescript?  
2. Calma / precisão / organização?  
3. Degradê só institucional?  
4. Poucas bordas e sombras?  
5. Mark não genérico?
