---
Status: Active
Owner: Platform Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: platform / Services
Supersedes: None
Superseded-By: None
Related-Modules: All
---

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
