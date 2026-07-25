# Retenção

> Não é parecer jurídico. Complementa `DeletionAndRetention.md`.

| Classe | Política lógica |
|---|---|
| Sale / Movement / Payment / Receivable | retenção operacional longa; sem hard delete |
| AuditEvent | retenção longa; partição/arquivo frio FUT |
| Outbox processed | TTL curto após processed (ex. 7–30d) |
| Import preview rows | TTL curto |
| File temporário | expiração |
| Insight dismissed | cooldown + purge soft FUT |
| Insights active | enquanto relevantes |
| Membership removed | histórico auth retido |
| Org cancelada | bloqueio + retenção/anonimização futura |
| PII Customer | arquivar/anonimizar sob processo — não apagar Sales |

**Jobs:** expire reservations · purge outbox · expire invites · expire files.
