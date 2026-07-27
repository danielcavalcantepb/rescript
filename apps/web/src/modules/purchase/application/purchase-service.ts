import {
  canApprovePurchases,
  canArchivePurchases,
  canCancelPurchases,
  canCreatePurchases,
  canEditPurchases,
  canManagePurchaseItems,
  canReadPurchases,
  canRestorePurchases,
  type PurchaseAppDeps,
} from '#/modules/purchase/application/deps'
import {
  PurchaseConflictError,
  PurchaseNotEditableError,
  PurchaseNotFoundError,
  PurchasePermissionError,
  PurchaseValidationError,
  mapRepositoryError,
} from '#/modules/purchase/application/errors'
import { assertPurchaseTransition } from '#/modules/purchase/domain/lifecycle'
import {
  calculateLineTotals,
  calculatePurchaseTotals,
} from '#/modules/purchase/domain/totals'
import type {
  AddPurchaseItemInput,
  CreatePurchaseInput,
  ListPurchasesQuery,
  ListPurchasesResult,
  PurchaseHistoryEntry,
  PurchaseItem,
  PurchaseOrder,
  PurchaseSnapshot,
  SearchPurchasesQuery,
  UpdatePurchaseInput,
  UpdatePurchaseItemInput,
  PurchaseListItem,
} from '#/modules/purchase/domain/types'
import {
  hasFieldErrors,
  validateAddItem,
  validateCreatePurchase,
  validateUpdateItem,
  validateUpdatePurchase,
} from '#/modules/purchase/domain/validation'

async function requirePurchase(
  deps: PurchaseAppDeps,
  purchaseOrderId: string,
): Promise<PurchaseOrder> {
  const order = await deps.purchases.getById(
    deps.organizationId,
    purchaseOrderId,
  )
  if (!order) throw new PurchaseNotFoundError()
  return order
}

async function audit(
  deps: PurchaseAppDeps,
  entry: {
    purchaseOrderId: string
    action: string
    fieldName?: string | null
    oldValue?: string | null
    newValue?: string | null
    reason?: string | null
  },
) {
  await deps.history.append(deps.organizationId, {
    ...entry,
    actorUserId: deps.userId,
    actorIp: deps.actorIp ?? null,
  })
}

function assertDraft(order: PurchaseOrder) {
  if (order.status !== 'draft') {
    throw new PurchaseNotEditableError(
      'Somente pedidos em rascunho podem ser alterados.',
    )
  }
}

async function refreshTotals(
  deps: PurchaseAppDeps,
  purchaseOrderId: string,
  currency: string,
): Promise<PurchaseOrder> {
  const items = await deps.items.listByPurchase(
    deps.organizationId,
    purchaseOrderId,
    false,
  )
  const totals = calculatePurchaseTotals(items, currency)
  return deps.purchases.updateTotals(
    deps.organizationId,
    deps.userId,
    purchaseOrderId,
    totals,
  )
}

