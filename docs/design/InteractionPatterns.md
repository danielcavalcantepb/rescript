---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: design / InteractionPatterns
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Padrões de Interação

---

## 1. Criar

Primary no topo da lista (“Nova venda”). Palette: “Nova venda”. Evitar FAB flutuante (cara de app consumer).

## 2. Salvar vs Confirmar

| Ação | Quando |
|---|---|
| Salvar | Persistir rascunho / cadastro |
| Confirmar venda | Efeito estoque+financeiro — verbo do domínio |
| Registrar pagamento | Liquida obrigação |

Nunca “OK” genérico em ação crítica.

## 3. Destructive

Modal: título do verbo + consequência (“Estoque volta · recebível cancela”) + campo motivo se domínio exige + Danger button.

## 4. Undo

Só se domínio permitir compensação segura. Senão: não prometer Desfazer em toast.

## 5. Double submit

Loading state + idempotency invisível. Mensagem se replay: permanece na Sale confirmada.

## 6. Concorrência

409 → “Esta venda foi alterada. Recarregar.” Não merge silencioso.

## 7. Permissões

Hide nav; em contexto, explain. Self-auth desconto: mensagem “Peça a alguém com permissão”.

## 8. Progressive disclosure

Avançado (atributos, desconto auth, custo médio histórico) atrás de “Mais opções” / tabs secundárias.

## 9. Keyboard

⌘K · `/` foco busca lista · Esc fecha overlay · Enter confirma em modais com cuidado (não default em danger).
