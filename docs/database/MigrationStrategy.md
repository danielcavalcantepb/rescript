# Estratégia de Migrations (futura)

> Esta fase **não** cria migrations. Define como a próxima fase deve fazê-lo.

---

## 1. Princípios

- Migrations versionadas, forward-only preferencial  
- Expand/contract para mudanças breaking  
- Nunca editar migration já aplicada em shared envs  
- Separar: schema · constraints · RLS SQL · functions · seeds referenciais  

## 2. Ordem sugerida (fase física)

1. Extensões PG necessárias  
2. Identity / Org / Membership  
3. Catalog / Customer  
4. Inventory ledger  
5. Sale + finance  
6. Insight / Outbox / Audit  
7. Import / File  
8. Billing  
9. RLS policies  
10. Grants / FnOnly wrappers  

## 3. Dados

- Backfill `organization_id` impossível se já nascem corretos  
- Defaults policies via seed migration  
- Evitar locks longos em tabelas quentes (movements) — create index concurrent na ops  

## 4. Rollback

Preferir rollback de release app + forward fix schema; drop column só após contract phase.
