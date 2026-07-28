import {
  canArchiveReceiving,
  canCancelReceiving,
  canCreateReceiving,
  canPostReceiving,
  canReadReceiving,
  canReceiveItems,
  canRestoreReceiving,
  type ReceivingAppDeps,
} from '#/modules/receiving/application/deps'
import {
  ReceivingConflictError,
  ReceivingNotEditableError,
  ReceivingNotFoundError,
  ReceivingPermissionError,
  ReceivingValidationError,
  mapRepositoryError,
} from '#/modules/receiving/application/errors'
import { assertReceiptTransition } from '#/modules/receiving/domain/lifecycle'
import { calculateReceiptTotals } from '#/modules/receiving/domain/totals'
import type {
  CreateReceiptInput,
  GoodsReceipt,
  GoodsReceiptItem,
  ListReceiptsQuery,
  ListReceiptsResult,
  PostReceiptInput,
  ReceiptHistoryEntry,
  ReceiptListItem,
  ReceiptSnapshot,
  SearchReceiptsQuery,
  UpdateReceiptItemInput,
} from '#/modules/receiving/domain/types'
import {
  hasFieldErrors,
  validateCreateReceipt,
  validatePostReceipt,
  validateUpdateReceiptItem,
} from '#/modules/receiving/domain/validation'

async function requireReceipt(
  deps: ReceivingAppDeps,
  goodsReceiptId: string,
): Promise<GoodsReceipt> {
  const receipt = await deps.receipts.getById(
    deps.organizationId,
    goodsReceiptId,
  )
  if (!receipt) throw new ReceivingNotFoundError()
  return receipt
}

