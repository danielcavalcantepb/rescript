# Toast System

## API

```ts
import { toast } from '#/platform/toast'
// or
import { notificationService } from '#/platform/services'

toast.success('Salvo')
toast.error('Falhou', 'Tente novamente')
toast.warning('Atenção')
toast.info('Info')
toast.loading('Processando…')
await toast.promise(work, { loading, success, error })
```

## Features

- Variants: success, error, warning, info, loading
- Deduplication by `dedupeKey` (default `variant:title`)
- Queue with max visible = 4
- Configurable `durationMs` (loading = sticky until dismissed)
- Never use `alert()`
