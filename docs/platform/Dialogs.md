# Dialog System

## Imperative API (preferred)

```ts
import { dialogs } from '#/platform/dialogs'

const result = await dialogs.confirm({
  title: 'Confirmar?',
  description: '…',
})

await dialogs.delete({ title: 'Excluir cliente?', description: '…' })
await dialogs.discard()
await dialogs.danger({ title: 'Ação irreversível', description: '…' })
await dialogs.prompt({ title: 'Nome', description: '…', promptPlaceholder: '…' })
```

## Host

`DialogHost` mounted once in App Shell. Modules must not create parallel dialog stacks.

`ConfirmDialog` remains for rare controlled local state; prefer `dialogs.*`.
