import type {
  PurchaseHistoryRepository,
  PurchaseItemRepository,
  PurchaseNumberAllocator,
  PurchaseRepository,
  PurchaseSearchRepository,
  PurchaseSnapshotSources,
} from '#/modules/purchase/application/ports'
import type {
  PriceSnapshot,
  PurchaseHistoryEntry,
  PurchaseItem,
  PurchaseListItem,
  PurchaseOrder,
  PurchaseStatus,
  SupplierSnapshot,
  VariantSnapshot,
  ListPurchasesQuery,
  ListPurchasesResult,
  SearchPurchasesQuery,
} from '#/modules/purchase/domain/types'
import { calculatePurchaseTotals } from '#/modules/purchase/domain/totals'

function toListItem(order: PurchaseOrder): PurchaseListItem {
  return {
    id: order.id,
    number: order.number,
    supplierLegalName: order.supplierSnapshot.legalName,
    supplierDocument: order.supplierSnapshot.document,
    status: order.status,
    currency: order.currency,
    grandTotal: order.totals.grandTotal,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

export function createMemoryPurchaseRepos(seed?: {
  suppliers?: SupplierSnapshot[]
  variants?: VariantSnapshot[]
  prices?: Record<string, PriceSnapshot>
  orders?: PurchaseOrder[]
  items?: PurchaseItem[]
}) {
  const suppliers = new Map(
    (seed?.suppliers ?? []).map((s) => [s.supplierId, s]),
  )
  const variants = new Map((seed?.variants ?? []).map((v) => [v.variantId, v]))
  const prices = new Map(Object.entries(seed?.prices ?? {}))
  const orders = new Map((seed?.orders ?? []).map((o) => [o.id, o]))
  const items = new Map((seed?.items ?? []).map((i) => [i.id, i]))
  const history: PurchaseHistoryEntry[] = []
  const counters = new Map<string, number>()
  let seq = 1
  const nextId = () => `po_mem_${seq++}`

  const numbers: PurchaseNumberAllocator = {
    async allocate(organizationId) {
      const next = (counters.get(organizationId) ?? 0) + 1
      counters.set(organizationId, next)
      return `PO-${String(next).padStart(6, '0')}`
    },
  }

  const snapshots: PurchaseSnapshotSources = {
    async getSupplierSnapshot(_org, supplierId) {
      return suppliers.get(supplierId) ?? null
    },
    async getVariantSnapshot(_org, variantId) {
      return variants.get(variantId) ?? null
    },
    async resolvePriceSnapshot(_org, variantId, currency) {
      const price = prices.get(variantId)
      if (!price) return null
      if (price.currency !== currency) {
        return { ...price, currency }
      }
      return price
    },
  }

  const purchases: PurchaseRepository = {
    async getById(organizationId, id) {
      const order = orders.get(id)
      return order?.organizationId === organizationId ? order : null
    },
    async create(organizationId, _userId, input) {
      const now = new Date().toISOString()
      const order: PurchaseOrder = {
        id: nextId(),
        organizationId,
        number: input.number,
        supplierId: input.supplierId,
        supplierSnapshot: input.supplierSnapshot,
        status: input.status,
        previousStatus: null,
        currency: input.currency,
        totals: input.totals,
        notes: input.notes,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      orders.set(order.id, order)
      return order
    },
    async updateHeader(organizationId, _userId, id, input) {
      const existing = orders.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: PurchaseOrder = {
        ...existing,
        notes:
          input.notes !== undefined
            ? input.notes?.trim() || null
            : existing.notes,
        currency: input.currency ?? existing.currency,
        totals: input.totals ?? existing.totals,
        updatedAt: new Date().toISOString(),
      }
      orders.set(id, next)
      return next
    },
    async setStatus(organizationId, _userId, id, status, archive) {
      const existing = orders.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: PurchaseOrder = {
        ...existing,
        status,
        previousStatus:
          archive?.previousStatus !== undefined
            ? archive.previousStatus
            : existing.previousStatus,
        archivedAt: archive?.archivedAt ?? null,
        updatedAt: new Date().toISOString(),
      }
      orders.set(id, next)
      return next
    },
    async updateTotals(organizationId, _userId, id, totals) {
      const existing = orders.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next = {
        ...existing,
        totals,
        updatedAt: new Date().toISOString(),
      }
      orders.set(id, next)
      return next
    },
  }

  const itemRepo: PurchaseItemRepository = {
    async listByPurchase(organizationId, purchaseOrderId, includeRemoved) {
      return [...items.values()].filter(
        (i) =>
          i.organizationId === organizationId &&
          i.purchaseOrderId === purchaseOrderId &&
          (includeRemoved || i.status === 'active'),
      )
    },
    async getById(organizationId, id) {
      const item = items.get(id)
      return item?.organizationId === organizationId ? item : null
    },
    async create(organizationId, _userId, input) {
      const now = new Date().toISOString()
      const item: PurchaseItem = {
        id: nextId(),
        organizationId,
        purchaseOrderId: input.purchaseOrderId,
        variantId: input.variantId,
        variantSku: input.variantSnapshot.sku,
        variantName: input.variantSnapshot.name,
        unitCode: input.variantSnapshot.unitCode,
        description: input.description,
        quantity: input.quantity,
        receivedQuantity: '0.0000',
        pendingQuantity: Number(input.quantity).toFixed(4),
        unitPrice: input.priceSnapshot.unitPrice,
        currency: input.priceSnapshot.currency,
        discount: input.discount,
        subtotal: input.subtotal,
        total: input.total,
        priceListId: input.priceSnapshot.priceListId,
        priceSource: input.priceSnapshot.source,
        sortOrder: input.sortOrder,
        status: 'active',
        removedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      items.set(item.id, item)
      return item
    },
    async update(organizationId, _userId, id, input) {
      const existing = items.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: PurchaseItem = {
        ...existing,
        quantity: input.quantity ?? existing.quantity,
        unitPrice: input.unitPrice ?? existing.unitPrice,
        discount: input.discount ?? existing.discount,
        description:
          input.description !== undefined
            ? input.description
            : existing.description,
        subtotal: input.subtotal ?? existing.subtotal,
        total: input.total ?? existing.total,
        currency: input.currency ?? existing.currency,
        updatedAt: new Date().toISOString(),
      }
      items.set(id, next)
      return next
    },
    async softRemove(organizationId, _userId, id) {
      const existing = items.get(id)
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error('not_found')
      }
      const next: PurchaseItem = {
        ...existing,
        status: 'removed',
        removedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      items.set(id, next)
      return next
    },
  }

  const search: PurchaseSearchRepository = {
    async list(
      organizationId,
      query: ListPurchasesQuery,
    ): Promise<ListPurchasesResult> {
      const status = query.status ?? 'all'
      const q = (query.q ?? '').toLowerCase().trim()
      let list = [...orders.values()].filter(
        (o) => o.organizationId === organizationId,
      )
      if (status !== 'all') list = list.filter((o) => o.status === status)
      if (q) {
        list = list.filter((o) => {
          const hay = [
            o.number,
            o.supplierSnapshot.legalName,
            o.supplierSnapshot.document,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return hay.includes(q)
        })
      }
      if (query.from) {
        list = list.filter((o) => o.createdAt >= query.from!)
      }
      if (query.to) {
        list = list.filter((o) => o.createdAt <= query.to!)
      }
      list.sort((a, b) =>
        query.sort === 'number_asc'
          ? a.number.localeCompare(b.number)
          : b.createdAt.localeCompare(a.createdAt),
      )
      const limit = query.limit ?? 20
      const start = query.cursor
        ? list.findIndex((o) => o.id === query.cursor) + 1
        : 0
      const page = list.slice(Math.max(0, start), Math.max(0, start) + limit)
      const nextCursor =
        start + limit < list.length ? page[page.length - 1]?.id ?? null : null
      return { items: page.map(toListItem), nextCursor }
    },
    async search(organizationId, query: SearchPurchasesQuery) {
      const result = await search.list(organizationId, {
        q: query.q,
        status: query.status,
        limit: query.limit ?? 20,
      })
      return result.items
    },
  }

  const historyRepo: PurchaseHistoryRepository = {
    async append(organizationId, entry) {
      const row: PurchaseHistoryEntry = {
        id: nextId(),
        organizationId,
        purchaseOrderId: entry.purchaseOrderId,
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
    async listByPurchase(organizationId, purchaseOrderId, limit = 50) {
      return history
        .filter(
          (h) =>
            h.organizationId === organizationId &&
            h.purchaseOrderId === purchaseOrderId,
        )
        .slice(-limit)
        .reverse()
    },
  }

  return {
    numbers,
    snapshots,
    purchases,
    items: itemRepo,
    search,
    history: historyRepo,
    _orders: orders,
    _items: items,
    recalculate(orderId: string) {
      const order = orders.get(orderId)
      if (!order) return
      const active = [...items.values()].filter(
        (i) => i.purchaseOrderId === orderId && i.status === 'active',
      )
      order.totals = calculatePurchaseTotals(active, order.currency)
    },
    seedSupplier(s: SupplierSnapshot) {
      suppliers.set(s.supplierId, s)
    },
    seedVariant(v: VariantSnapshot) {
      variants.set(v.variantId, v)
    },
    seedPrice(variantId: string, price: PriceSnapshot) {
      prices.set(variantId, price)
    },
  }
}

export type MemoryPurchaseRepos = ReturnType<typeof createMemoryPurchaseRepos>

/** Test helper — unused status keep for compile clarity */
export type _PurchaseStatus = PurchaseStatus
