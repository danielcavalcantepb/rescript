# UX Writing

---

## 1. Regras

1. Português do Brasil, “você”  
2. Frase curta  
3. Verbo no botão = resultado (“Confirmar venda”)  
4. Termos oficiais do domínio  
5. Sem jargão técnico (UUID, RLS, outbox, FK)  
6. Erro = o que aconteceu + o que fazer  
7. Sem “sucesso!” teatral  
8. Voz de **especialista** — nunca marketing  

### Tom da marca

| ✔ | ✘ |
|---|---|
| “2 itens precisam da sua atenção.” | “Parabéns!” |
| “Hoje está tudo sob controle.” | “Incrível!” |
| “Recebimento registrado.” | “Fantástico!” |
| “Nenhum risco encontrado.” | “Nossa IA detectou…” |  

---

## 2. Botões (padrões)

| Evitar | Preferir |
|---|---|
| OK | Continuar / Salvar / Confirmar venda |
| Cancelar operação | Manter venda / Voltar |
| Enviar | Salvar cliente |
| Deletar | Arquivar produto / Excluir rascunho |
| Processar | Importar |

---

## 3. Confirmações

**Confirmar venda**  
Título: Confirmar esta venda?  
Corpo: Vamos baixar o estoque e gerar o recebível de R$ X.  
Primary: Confirmar venda · Secondary: Voltar  

**Cancelar venda confirmada**  
Título: Cancelar venda?  
Corpo: O estoque volta com um lançamento de estorno. O histórico permanece.  
Danger: Cancelar venda  

---

## 4. Avisos / atenção

- “Estoque disponível insuficiente para reservar 4 un (há 2).”  
- “Desconto acima de 5% precisa de autorização.”  
- “Esta organização está suspensa — você pode ver os dados, mas não confirmar vendas.”  

---

## 5. Erros

| Situação | Mensagem |
|---|---|
| Sem permissão | Você não tem permissão para confirmar vendas. Peça ao responsável. |
| Idempotência mismatch | Esta ação já foi usada com outros dados. Atualize a página e tente de novo. |
| Concorrência | Alguém alterou esta venda. Recarregue para ver a versão atual. |
| Rede | Não foi possível salvar. Verifique a conexão e tente de novo. |
| Validação qty | Use até 3 casas decimais para kg. |

Nunca: “Error 500”, “ConstraintViolation”.

---

## 6. Sucesso (toasts)

- “Venda confirmada”  
- “Pagamento de R$ 400 registrado”  
- “Cliente salvo”  
- “Reserva liberada”  

---

## 7. Insights

Título = conclusão.  
“Pode faltar Café 500g em 6 dias”  
Não: “Alerta de ruptura SKU-…”  

CTA: “Repor estoque” · “Ver recebíveis” · “Abrir pedido”

---

## 8. Empty states

Ver `EmptyStates.md`. Tom: acolhedor seco, 1 CTA.

---

## 9. Importação

- “12 prontos · 3 com erro — você pode importar só os prontos.”  
- “SKU CAM-AZUL-P já existe — linha ignorada.”  

---

## 10. Permissões / suporte

- “Modo suporte ativo até 18:00 — suas ações são registradas.”  

---

## 11. Microcopy de estoque

Sempre distinguir: **físico** · **reservado** · **disponível**.  
Helper: “Disponível = físico menos o que já está reservado em pedidos.”
