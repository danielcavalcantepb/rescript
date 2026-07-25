# Command Palette

## Infrastructure

- `commandRegistry.register(command)` / `registerMany`
- Categories: create, navigate, search, action, settings
- Ranking via `rankCommand(query)`
- Optional `permission` gate
- Shortcuts displayed when set
- Default mock commands bootstrap on app load

## Module registration (future)

```ts
commandRegistry.register({
  id: 'sales.create',
  label: 'Nova Venda',
  category: 'create',
  permission: 'sales.create',
  run: ({ navigate }) => navigate('/vendas/nova'),
})
```

UI: `#/platform/commands` → `CommandPalette`.
