---
Status: Active
Owner: Product & Engineering
Last-Reviewed: 2026-07-27
Version: 1.0.0
Type: Reference
Scope: Customer Picker
Supersedes: None
Superseded-By: None
Related-Modules: Customers, Sales
---

# Customer Picker

O Customer Picker reutiliza o `EntityPicker` compartilhado e a busca paginada,
tenant-scoped, de Customers. A consulta possui debounce, navegação por teclado,
estados de loading/empty/error e não carrega todo o cadastro.

Quando permitido, **Criar cliente** abre o Drawer responsivo e executa o mesmo
Customer Aggregate, Application Service, server function, validações, auditoria,
RLS e permissões usados pelo Workspace de Customers.

Após sucesso, o cache é invalidado, o Drawer fecha, o novo Customer é selecionado
e todo o estado do pedido permanece em memória. Duplicidades continuam sob as
garantias canônicas de Customers; Sales não implementa cadastro alternativo.

