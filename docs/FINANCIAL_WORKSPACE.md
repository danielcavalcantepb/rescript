---
Status: Active
Owner: Product & Engineering
Last-Reviewed: 2026-07-27
Version: 1.0.0
Type: Canonical
Scope: Financial Workspace
Related-Modules: Accounts Receivable, Accounts Payable, Payments
---

# Financial Workspace

Financeiro é um Workspace de composição. Ele não é aggregate e não transfere
ownership entre Accounts Receivable, Accounts Payable e Payments.

## Rotas canônicas

- `/finance`
- `/finance/receivables`
- `/finance/accounts-payable`
- `/finance/payments`

Somente áreas implementadas são exibidas. Fluxo de caixa, conciliação,
categorias financeiras, relatórios e recebimentos financeiros permanecem
ocultos enquanto não houver implementação canônica.

## Permissões

O acesso ao agrupamento exige ao menos uma das permissões de leitura dos
domínios compostos. Cada aba e cada operação continuam protegidas pela
permissão específica e pela autorização server-side já existente.

## Navegação

O menu principal expõe somente **Financeiro**. A navegação interna responsiva
preserva as páginas e Workspaces dos módulos proprietários.
