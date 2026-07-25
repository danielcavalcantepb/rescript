# Cenário 20 — Ajuste de Inventário

## Cenário

Contagem física 8 vs sistêmico 10 → ajuste compensatório −2 com motivo obrigatório.

### Objetivo
Validar RN-36; movimento adjustment; auditoria; impacto em disponível.

### Atores
Operador estoque (`inventory.adjust`)

### Estado inicial
físico=10; reservado=0; disponível=10; média=12.

### Pré-condições
Permissão de ajuste; motivo não vazio.

### Passos executados

#### 1. Ajuste −2
1. **Comando:** `AdjustInventory(V1, delta=-2, reason="Inventário 2026-07", counted=8)`
2. **Autorização:** `inventory.adjust`
3. **Validações:** motivo; **HYPOTHESIS negative forbidden** → físico final ≥0; se reservado>físico pós-ajuste → bloquear ou forçar liberação (lacuna)
4. **Consultadas:** Balance, Reservations ativas
5. **Criadas:** Movement(adjustment_minus, qty=2); Audit; Outbox
6. **Alteradas:** físico 10→8; disponível 8; média **inalterada** (sem custo no ajuste — FD-01.6)
7. **Locks:** Balance FOR UPDATE
8–10. Audit obrigatório com before/after qty
11. Derivados atualizados
12. Insight estoque baixo possível
13. Falha: motivo vazio; delta zeraria abaixo de reservado
14. Recuperação: corrigir motivo / liberar reservas

### Estado final esperado
físico=8; movimento de ajuste append-only; histórico intacto.

### Invariantes verificadas
RN-36; append-only; tenant; disponível=físico−reservado.

### Inconsistências encontradas
- Ajuste com reservas ativas > novo físico: regra pouco explícita.
- Conflito hipótese negativo vs RN-34 se ajuste profundo.

### Ajustes recomendados
Invariante: ajuste não pode deixar físico < reservado; exigir liberação prévia.

### Classificação
**aprovado com ressalvas**
