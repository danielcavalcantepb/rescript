# Matriz de Permissões (Blueprint)

> Chaves alinhadas a `docs/database/AuthorizationDataModel.md`.  
> Org suspensa / sem entitlement: **bloqueia escrita** mesmo com RBAC.

Legenda: ● permitido · ○ negado/oculto · ◐ condicional (policy)

| Ação | Owner/Admin | Operador típico | Só leitura | Chave |
|---|---|---|---|---|
| Ver Central / insights | ● | ● | ● | `insights.view` |
| Clientes CRUD | ● | ● create/edit | ○ write | `customers.*` |
| Produtos CRUD | ● | ● | ○ write | `products.*` |
| Entrada estoque | ● | ● | ○ | `inventory.move` |
| Ajuste estoque | ● | ◐ | ○ | `inventory.adjust` |
| Ver reservas | ● | ● | ● | (leitura inventory) |
| Criar/editar Sale | ● | ● | ○ | `sales.create` `sales.edit` |
| Confirmar venda | ● | ● | ○ | `sales.confirm` |
| Cancelar venda | ● | ◐ | ○ | `sales.cancel` |
| Desconto | ● | ◐ | ○ | `sales.discount` |
| Autorizar desconto | ● | ○ tipicamente | ○ | `sales.discount.authorize` |
| Registrar pagamento | ● | ● | ○ | `payments.register` |
| Estornar pagamento | ● | ◐ | ○ | `payments.reverse` |
| Importar | ● | ◐ | ○ | `imports.run` |
| Convidar membros | ● | ○ | ○ | `members.invite` |
| Papéis | ● | ○ | ○ | `members.manage_roles` |
| Config org | ● | ○ | ○ | `org.settings` |
| Auditoria | ● | ○ | ○ | `audit.view` |
| Exportar | ● | ◐ | ◐ | futuro / `export` se existir |

**Regras UX:**
- Sem permissão na nav → ocultar item  
- Sem permissão em CTA contextual → omitir ou disabled + tooltip  
- Recheck no commit (walkthrough 25/26)  
- Self-authorize desconto: proibido se `allow_self_authorization=false`
