---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: design / Typography
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Tipografia

> Derivada da geometria fina e do tracking da logo. Autoridade: `BrandIdentity.md`.

---

## 1. Escolha: Geist

**Geist** é a tipografia oficial do produto.

| Critério | Encaixe |
|---|---|
| Geometria | Sans limpa, alinhada ao wordmark |
| Peso | Suporta leveza visual do traço da logo |
| Produto | Quiet Instrument / Linear-like |
| Mono | Geist Mono para operação (SKU, dinheiro) |

Fallbacks: Inter (técnico) · Söhne / Aeonik / Suisse (marketing).  
**Não** serif editorial no app. **Não** Inter como identidade de marca — só fallback.

---

## 2. Papéis

| Papel | Família | Peso | Uso |
|---|---|---|---|
| Display | Geist | Medium | Onboarding, splash |
| Heading | Geist | Medium | Título página / seção |
| Body | Geist | Regular | Texto padrão |
| Label | Geist | Medium | Forms, nav |
| Caption | Geist | Regular | Meta, ajuda |
| Monospace | Geist Mono | Regular | SKU, BRL, códigos |

---

## 3. Escala

| Token | Size / Line | Tracking | Uso |
|---|---|---|---|
| `display` | 32 / 40 | −0.01em | Raro no app |
| `title` | 24 / 32 | −0.01em | Título de página |
| `heading` | 18 / 28 | 0 | Seção |
| `body` | 14 / 22 | 0 | Padrão |
| `label` | 13 / 18 | +0.01em | Labels |
| `caption` | 12 / 16 | +0.01em | Badges, overlines |
| `metric` | 28 / 36 | −0.02em | Central / Metric Card |

Preferir ≤ 3 tamanhos por vista. Números: `tabular-nums`.

---

## 4. Peso

Regular + Medium bastam. Bold só em métricas excepcionais.  
Wordmark tipográfico (fallback): tracking ~0.12–0.18em — preferir PNG oficial.

---

## 5. Hierarquia na Central

1. Conclusão do insight  
2. Impacto  
3. Meta/origem  
4. Métricas subordinadas aos blocos de atenção  

---

## 6. Anti-padrões

- Título marketing em tela operacional  
- ALL CAPS em labels  
- Texto justificado  
- Segunda família display no produto  
