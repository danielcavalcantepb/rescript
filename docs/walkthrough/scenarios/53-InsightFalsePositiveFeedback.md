# Cenário 53 — Feedback de Falso Positivo em Insight (exploratório)

## Cenário

Usuário marca falso positivo; regra evita recriar o mesmo fingerprint imediatamente.

### Objetivo
Loop de confiança / dismiss.

### Atores
Owner; Insight worker

### Estado inicial
Insight LowStock active; disponível ainda baixo mas usuário discorda do threshold.

### Passos executados

#### 1. Mark false_positive
6. status dismissed; feedback=false_positive; cooldown_until
#### 2. Rule re-run
3. Fingerprint em cooldown → skip
#### 3. Após cooldown / mudança material
Pode reabrir novo insight se condição persiste

### Estado final esperado
Sem spam; feedback auditável.

### Invariantes verificadas
Dedup; explicabilidade.

### Inconsistências encontradas
Duração de cooldown não padronizada.

### Ajustes recomendados
Cooldown em OrganizationPolicy insight.*.

### Classificação
**aprovado com ressalvas**
