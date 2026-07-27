---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / SettingsModel
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Modelo Lógico — Configurações e Políticas

---

## 1. Diferenciação

| Tipo | Exemplos | Estrutura |
|---|---|---|
| Configuração plataforma | limites globais | PlatformSetting |
| Política de negócio org | desconto, estoque negativo, expiração reserva | OrganizationPolicy (tipada) |
| Preferência usuário | tema, home | UserPreference |
| Feature flag | rollout | FeatureFlag |
| Entitlement | plano | EntitlementModel |
| Segredo | API keys | SecretRef (cofre) — não valor em claro |

**Evitar** uma única tabela EAV sem schema.

---

## 2. OrganizationPolicy (tipada / namespaced)

Campos lógicos:
- organization_id
- namespace (`inventory`, `sales.discount`, `reservations`, …)
- key
- value (JSON validado por schema_version)
- schema_version
- updated_at, updated_by

### Políticas MVP conhecidas
| Namespace.key | Conteúdo |
|---|---|
| inventory.negative_stock | block \| allow_with_alert |
| reservations.default_ttl | duração (OQ-02 aberto) |
| reservations.quote_reserves | bool (OQ-03 aberto) |
| sales.discount.max_without_auth | Percentage (OQ-04 aberto) |
| sales.discount.max_absolute | Percentage |
| costing.method | weighted_average (fixo FD-01) |

---

## 3. Validação
- Schema por (namespace, key, version)
- Mudança auditada
- Afeta apenas operações futuras (RN-92)

---

## 4. Segredos
`SecretReference`: organization_id, purpose, vault_ref, rotated_at — **nunca** o segredo no modelo de domínio.
