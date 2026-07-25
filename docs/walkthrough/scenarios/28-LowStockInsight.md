# Cenário 28 — Insight de Estoque Baixo

## Cenário

Regra determinística cria insight; usuário resolve; expira; regra reexecuta com fingerprint.

### Objetivo
Validar InsightModel: fingerprint, dedup, explicação, status.

### Atores
Insight worker; Owner

### Estado inicial
Variante com histórico suficiente; disponível ≤ mínimo.

### Pré-condições
Regra LowStock v1 ativa; dados mínimos ok.

### Passos executados

#### 1. Execução da regra
1. **Comando:** `EvaluateInsightRule(LowStock, org)`
3. **Validações:** dados suficientes; threshold
5. **Criadas:** Insight (fato, severidade, title, explanation, sources, fingerprint, period)
6. Se fingerprint ativo existe → dedup (não duplicar)
8–10. Opcional outbox InsightRaised
11. Decision Center “Requer atenção”
12. O próprio insight

#### 2. Usuário marca resolvido / visto
6. status→resolved/dismissed; feedback
#### 3. Condição melhora (entrada) e piora de novo
- Insight antigo expirado/resolved; novo ciclo com mesmo fingerprint só se política reabrir

### Estado final esperado
Insight explicável (“por quê”); sem spam; rastreável às fontes.

### Invariantes verificadas
Sem IA generativa; DataTrust; dedup.

### Inconsistências encontradas
Nenhuma bloqueante.

### Ajustes recomendados
Documentar política de reabertura pós-resolved.

### Classificação
**aprovado**
