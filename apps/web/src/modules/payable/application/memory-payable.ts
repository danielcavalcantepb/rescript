import type {
  AccountsPayableRepository,
  PayableHistoryRepository,
  PayableInstallmentRepository,
  PayableNumberAllocator,
  PayableOriginSource,
  PayableSearchRepository,
} from '#/modules/payable/application/ports'
import type {
  AccountsPayable,
  ListPayablesQuery,
  ListPayablesResult,
  PayableHistoryEntry,
  PayableInstallment,
  PayableListItem,
  SearchPayablesQuery,
} from '#/modules/payable/domain/types'

export type MemoryPayableOrigin = NonNullable<
  Awaited<ReturnType<PayableOriginSource['getPostedReceiptOrigin']>>
> & { goodsReceiptId: string }

export function createMemoryPayableRepos(seed?: {
  origins?: MemoryPayableOrigin[]
}) {
  const origins = new Map(
    (seed?.origins ?? []).map((o) => [o.goodsReceiptId, structuredClone(o)]),
  )
  const payables = new Map<string, AccountsPayable>()
  const installments = new Map<string, PayableInstallment>()
  const history: PayableHistoryEntry[] = []
  const counters = new Map<string, number>()
  let seq = 1
  const nextId = () => `ap_mem_${seq++}`

  const numbers: PayableNumberAllocator = {
    async allocate(organizationId) {
      const next = (counters.get(organizationId) ?? 0) + 1
      counters.set(organizationId, next)
      return `AP-${String(next).padStart(6, '0')}`
    },
  }

  const originPort: PayableOriginSource = {
    async getPostedReceiptOrigin(_org, goodsReceiptId) {
      const o = origins.get(goodsReceiptId)
      if (!o) return null
      const { goodsReceiptId: _id, ...rest } = o
      return structuredClone(rest)
    },
  }

  const payableRepo: AccountsPayableRepository = {
    async getById(organizationId, id) {
      const p = payables.get(id)
      return p?.organizationId === organizationId ? p : null
    },
    async create(organizationId, _userId, input) {
      for (const existing of payables.values()) {
        if (
          existing.organizationId === organizationId &&
          existing.receivingSnapshot.goodsReceiptId ===
            input.receiving.goodsReceiptId
        ) {
          const err = new Error('duplicate') as Error & { code: string }
          err.code = '23505'
          throw err
        }
      }
      const now = new Date().toISOString()
      const payable: AccountsPayable = {
        id: nextId(),
        organizationId,
        number: input.number,
        supplierSnapshot: input.supplier,
        purchaseSnapshot: input.purchase,
        receivingSnapshot: input.receiving,
        status: input.status,
        previousStatus: null,
        currency: input.currency,
        totals: input.totals,
        issueDate: input.issueDate,
        notes: input.notes,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      payables.set(payable.id, payable)
      return payable
    },
    async updateHeader(organizationId, _userId, id, input) {
      const existing = payables.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next = {
        ...existing,
        notes:
          input.notes !== undefined
            ? input.notes?.trim() || null
            : existing.notes,
        issueDate: input.issueDate ?? existing.issueDate,
        updatedAt: new Date().toISOString(),
      }
      payables.set(id, next)
      return next
    },
    async setStatus(organizationId, _userId, id, status, archive) {
      const existing = payables.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: AccountsPayable = {
        ...existing,
        status,
        previousStatus:
          archive?.previousStatus !== undefined
            ? archive.previousStatus
            : existing.previousStatus,
        archivedAt: archive?.archivedAt ?? null,
        updatedAt: new Date().toISOString(),
      }
      payables.set(id, next)
      return next
    },
    async updateTotals(organizationId, _userId, id, totals) {
      const existing = payables.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next = { ...existing, totals, updatedAt: new Date().toISOString() }
      payables.set(id, next)
      return next
    },
  }

  const installmentRepo: PayableInstallmentRepository = {
    async listByPayable(organizationId, accountsPayableId) {
      return [...installments.values()]
        .filter(
          (i) =>
            i.organizationId === organizationId &&
            i.accountsPayableId === accountsPayableId,
        )
        .sort((a, b) => a.sequence - b.sequence)
    },
    async createMany(organizationId, _userId, accountsPayableId, lines) {
      const now = new Date().toISOString()
      const created: PayableInstallment[] = []
      lines.forEach((line, index) => {
        const row: PayableInstallment = {
          id: nextId(),
          organizationId,
          accountsPayableId,
          sequence: index + 1,
          dueDate: line.dueDate,
          amount: Number(line.amount).toFixed(4),
          openBalance: Number(line.amount).toFixed(4),
          status: 'open',
          notes: line.notes ?? null,
          createdAt: now,
          updatedAt: now,
        }
        installments.set(row.id, row)
        created.push(row)
      })
      return created
    },
    async cancelAll(organizationId, _userId, accountsPayableId) {
      for (const [id, row] of installments) {
        if (
          row.organizationId === organizationId &&
          row.accountsPayableId === accountsPayableId
        ) {
          installments.set(id, {
            ...row,
            status: 'cancelled',
            openBalance: '0.0000',
            updatedAt: new Date().toISOString(),
          })
        }
      }
    },
  }

  const search: PayableSearchRepository = {
    async list(
      organizationId,
      query: ListPayablesQuery,
    ): Promise<ListPayablesResult> {
      const status = query.status ?? 'all'
      const q = (query.q ?? '').toLowerCase().trim()
      let list = [...payables.values()].filter(
        (p) => p.organizationId === organizationId,
      )
      if (status !== 'all') list = list.filter((p) => p.status === status)
      if (q) {
        list = list.filter((p) => {
          const hay = [
            p.number,
            p.supplierSnapshot.legalName,
            p.supplierSnapshot.document,
            p.purchaseSnapshot.purchaseNumber,
            p.receivingSnapshot.goodsReceiptNumber,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return hay.includes(q)
        })
      }
      list.sort((a, b) =>
        query.sort === 'number_asc'
          ? a.number.localeCompare(b.number)
          : b.createdAt.localeCompare(a.createdAt),
      )
      const limit = query.limit ?? 20
      const start = query.cursor
        ? list.findIndex((p) => p.id === query.cursor) + 1
        : 0
      const page = list.slice(Math.max(0, start), Math.max(0, start) + limit)
      const nextCursor =
        start + limit < list.length ? page[page.length - 1]?.id ?? null : null

      const items: PayableListItem[] = []
      for (const p of page) {
        const inst = await installmentRepo.listByPayable(organizationId, p.id)
        const nextDue =
          inst
            .filter((i) => i.status === 'open' && Number(i.openBalance) > 0)
            .map((i) => i.dueDate)
            .sort()[0] ?? null
        if (query.dueFrom && nextDue && nextDue < query.dueFrom) continue
        if (query.dueTo && nextDue && nextDue > query.dueTo) continue
        items.push({
          id: p.id,
          number: p.number,
          supplierLegalName: p.supplierSnapshot.legalName,
          supplierDocument: p.supplierSnapshot.document,
          purchaseNumber: p.purchaseSnapshot.purchaseNumber,
          goodsReceiptNumber: p.receivingSnapshot.goodsReceiptNumber,
          status: p.status,
          currency: p.currency,
          originalAmount: p.totals.originalAmount,
          openBalance: p.totals.openBalance,
          issueDate: p.issueDate,
          nextDueDate: nextDue,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })
      }
      return { items, nextCursor }
    },
    async search(organizationId, query: SearchPayablesQuery) {
      const result = await search.list(organizationId, {
        q: query.q,
        status: query.status,
        limit: query.limit ?? 20,
      })
      return result.items
    },
  }

  const historyRepo: PayableHistoryRepository = {
    async append(organizationId, entry) {
      const row: PayableHistoryEntry = {
        id: nextId(),
        organizationId,
        accountsPayableId: entry.accountsPayableId,
        action: entry.action,
        fieldName: entry.fieldName ?? null,
        oldValue: entry.oldValue ?? null,
        newValue: entry.newValue ?? null,
        reason: entry.reason ?? null,
        actorUserId: entry.actorUserId,
        actorIp: entry.actorIp ?? null,
        createdAt: new Date().toISOString(),
      }
      history.push(row)
      return row
    },
    async listByPayable(organizationId, accountsPayableId, limit = 50) {
      return history
        .filter(
          (h) =>
            h.organizationId === organizationId &&
            h.accountsPayableId === accountsPayableId,
        )
        .slice(-limit)
        .reverse()
    },
  }

  return {
    numbers,
    origins: originPort,
    payables: payableRepo,
    installments: installmentRepo,
    search,
    history: historyRepo,
    seedOrigin(o: MemoryPayableOrigin) {
      origins.set(o.goodsReceiptId, structuredClone(o))
    },
  }
}
