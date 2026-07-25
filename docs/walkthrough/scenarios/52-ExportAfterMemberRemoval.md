# Cenário 52 — Exportação Após Remoção de Membro (exploratório)

## Cenário

Ex-membro tenta exportar; owner exporta dados da org.

### Objetivo
Retenção vs acesso; DeletionAndRetention.

### Atores
Ex-vendedor; Owner

### Estado inicial
Membership removed; Sales históricas com seller_user_id=ex.

### Passos executados

#### 1. Ex-membro GET export
2. Sem membership → deny
#### 2. Owner export
OK; inclui seller histórico (id/nome snapshot se houver)

### Estado final esperado
Sem acesso residual; dados retidos na org.

### Invariantes verificadas
Authz; retenção operacional.

### Inconsistências encontradas
Snapshot do nome do vendedor na Sale — verificar SaleSnapshots.

### Ajustes recomendados
Incluir seller_display_name no snapshot na confirmação.

### Classificação
**aprovado com ressalvas**
