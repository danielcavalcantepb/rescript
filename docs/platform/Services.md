# App Services

Decoupled helpers under `#/platform/services`:

| Service | Role |
|---------|------|
| `logger` | Structured console logging (strips secrets) |
| `notificationService` | Facade over toast |
| `clipboardService` | Clipboard write |
| `storageService` | localStorage wrapper (no secrets) |
| `dateService` | pt-BR date formatting |
| `currencyService` | BRL formatting |
| `environmentService` | env flags / config presence |

No business domain logic here.
