# Formulários

---

## 1. Princípios

- Campos mínimos no caminho feliz  
- Defaults > configuração  
- Validação on blur + on submit  
- Erro junto ao campo + resumo no topo se muitos  
- Nunca pedir o que o sistema pode inferir (moeda, local padrão, variante padrão)

---

## 2. Anatomia

```
Label
[ Controle ]
Helper ou erro
```

Grupos com heading `small` muted. Ações: Cancelar quiet · Salvar/Confirmar primary.

---

## 3. Campos sensíveis ao domínio

| Campo | Padrão UX |
|---|---|
| Money | R$ prefix · 2 casas display · validação ≥ 0 salvo estorno |
| Quantity | precisão por unidade · rejeitar float “lixo” |
| Documento | máscara CPF/CNPJ · opcional |
| SKU | mono · unique feedback imediato |

---

## 4. Multi-step

Máx 2–3 passos. Indicador simples (1 — 2). Não wizard de implantação ERP.

---

## 5. Carga cognitiva checklist

Para cada form: o que remover? automático? esconder em “Avançado”?
