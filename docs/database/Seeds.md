# Seeds Lógicos (não executáveis)

> Valores iniciais conceituais. Sem SQL/seed files.

| Seed | Conteúdo |
|---|---|
| Permissions | catálogo keys (`sales.confirm`, …) |
| System Roles | Owner, Admin, Operador (+ RolePermission map) |
| Units | un, kg, L, cx, m… com precision defaults (**OQ-01**) |
| Plans / Entitlements | códigos internos, não hardcode UX only |
| InsightRules | regras MVP do InsightCatalog (versionadas) |
| FeatureFlags | defaults off para FUT |
| Org on create | StockLocation “Principal” · currency BRL · DiscountPolicy · ReservationPolicy · StockPolicy (RN-34) |

**Não seedar** dados de demo em produção. Ambientes de teste: factories isoladas por org.
