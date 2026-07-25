# Cenário 29 — Insight com Dados Insuficientes

## Cenário

Produto novo; pouco histórico; regra de ruptura não inventa conclusão.

### Objetivo
Validar IntelligencePrinciples / DataTrust: silêncio ou “lacuna de dados”.

### Atores
Insight worker

### Estado inicial
Variante criada hoje; 0–1 movimentos; sem série temporal.

### Pré-condições
Regra RuptureRisk exige N dias de histórico.

### Passos executados

#### 1. Evaluate RuptureRisk
1. **Comando:** EvaluateInsightRule
3. **Validações:** min_history_days falha
5. **Criadas:** nenhuma Insight de ruptura **ou** Insight tipo lacuna (DataGap) se catálogo permitir
6. Sem projeção inventada
12. Bloco “Lacunas de dados” na Central (derivado)
13. Falha: não aplicar

### Estado final esperado
Sem falso positivo de ruptura; opcionalmente lacuna explícita.

### Invariantes verificadas
Não inventar; confiança/dados insuficientes.

### Inconsistências encontradas
Nenhuma.

### Ajustes recomendados
Manter DataGap como insight de categoria distinta, não como “risco alto”.

### Classificação
**aprovado**
