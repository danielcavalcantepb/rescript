# Estados de Erro

---

## 1. Camadas

| Camada | UI |
|---|---|
| Campo | Mensagem abaixo do input |
| Form | Alert no topo + foco no primeiro erro |
| Página | Empty error com retry |
| Global | Toast para falha de rede pontual |
| Permissão | Página/ação explain |
| Domínio (estoque, desconto) | Alert contextual na Sale |

---

## 2. Irrecuperável vs recuperável

- Recuperável: Retry  
- Irrecuperável: explicar + caminho alternativo (“Voltar às vendas”)  

---

## 3. Falha pós-commit (HTTP)

Usuário reenvia → vê venda já confirmada (idempotência). Copy: “Esta venda já estava confirmada.”

---

## 4. Tom

Calmo, específico, acionável. Ver `UXWriting.md`.
