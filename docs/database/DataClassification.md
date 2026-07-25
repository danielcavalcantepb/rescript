# Classificação de Dados

| Nível | Exemplos | Acesso | Logs | Mask | Export | Retenção | Test envs |
|---|---|---|---|---|---|---|---|
| **Público** | nomes de plano marketing | amplo | ok | — | ok | — | ok |
| **Interno** | SKU, totais agregados sem PII | members | ok | — | perm | operacional | synthetic |
| **Confidencial** | Customer PII, addresses, phones | need-to-know | minimizar | sim em suporte | auditado | política | anonymized |
| **Altamente sensível** | documents, payments detail, secrets, fiscal XML, support grants | mínimo + Fn | proibido valor | sempre | restrito | longa / vault | never prod copies |

### Tokens/segredos
Nunca no DB de domínio em claro; vault refs apenas.

### Métricas
Agregados sem PII = interno; breakdown por cliente = confidencial.
