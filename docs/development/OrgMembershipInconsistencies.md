---
Status: Archived
Owner: Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Archive
Scope: development / OrgMembershipInconsistencies
Supersedes: None
Superseded-By: README.md
Related-Modules: All
---

# Inconsistências documentais — Organizations + Memberships

Registradas **antes** da implementação da primeira migration.  
Resoluções adotadas nesta sprint estão marcadas como **Decisão**.

| Tópico | Conflito | Decisão desta sprint |
|--------|----------|----------------------|
| Conjunto de papéis | Auth: 7 presets vs Seeds/UI: Owner/Admin/Operador | **7 presets**: `owner`, `admin`, `manager`, `seller`, `inventory`, `finance`, `viewer` |
| Membership → role | `role_id` + N:N vs role embutido | **`membership.role` text preset**; custom roles ficam para sprint futura |
| Owner | `is_owner` vs role Owner vs `owner_user_id` | **`is_owner boolean` + `role = 'owner'`** na membership; sem `owner_user_id` na organization |
| Nome da org | `name`/`legal_name` vs `trade_name` | Apenas **`name`** (obrigatório); legal/CNPJ fora do escopo |
| Status org | `operational_status` vs `status` | Coluna **`status`**: `active` \| `suspended` \| `canceled` |
| Tabela `user` | Catalog exige `user` próprio | **`auth.users`** como identidade; sem espelho `public.user` nesta sprint |
| Seed StockLocation / policies no create | Onboarding docs pedem | **Adiado** — fora do escopo (sem tabelas de negócio) |
| CreateOrganization UC | Commands existe; UseCases/Functions incompletos | RPC **`create_organization`** documentada em OrganizationsSetup |
| Permissões no DB | Catalog físico `permission`/`role_permission` | **Catálogo em código** (`@rescript/permissions`); DB só guarda preset |
| Org ativa | localStorage vs cookie vs preference table | **localStorage** `rescript.activeOrganizationId` + validação de membership a cada load |
| Naming tabelas | singular | **`organization`**, **`membership`** |

Próximas sprints devem reconciliar Seeds.md / RolesPermissions.md com os 7 presets.
