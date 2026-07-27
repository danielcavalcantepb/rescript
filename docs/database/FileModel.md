---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / FileModel
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Modelo Lógico — Arquivos

---

## 1. FileObject

| Campo | |
|---|---|
| id, organization_id | isolamento obrigatório |
| category | product_image\|import\|fiscal\|export\|temp\|other |
| storage_key / logical_path | inclui org id |
| bucket_logical | |
| filename, content_type, size, content_hash | |
| status | available\|expired\|deleted |
| owner_user_id | |
| linked_entity_type/id | opcional |
| expires_at | temp/import |
| visibility | private |
| created_at | |

---

## 2. Segurança
- Path nunca adivinhável cross-tenant
- URLs assinadas (fase física)
- Temp imports: expiração + purge job

---

## 3. Categorias MVP
Imagens produto (opcional), arquivos import, exports temporários. Fiscal XML/PDF na V1.