async function audit(
  deps: ReceivingAppDeps,
  entry: {
    goodsReceiptId: string
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

function assertDraft(receipt: GoodsReceipt) {
  if (receipt.status !== 'draft') {
    throw new ReceivingNotEditableError()
  }
}

export function createReceivingService(deps: ReceivingAppDeps) {
  return {
    async createReceipt(input: CreateReceiptInput): Promise<ReceiptSnapshot> {
      if (!canCreateReceiving(deps.can)) throw new ReceivingPermissionError()
      const errors = validateCreateReceipt(input)
      if (hasFieldErrors(errors)) throw new ReceivingValidationError(errors)

      const purchase = await deps.purchases.getPurchaseForReceiving(
        deps.organizationId,
        input.purchaseOrderId,
      )
      if (!purchase) {
        throw new ReceivingValidationError({
          purchaseOrderId: 'Pedido não encontrado ou não recebível.',
        })
      }
      if (purchase.status !== 'approved' && purchase.status !== 'confirmed') {
        throw new ReceivingConflictError(
          'Somente pedidos confirmados podem ser recebidos.',
        )
      }

      const active = purchase.items.filter((i) => i.status === 'active')
      if (active.length === 0) {
        throw new ReceivingConflictError('Pedido sem itens ativos.')
      }

      const number = await deps.numbers.allocate(deps.organizationId)

      try {
        const receipt = await deps.receipts.create(
          deps.organizationId,
          deps.userId,
          {
            number,
            purchase: {
              purchaseOrderId: purchase.purchaseOrderId,
              purchaseNumber: purchase.purchaseNumber,
            },
            supplier: purchase.supplier,
            locationId: input.locationId,
            notes: input.notes?.trim() || null,
            status: 'draft',
          },
        )

        const requested = new Map(
          (input.items ?? []).map((i) => [i.purchaseItemId, i]),
        )

        const lineInputs = active.map((line, index) => {
          const req = requested.get(line.purchaseItemId)
          const received =
            req?.receivedQuantity ??
            (Number(line.pendingQuantity) > 0 ? line.pendingQuantity : '0')
          return {
            purchaseItemId: line.purchaseItemId,
            variantId: line.variantId,
            locationId: input.locationId,
            variantSku: line.variantSku,
            variantName: line.variantName,
            unitCode: line.unitCode,
            orderedQuantity: line.orderedQuantity,
            receivedQuantity: received,
            notes: req?.notes ?? null,
            divergence: req?.divergence ?? null,
            sortOrder: index,
          }
        })

        const items = await deps.items.createMany(
          deps.organizationId,
          deps.userId,
          receipt.id,
          lineInputs,
        )

        await audit(deps, {
          goodsReceiptId: receipt.id,
          action: 'goods_receipt.created',
          newValue: receipt.number,
        })
        deps.events.emit({
          type: 'GoodsReceiptCreated',
          organizationId: deps.organizationId,
          goodsReceiptId: receipt.id,
          number: receipt.number,
          at: deps.clock.nowIso(),
        })

        return {
          receipt,
          items,
          totals: calculateReceiptTotals(items),
        }
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async updateReceiptItem(
      itemId: string,
      input: UpdateReceiptItemInput,
    ): Promise<GoodsReceiptItem> {
      if (!canReceiveItems(deps.can)) throw new ReceivingPermissionError()
      const errors = validateUpdateReceiptItem(input)
      if (hasFieldErrors(errors)) throw new ReceivingValidationError(errors)

      const existing = await deps.items.getById(deps.organizationId, itemId)
      if (!existing) throw new ReceivingNotFoundError()
      const receipt = await requireReceipt(deps, existing.goodsReceiptId)
      assertDraft(receipt)

      try {
        const item = await deps.items.update(
          deps.organizationId,
          deps.userId,
          itemId,
          input,
        )
        await audit(deps, {
          goodsReceiptId: receipt.id,
          action: 'goods_receipt.item_updated',
          fieldName: 'receivedQuantity',
          oldValue: existing.receivedQuantity,
          newValue: item.receivedQuantity,
        })
        return item
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async receivePartial(
      goodsReceiptId: string,
      lines: Array<{ itemId: string; receivedQuantity: string }>,
    ): Promise<ReceiptSnapshot> {
      if (!canReceiveItems(deps.can)) throw new ReceivingPermissionError()
      const receipt = await requireReceipt(deps, goodsReceiptId)
      assertDraft(receipt)
      for (const line of lines) {
        const errors = validateUpdateReceiptItem({
          receivedQuantity: line.receivedQuantity,
        })
        if (hasFieldErrors(errors)) throw new ReceivingValidationError(errors)
        const existing = await deps.items.getById(
          deps.organizationId,
          line.itemId,
        )
        if (!existing || existing.goodsReceiptId !== goodsReceiptId) {
          throw new ReceivingNotFoundError()
        }
        await deps.items.update(deps.organizationId, deps.userId, line.itemId, {
          receivedQuantity: line.receivedQuantity,
        })
      }
      const items = await deps.items.listByReceipt(
        deps.organizationId,
        goodsReceiptId,
      )
      return {
        receipt,
        items,
        totals: calculateReceiptTotals(items),
      }
    },

    async receiveComplete(goodsReceiptId: string): Promise<ReceiptSnapshot> {
      if (!canReceiveItems(deps.can)) throw new ReceivingPermissionError()
      const receipt = await requireReceipt(deps, goodsReceiptId)
      assertDraft(receipt)
      const current = await deps.items.listByReceipt(
        deps.organizationId,
        goodsReceiptId,
      )
      for (const item of current) {
        await deps.items.update(deps.organizationId, deps.userId, item.id, {
          receivedQuantity: item.orderedQuantity,
          divergence: 'none',
        })
      }
      const items = await deps.items.listByReceipt(
        deps.organizationId,
        goodsReceiptId,
      )
      return {
        receipt,
        items,
        totals: calculateReceiptTotals(items),
      }
    },

    async postReceipt(input: PostReceiptInput): Promise<ReceiptSnapshot> {
      if (!canPostReceiving(deps.can)) throw new ReceivingPermissionError()
      const errors = validatePostReceipt(input)
      if (hasFieldErrors(errors)) throw new ReceivingValidationError(errors)

      const before = await requireReceipt(deps, input.goodsReceiptId)
      if (before.status !== 'draft' && before.status !== 'posted') {
        throw new ReceivingConflictError(
          'Somente rascunhos podem ser lançados.',
        )
      }
      if (before.status === 'draft') {
        assertReceiptTransition(before.status, 'posted')
      }

      try {
        // Poster is idempotent: repeat with same key never doubles ledger ENTRY.
        const posted = await deps.poster.post(deps.organizationId, {
          goodsReceiptId: input.goodsReceiptId,
          idempotencyKey: input.idempotencyKey.trim(),
          allowOverReceive: input.allowOverReceive ?? false,
        })

        const items = await deps.items.listByReceipt(
          deps.organizationId,
          posted.id,
        )

        if (before.status === 'draft') {
          for (const item of items) {
            if (item.ledgerMovementId) {
              deps.events.emit({
                type: 'InventoryEntryCreated',
                organizationId: deps.organizationId,
                goodsReceiptId: posted.id,
                itemId: item.id,
                at: deps.clock.nowIso(),
              })
            }
          }

          deps.events.emit({
            type: 'GoodsReceiptPosted',
            organizationId: deps.organizationId,
            goodsReceiptId: posted.id,
            at: deps.clock.nowIso(),
          })

          const purchase = await deps.purchases.getPurchaseForReceiving(
            deps.organizationId,
            posted.purchaseOrderId,
          )
          if (purchase?.status === 'closed') {
            deps.events.emit({
              type: 'PurchaseCompleted',
              organizationId: deps.organizationId,
              purchaseOrderId: posted.purchaseOrderId,
              goodsReceiptId: posted.id,
              at: deps.clock.nowIso(),
            })
          } else {
            deps.events.emit({
              type: 'PartialReceivingCompleted',
              organizationId: deps.organizationId,
              purchaseOrderId: posted.purchaseOrderId,
              goodsReceiptId: posted.id,
              at: deps.clock.nowIso(),
            })
          }
        }

        return {
          receipt: posted,
          items,
          totals: calculateReceiptTotals(items),
        }
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async cancelReceipt(goodsReceiptId: string): Promise<GoodsReceipt> {
      if (!canCancelReceiving(deps.can)) throw new ReceivingPermissionError()
      const existing = await requireReceipt(deps, goodsReceiptId)
      assertReceiptTransition(existing.status, 'cancelled')
      if (existing.status === 'posted') {
        throw new ReceivingConflictError(
          'Recebimento lançado não pode ser cancelado nesta sprint.',
        )
      }
      const receipt = await deps.receipts.setStatus(
        deps.organizationId,
        deps.userId,
        goodsReceiptId,
        'cancelled',
        {
          archivedAt: null,
          archivedBy: null,
          previousStatus: null,
        },
      )
      await audit(deps, {
        goodsReceiptId,
        action: 'goods_receipt.cancelled',
        oldValue: existing.status,
        newValue: 'cancelled',
      })
      deps.events.emit({
        type: 'GoodsReceiptCancelled',
        organizationId: deps.organizationId,
        goodsReceiptId,
        at: deps.clock.nowIso(),
      })
      return receipt
    },

    async archiveReceipt(goodsReceiptId: string): Promise<GoodsReceipt> {
      if (!canArchiveReceiving(deps.can)) throw new ReceivingPermissionError()
      const existing = await requireReceipt(deps, goodsReceiptId)
      if (existing.status === 'archived') return existing
      assertReceiptTransition(existing.status, 'archived')
      const previous = existing.status as Exclude<typeof existing.status, 'archived'>
      const receipt = await deps.receipts.setStatus(
        deps.organizationId,
        deps.userId,
        goodsReceiptId,
        'archived',
        {
          archivedAt: deps.clock.nowIso(),
          archivedBy: deps.userId,
          previousStatus: previous,
        },
      )
      await audit(deps, {
        goodsReceiptId,
        action: 'goods_receipt.archived',
        oldValue: existing.status,
        newValue: 'archived',
      })
      deps.events.emit({
        type: 'GoodsReceiptArchived',
        organizationId: deps.organizationId,
        goodsReceiptId,
        at: deps.clock.nowIso(),
      })
      return receipt
    },

    async restoreReceipt(goodsReceiptId: string): Promise<GoodsReceipt> {
      if (!canRestoreReceiving(deps.can)) throw new ReceivingPermissionError()
      const existing = await requireReceipt(deps, goodsReceiptId)
      if (existing.status !== 'archived') {
        throw new ReceivingConflictError(
          'Somente recebimentos arquivados podem ser restaurados.',
        )
      }
      const restoreTo = existing.previousStatus ?? 'draft'
      assertReceiptTransition('archived', restoreTo)
      const receipt = await deps.receipts.setStatus(
        deps.organizationId,
        deps.userId,
        goodsReceiptId,
        restoreTo,
        {
          archivedAt: null,
          archivedBy: null,
          previousStatus: null,
        },
      )
      await audit(deps, {
        goodsReceiptId,
        action: 'goods_receipt.restored',
        oldValue: 'archived',
        newValue: restoreTo,
      })
      deps.events.emit({
        type: 'GoodsReceiptRestored',
        organizationId: deps.organizationId,
        goodsReceiptId,
        at: deps.clock.nowIso(),
      })
      return receipt
    },

    async getReceipt(goodsReceiptId: string): Promise<GoodsReceipt> {
      if (!canReadReceiving(deps.can)) throw new ReceivingPermissionError()
      return requireReceipt(deps, goodsReceiptId)
    },

    async getReceiptSnapshot(goodsReceiptId: string): Promise<ReceiptSnapshot> {
      if (!canReadReceiving(deps.can)) throw new ReceivingPermissionError()
      const receipt = await requireReceipt(deps, goodsReceiptId)
      const items = await deps.items.listByReceipt(
        deps.organizationId,
        goodsReceiptId,
      )
      return {
        receipt,
        items,
        totals: calculateReceiptTotals(items),
      }
    },

    async listReceipts(query: ListReceiptsQuery): Promise<ListReceiptsResult> {
      if (!canReadReceiving(deps.can)) throw new ReceivingPermissionError()
      return deps.search.list(deps.organizationId, query)
    },

    async searchReceipts(
      query: SearchReceiptsQuery,
    ): Promise<ReceiptListItem[]> {
      if (!canReadReceiving(deps.can)) throw new ReceivingPermissionError()
      return deps.search.search(deps.organizationId, query)
    },

    async listHistory(
      goodsReceiptId: string,
      limit?: number,
    ): Promise<ReceiptHistoryEntry[]> {
      if (!canReadReceiving(deps.can)) throw new ReceivingPermissionError()
      await requireReceipt(deps, goodsReceiptId)
      return deps.history.listByReceipt(
        deps.organizationId,
        goodsReceiptId,
        limit,
      )
    },
  }
}

export type ReceivingService = ReturnType<typeof createReceivingService>
