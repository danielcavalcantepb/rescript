import type {
  GoodsReceiptHistoryRepository,
  GoodsReceiptItemRepository,
  GoodsReceiptPostPort,
  GoodsReceiptRepository,
  GoodsReceiptSearchRepository,
  PurchaseReceivingPort,
  PurchaseReceivingView,
  ReceivingNumberAllocator,
} from '#/modules/receiving/application/ports'
import { pendingQuantity } from '#/modules/receiving/domain/totals'
import type {
  GoodsReceipt,
  GoodsReceiptItem,
  ListReceiptsQuery,
  ListReceiptsResult,
  ReceiptHistoryEntry,
  ReceiptListItem,
  ReceiptStatus,
  SearchReceiptsQuery,
} from '#/modules/receiving/domain/types'

type LedgerEntry = {
  id: string
  organizationId: string
  variantId: string
  locationId: string
  quantity: string
  idempotencyKey: string
  referenceId: string
}

export function createMemoryReceivingRepos(seed?: {
  purchases?: PurchaseReceivingView[]
}) {
  const purchases = new Map(
    (seed?.purchases ?? []).map((p) => [p.purchaseOrderId, structuredClone(p)]),
  )
  const receipts = new Map<string, GoodsReceipt>()
  const items = new Map<string, GoodsReceiptItem>()
  const history: ReceiptHistoryEntry[] = []
  const ledger: LedgerEntry[] = []
  const counters = new Map<string, number>()
  const postedByIdem = new Map<string, string>()
  let seq = 1
  const nextId = () => `gr_mem_${seq++}`

  const numbers: ReceivingNumberAllocator = {
    async allocate(organizationId) {
      const next = (counters.get(organizationId) ?? 0) + 1
      counters.set(organizationId, next)
      return `GR-${String(next).padStart(6, '0')}`
    },
  }

  const purchasePort: PurchaseReceivingPort = {
    async getPurchaseForReceiving(organizationId, purchaseOrderId) {
      const p = purchases.get(purchaseOrderId)
      if (!p) return null
      // organization scoping simulated via purchaseOrderId uniqueness in tests
      void organizationId
      return structuredClone(p)
    },
  }

  const receiptRepo: GoodsReceiptRepository = {
    async getById(organizationId, id) {
      const r = receipts.get(id)
      return r?.organizationId === organizationId ? r : null
    },
    async create(organizationId, _userId, input) {
      const now = new Date().toISOString()
      const receipt: GoodsReceipt = {
        id: nextId(),
        organizationId,
        number: input.number,
        purchaseOrderId: input.purchase.purchaseOrderId,
        purchaseSnapshot: input.purchase,
        supplierSnapshot: input.supplier,
        status: input.status,
        previousStatus: null,
        locationId: input.locationId,
        notes: input.notes,
        receivedAt: null,
        postIdempotencyKey: null,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      receipts.set(receipt.id, receipt)
      return receipt
    },
    async updateHeader(organizationId, _userId, id, input) {
      const existing = receipts.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next = {
        ...existing,
        notes:
          input.notes !== undefined
            ? input.notes?.trim() || null
            : existing.notes,
        locationId: input.locationId ?? existing.locationId,
        updatedAt: new Date().toISOString(),
      }
      receipts.set(id, next)
      return next
    },
    async setStatus(organizationId, _userId, id, status, archive) {
      const existing = receipts.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: GoodsReceipt = {
        ...existing,
        status,
        previousStatus:
          archive?.previousStatus !== undefined
            ? archive.previousStatus
            : existing.previousStatus,
        archivedAt: archive?.archivedAt ?? null,
        updatedAt: new Date().toISOString(),
      }
      receipts.set(id, next)
      return next
    },
  }

  const itemRepo: GoodsReceiptItemRepository = {
    async listByReceipt(organizationId, goodsReceiptId) {
      return [...items.values()].filter(
        (i) =>
          i.organizationId === organizationId &&
          i.goodsReceiptId === goodsReceiptId,
      )
    },
    async getById(organizationId, id) {
      const item = items.get(id)
      return item?.organizationId === organizationId ? item : null
    },
    async createMany(organizationId, _userId, goodsReceiptId, lines) {
      const now = new Date().toISOString()
      const created: GoodsReceiptItem[] = []
      for (const line of lines) {
        const item: GoodsReceiptItem = {
          id: nextId(),
          organizationId,
          goodsReceiptId,
          purchaseItemId: line.purchaseItemId,
          variantId: line.variantId,
          locationId: line.locationId,
          variantSku: line.variantSku,
          variantName: line.variantName,
          unitCode: line.unitCode,
          orderedQuantity: line.orderedQuantity,
          receivedQuantity: line.receivedQuantity,
          pendingQuantity: pendingQuantity(
            line.orderedQuantity,
            line.receivedQuantity,
          ),
          divergence: line.divergence,
          notes: line.notes,
          sortOrder: line.sortOrder,
          ledgerMovementId: null,
          createdAt: now,
          updatedAt: now,
        }
        items.set(item.id, item)
        created.push(item)
      }
      return created
    },
    async update(organizationId, _userId, id, input) {
      const existing = items.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const received = input.receivedQuantity ?? existing.receivedQuantity
      const next: GoodsReceiptItem = {
        ...existing,
        receivedQuantity: received,
        pendingQuantity: pendingQuantity(existing.orderedQuantity, received),
        notes: input.notes !== undefined ? input.notes : existing.notes,
        divergence:
          input.divergence !== undefined
            ? input.divergence
            : existing.divergence,
        locationId:
          input.locationId !== undefined
            ? input.locationId
            : existing.locationId,
        updatedAt: new Date().toISOString(),
      }
      items.set(id, next)
      return next
    },
  }

  const search: GoodsReceiptSearchRepository = {
    async list(
      organizationId,
      query: ListReceiptsQuery,
    ): Promise<ListReceiptsResult> {
      const status = query.status ?? 'all'
      const q = (query.q ?? '').toLowerCase().trim()
      let list = [...receipts.values()].filter(
        (r) => r.organizationId === organizationId,
      )
      if (status !== 'all') list = list.filter((r) => r.status === status)
      if (q) {
        list = list.filter((r) => {
          const hay = [
            r.number,
            r.purchaseSnapshot.purchaseNumber,
            r.supplierSnapshot.legalName,
            r.supplierSnapshot.document,
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
        ? list.findIndex((r) => r.id === query.cursor) + 1
        : 0
      const page = list.slice(Math.max(0, start), Math.max(0, start) + limit)
      const nextCursor =
        start + limit < list.length ? page[page.length - 1]?.id ?? null : null
      return {
        items: page.map(
          (r): ReceiptListItem => ({
            id: r.id,
            number: r.number,
            purchaseNumber: r.purchaseSnapshot.purchaseNumber,
            supplierLegalName: r.supplierSnapshot.legalName,
            supplierDocument: r.supplierSnapshot.document,
            status: r.status,
            receivedAt: r.receivedAt,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }),
        ),
        nextCursor,
      }
    },
    async search(organizationId, query: SearchReceiptsQuery) {
      const result = await search.list(organizationId, {
        q: query.q,
        status: query.status,
        limit: query.limit ?? 20,
      })
      return result.items
    },
  }

  const historyRepo: GoodsReceiptHistoryRepository = {
    async append(organizationId, entry) {
      const row: ReceiptHistoryEntry = {
        id: nextId(),
        organizationId,
        goodsReceiptId: entry.goodsReceiptId,
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
    async listByReceipt(organizationId, goodsReceiptId, limit = 50) {
      return history
        .filter(
          (h) =>
            h.organizationId === organizationId &&
            h.goodsReceiptId === goodsReceiptId,
        )
        .slice(-limit)
        .reverse()
    },
  }

  const poster: GoodsReceiptPostPort = {
    async post(organizationId, input) {
      const existingId = postedByIdem.get(
        `${organizationId}:${input.idempotencyKey}`,
      )
      if (existingId) {
        const existing = receipts.get(existingId)
        if (existing) return existing
      }

      const receipt = receipts.get(input.goodsReceiptId)
      if (!receipt || receipt.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      if (receipt.status === 'posted') return receipt
      if (receipt.status !== 'draft') throw new Error('goods_receipt_not_draft')
      if (!receipt.locationId) throw new Error('location_required')

      const purchase = purchases.get(receipt.purchaseOrderId)
      if (
        !purchase ||
        (purchase.status !== 'approved' && purchase.status !== 'confirmed')
      ) {
        throw new Error('purchase_not_receivable')
      }

      const receiptItems = [...items.values()].filter(
        (i) => i.goodsReceiptId === receipt.id,
      )
      const toReceive = receiptItems.filter((i) => Number(i.receivedQuantity) > 0)
      if (toReceive.length === 0) throw new Error('no_items_to_receive')

      for (const item of toReceive) {
        const pi = purchase.items.find(
          (x) => x.purchaseItemId === item.purchaseItemId,
        )
        if (!pi || pi.status !== 'active') throw new Error('purchase_item_not_found')
        const pending = Number(pi.pendingQuantity)
        if (
          Number(item.receivedQuantity) > pending &&
          !input.allowOverReceive
        ) {
          throw new Error('receive_exceeds_pending')
        }
        const lineIdem = `gr:${receipt.id}:item:${item.id}`
        const prior = ledger.find(
          (l) =>
            l.organizationId === organizationId &&
            l.idempotencyKey === lineIdem,
        )
        const movementId = prior?.id ?? nextId()
        if (!prior) {
          ledger.push({
            id: movementId,
            organizationId,
            variantId: item.variantId,
            locationId: item.locationId ?? receipt.locationId!,
            quantity: item.receivedQuantity,
            idempotencyKey: lineIdem,
            referenceId: receipt.id,
          })
        }
        const nextItem = {
          ...item,
          ledgerMovementId: movementId,
          updatedAt: new Date().toISOString(),
        }
        items.set(item.id, nextItem)

        const newReceived =
          Number(pi.receivedQuantity) + Number(item.receivedQuantity)
        pi.receivedQuantity = newReceived.toFixed(4)
        pi.pendingQuantity = pendingQuantity(
          pi.orderedQuantity,
          pi.receivedQuantity,
        )
      }

      const allComplete = purchase.items
        .filter((i) => i.status === 'active')
        .every((i) => Number(i.receivedQuantity) >= Number(i.orderedQuantity))
      if (allComplete) purchase.status = 'closed'

      const posted: GoodsReceipt = {
        ...receipt,
        status: 'posted',
        receivedAt: new Date().toISOString(),
        postIdempotencyKey: input.idempotencyKey,
        updatedAt: new Date().toISOString(),
      }
      receipts.set(posted.id, posted)
      postedByIdem.set(`${organizationId}:${input.idempotencyKey}`, posted.id)
      return posted
    },
  }

  return {
    numbers,
    purchases: purchasePort,
    receipts: receiptRepo,
    items: itemRepo,
    search,
    history: historyRepo,
    poster,
    _ledger: ledger,
    _purchases: purchases,
    seedPurchase(p: PurchaseReceivingView) {
      purchases.set(p.purchaseOrderId, structuredClone(p))
    },
  }
}

export type MemoryReceivingRepos = ReturnType<typeof createMemoryReceivingRepos>
export type _ReceiptStatus = ReceiptStatus