export function createPurchaseService(deps: PurchaseAppDeps) {
  return {
    async createPurchase(input: CreatePurchaseInput): Promise<PurchaseOrder> {
      if (!canCreatePurchases(deps.can)) throw new PurchasePermissionError()
      const errors = validateCreatePurchase(input)
      if (hasFieldErrors(errors)) throw new PurchaseValidationError(errors)

      const supplierSnapshot = await deps.snapshots.getSupplierSnapshot(
        deps.organizationId,
        input.supplierId,
      )
      if (!supplierSnapshot) {
        throw new PurchaseValidationError({
          supplierId: 'Fornecedor não encontrado.',
        })
      }

      const currency = (input.currency ?? 'BRL').toUpperCase()
      const number = await deps.numbers.allocate(deps.organizationId)
      const totals = calculatePurchaseTotals([], currency)

      try {
        const order = await deps.purchases.create(
          deps.organizationId,
          deps.userId,
          {
            number,
            supplierId: input.supplierId,
            supplierSnapshot,
            status: 'draft',
            currency,
            totals,
            notes: input.notes?.trim() || null,
          },
        )
        await audit(deps, {
          purchaseOrderId: order.id,
          action: 'purchase.created',
          newValue: order.number,
        })
        deps.events.emit({
          type: 'PurchaseCreated',
          organizationId: deps.organizationId,
          purchaseOrderId: order.id,
          number: order.number,
          at: deps.clock.nowIso(),
        })
        return order
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async updatePurchase(
      purchaseOrderId: string,
      input: UpdatePurchaseInput,
    ): Promise<PurchaseOrder> {
      if (!canEditPurchases(deps.can)) throw new PurchasePermissionError()
      const existing = await requirePurchase(deps, purchaseOrderId)
      assertDraft(existing)
      const errors = validateUpdatePurchase(input)
      if (hasFieldErrors(errors)) throw new PurchaseValidationError(errors)

      try {
        const order = await deps.purchases.updateHeader(
          deps.organizationId,
          deps.userId,
          purchaseOrderId,
          {
            notes: input.notes,
            currency: input.currency?.toUpperCase(),
          },
        )
        await audit(deps, {
          purchaseOrderId,
          action: 'purchase.updated',
          fieldName: 'header',
          oldValue: existing.notes,
          newValue: order.notes,
        })
        deps.events.emit({
          type: 'PurchaseUpdated',
          organizationId: deps.organizationId,
          purchaseOrderId,
          at: deps.clock.nowIso(),
        })
        return order
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async approvePurchase(purchaseOrderId: string): Promise<PurchaseOrder> {
      if (!canApprovePurchases(deps.can)) throw new PurchasePermissionError()
      const existing = await requirePurchase(deps, purchaseOrderId)
      assertPurchaseTransition(existing.status, 'approved')
      const items = await deps.items.listByPurchase(
        deps.organizationId,
        purchaseOrderId,
        false,
      )
      if (items.length === 0) {
        throw new PurchaseConflictError(
          'Aprove apenas pedidos com ao menos um item.',
        )
      }
      const order = await deps.purchases.setStatus(
        deps.organizationId,
        deps.userId,
        purchaseOrderId,
        'approved',
        {
          archivedAt: null,
          archivedBy: null,
          previousStatus: null,
        },
      )
      await audit(deps, {
        purchaseOrderId,
        action: 'purchase.approved',
        oldValue: existing.status,
        newValue: 'approved',
      })
      deps.events.emit({
        type: 'PurchaseApproved',
        organizationId: deps.organizationId,
        purchaseOrderId,
        at: deps.clock.nowIso(),
      })
      return order
    },

    async cancelPurchase(
      purchaseOrderId: string,
      reason?: string | null,
    ): Promise<PurchaseOrder> {
      if (!canCancelPurchases(deps.can)) throw new PurchasePermissionError()
      const existing = await requirePurchase(deps, purchaseOrderId)
      assertPurchaseTransition(existing.status, 'cancelled')
      const order = await deps.purchases.setStatus(
        deps.organizationId,
        deps.userId,
        purchaseOrderId,
        'cancelled',
        {
          archivedAt: null,
          archivedBy: null,
          previousStatus: null,
        },
      )
      await audit(deps, {
        purchaseOrderId,
        action: 'purchase.cancelled',
        oldValue: existing.status,
        newValue: 'cancelled',
        reason: reason ?? null,
      })
      deps.events.emit({
        type: 'PurchaseCancelled',
        organizationId: deps.organizationId,
        purchaseOrderId,
        at: deps.clock.nowIso(),
      })
      return order
    },

    async archivePurchase(purchaseOrderId: string): Promise<PurchaseOrder> {
      if (!canArchivePurchases(deps.can)) throw new PurchasePermissionError()
      const existing = await requirePurchase(deps, purchaseOrderId)
      if (existing.status === 'archived') return existing
      assertPurchaseTransition(existing.status, 'archived')
      const previous = existing.status as Exclude<
        typeof existing.status,
        'archived'
      >
      const order = await deps.purchases.setStatus(
        deps.organizationId,
        deps.userId,
        purchaseOrderId,
        'archived',
        {
          archivedAt: deps.clock.nowIso(),
          archivedBy: deps.userId,
          previousStatus: previous,
        },
      )
      await audit(deps, {
        purchaseOrderId,
        action: 'purchase.archived',
        oldValue: existing.status,
        newValue: 'archived',
      })
      deps.events.emit({
        type: 'PurchaseArchived',
        organizationId: deps.organizationId,
        purchaseOrderId,
        at: deps.clock.nowIso(),
      })
      return order
    },

    async restorePurchase(purchaseOrderId: string): Promise<PurchaseOrder> {
      if (!canRestorePurchases(deps.can)) throw new PurchasePermissionError()
      const existing = await requirePurchase(deps, purchaseOrderId)
      if (existing.status !== 'archived') {
        throw new PurchaseConflictError('Somente pedidos arquivados podem ser restaurados.')
      }
      const restoreTo = existing.previousStatus ?? 'draft'
      assertPurchaseTransition('archived', restoreTo)
      const order = await deps.purchases.setStatus(
        deps.organizationId,
        deps.userId,
        purchaseOrderId,
        restoreTo,
        {
          archivedAt: null,
          archivedBy: null,
          previousStatus: null,
        },
      )
      await audit(deps, {
        purchaseOrderId,
        action: 'purchase.restored',
        oldValue: 'archived',
        newValue: restoreTo,
      })
      deps.events.emit({
        type: 'PurchaseRestored',
        organizationId: deps.organizationId,
        purchaseOrderId,
        at: deps.clock.nowIso(),
      })
      return order
    },

    async addItem(input: AddPurchaseItemInput): Promise<PurchaseItem> {
      if (!canManagePurchaseItems(deps.can)) throw new PurchasePermissionError()
      const errors = validateAddItem(input)
      if (hasFieldErrors(errors)) throw new PurchaseValidationError(errors)

      const order = await requirePurchase(deps, input.purchaseOrderId)
      assertDraft(order)

      const variantSnapshot = await deps.snapshots.getVariantSnapshot(
        deps.organizationId,
        input.variantId,
      )
      if (!variantSnapshot) {
        throw new PurchaseValidationError({
          variantId: 'Variante não encontrada.',
        })
      }

      let priceSnapshot = input.unitPrice
        ? {
            currency: order.currency,
            unitPrice: input.unitPrice,
            priceListId: null as string | null,
            source: 'manual' as const,
          }
        : await deps.snapshots.resolvePriceSnapshot(
            deps.organizationId,
            input.variantId,
            order.currency,
          )

      if (!priceSnapshot) {
        throw new PurchaseValidationError({
          unitPrice: 'Informe o preço unitário ou configure uma lista de preços.',
        })
      }

      if (input.unitPrice !== undefined) {
        priceSnapshot = {
          ...priceSnapshot,
          unitPrice: input.unitPrice,
          source: 'manual',
          priceListId: null,
        }
      }

      const discount = input.discount ?? '0'
      const line = calculateLineTotals({
        quantity: input.quantity,
        unitPrice: priceSnapshot.unitPrice,
        discount,
      })

      const existingItems = await deps.items.listByPurchase(
        deps.organizationId,
        order.id,
        true,
      )
      const sortOrder = existingItems.length

      try {
        const item = await deps.items.create(
          deps.organizationId,
          deps.userId,
          {
            purchaseOrderId: order.id,
            variantId: input.variantId,
            variantSnapshot,
            priceSnapshot,
            description:
              input.description?.trim() ||
              variantSnapshot.description ||
              null,
            quantity: input.quantity,
            discount,
            subtotal: line.subtotal,
            total: line.total,
            sortOrder,
          },
        )
        await refreshTotals(deps, order.id, order.currency)
        await audit(deps, {
          purchaseOrderId: order.id,
          action: 'purchase.item_added',
          fieldName: 'item',
          newValue: item.id,
        })
        deps.events.emit({
          type: 'PurchaseItemAdded',
          organizationId: deps.organizationId,
          purchaseOrderId: order.id,
          itemId: item.id,
          at: deps.clock.nowIso(),
        })
        return item
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async updateItem(
      itemId: string,
      input: UpdatePurchaseItemInput,
    ): Promise<PurchaseItem> {
      if (!canManagePurchaseItems(deps.can)) throw new PurchasePermissionError()
      const errors = validateUpdateItem(input)
      if (hasFieldErrors(errors)) throw new PurchaseValidationError(errors)

      const existing = await deps.items.getById(deps.organizationId, itemId)
      if (!existing || existing.status === 'removed') {
        throw new PurchaseNotFoundError()
      }
      const order = await requirePurchase(deps, existing.purchaseOrderId)
      assertDraft(order)

      const quantity = input.quantity ?? existing.quantity
      const unitPrice = input.unitPrice ?? existing.unitPrice
      const discount = input.discount ?? existing.discount
      const line = calculateLineTotals({ quantity, unitPrice, discount })

      try {
        const item = await deps.items.update(
          deps.organizationId,
          deps.userId,
          itemId,
          {
            quantity: input.quantity,
            unitPrice: input.unitPrice,
            discount: input.discount,
            description: input.description,
            subtotal: line.subtotal,
            total: line.total,
            currency: order.currency,
          },
        )
        await refreshTotals(deps, order.id, order.currency)
        await audit(deps, {
          purchaseOrderId: order.id,
          action: 'purchase.item_updated',
          fieldName: 'item',
          oldValue: existing.id,
          newValue: item.id,
        })
        deps.events.emit({
          type: 'PurchaseUpdated',
          organizationId: deps.organizationId,
          purchaseOrderId: order.id,
          at: deps.clock.nowIso(),
        })
        return item
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async removeItem(itemId: string): Promise<PurchaseItem> {
      if (!canManagePurchaseItems(deps.can)) throw new PurchasePermissionError()
      const existing = await deps.items.getById(deps.organizationId, itemId)
      if (!existing || existing.status === 'removed') {
        throw new PurchaseNotFoundError()
      }
      const order = await requirePurchase(deps, existing.purchaseOrderId)
      assertDraft(order)

      const item = await deps.items.softRemove(
        deps.organizationId,
        deps.userId,
        itemId,
      )
      await refreshTotals(deps, order.id, order.currency)
      await audit(deps, {
        purchaseOrderId: order.id,
        action: 'purchase.item_removed',
        fieldName: 'item',
        oldValue: itemId,
      })
      deps.events.emit({
        type: 'PurchaseItemRemoved',
        organizationId: deps.organizationId,
        purchaseOrderId: order.id,
        itemId,
        at: deps.clock.nowIso(),
      })
      return item
    },

    async getPurchase(purchaseOrderId: string): Promise<PurchaseOrder> {
      if (!canReadPurchases(deps.can)) throw new PurchasePermissionError()
      return requirePurchase(deps, purchaseOrderId)
    },

    async getPurchaseSnapshot(
      purchaseOrderId: string,
    ): Promise<PurchaseSnapshot> {
      if (!canReadPurchases(deps.can)) throw new PurchasePermissionError()
      const order = await requirePurchase(deps, purchaseOrderId)
      const items = await deps.items.listByPurchase(
        deps.organizationId,
        purchaseOrderId,
        false,
      )
      return { order, items }
    },

    async listItems(purchaseOrderId: string): Promise<PurchaseItem[]> {
      if (!canReadPurchases(deps.can)) throw new PurchasePermissionError()
      await requirePurchase(deps, purchaseOrderId)
      return deps.items.listByPurchase(
        deps.organizationId,
        purchaseOrderId,
        false,
      )
    },

    async listPurchases(query: ListPurchasesQuery): Promise<ListPurchasesResult> {
      if (!canReadPurchases(deps.can)) throw new PurchasePermissionError()
      return deps.search.list(deps.organizationId, query)
    },

    async searchPurchases(
      query: SearchPurchasesQuery,
    ): Promise<PurchaseListItem[]> {
      if (!canReadPurchases(deps.can)) throw new PurchasePermissionError()
      return deps.search.search(deps.organizationId, query)
    },

    async listHistory(
      purchaseOrderId: string,
      limit?: number,
    ): Promise<PurchaseHistoryEntry[]> {
      if (!canReadPurchases(deps.can)) throw new PurchasePermissionError()
      await requirePurchase(deps, purchaseOrderId)
      return deps.history.listByPurchase(
        deps.organizationId,
        purchaseOrderId,
        limit,
      )
    },
  }
}

export type PurchaseService = ReturnType<typeof createPurchaseService>
