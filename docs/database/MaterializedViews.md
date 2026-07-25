# Materialized Views (futuro / seletivo)

| Candidata | Quando | Refresh | Risco |
|---|---|---|---|
| mv_org_daily_sales | >1k orgs ou BI interno | noturno / horário | stale na Central — **não** usar como FT de atenção urgente |
| mv_variant_velocity | insights ruptura | periódico | dados insuficientes se janela curta |
| mv_customer_rfm | V1+ | semanal | — |

**MVP:** preferir queries indexadas + Insight pré-persistido a mat views. Central “Hoje” pode ser query direta.

**Nunca** materializar como única fonte de saldo de estoque — Balance/ledger mandam.
