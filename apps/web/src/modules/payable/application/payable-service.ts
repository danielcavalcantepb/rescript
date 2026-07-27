import {
  canApprovePayables,
  canArchivePayables,
  canCancelPayables,
  canCreatePayables,
  canEditPayables,
  canReadPayables,
  canRestorePayables,
  type PayableAppDeps,
} from '#/modules/payable/application/deps'
import {
  PayableConflictError,
  PayableNotEditableError,
  PayableNotFoundError,
  PayablePermissionError,
  PayableValidationError,
  mapRepositoryError,
} from '#/modules/payable/application/errors'
import { assertPayableTransition } from '#/modules/payable/domain/lifecycle'
import { assertInstallmentsMatchTotal } from '#/modules/payable/domain/totals'
import type {
  AccountsPayable,
  CreatePayableInput,
  ListPayablesQuery,
  ListPayablesResult,
  PayableHistoryEntry,
  PayableInstallment,
  PayableListItem,
  PayableSnapshot,
  SearchPayablesQuery,
  UpdatePayableInput,
} from '#/modules/payable/domain/types'
import {
  hasFieldErrors,
  validateCreatePayable,
  validateUpdatePayable,
} from '#/modules/payable/domain/validation'

async function requirePayable(
  deps: PayableAppDeps,
  accountsPayableId: string,
): Promise<AccountsPayable> {
  const payable = await deps.payables.getById(
    deps.organizationId,
    accountsPayableId,
  )
  if (!payable) throw new PayableNotFoundError()
  return payable
}

async function audit(
  deps: PayableAppDeps,
  entry: {
    accountsPayableId: string
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

function assertDraft(payable: AccountsPayable) {
  if (payable.status !== 'draft') throw new PayableNotEditableError()
}

export function createPayableService(deps: PayableAppDeps) {
  return {
    async createPayable(input: CreatePayableInput): Promise<PayableSnapshot> {
      if (!canCreatePayables(deps.can)) throw new PayablePermissionError()
      const errors = validateCreatePayable(input)
      if (hasFieldErrors(errors)) throw new PayableValidationError(errors)

      const origin = await deps.origins.getPostedReceiptOrigin(
        deps.organizationId,
        input.goodsReceiptId,
      )
      if (!origin) {
        throw new PayableValidationError({
          goodsReceiptId: 'Recebimento não encontrado ou não lançado.',
        })
      }

      const issueDate =
        input.issueDate ??
        (origin.receiving.receivedAt
          ? origin.receiving.receivedAt.slice(0, 10)
          : deps.clock.nowIso().slice(0, 10))

      const installments =
        input.installments ??
        [
          {
            dueDate: issueDate,
            amount: origin.originalAmount,
          },
        ]

      try {
        assertInstallmentsMatchTotal(origin.originalAmount, installments)
      } catch {
        throw new PayableValidationError({
          installments: 'A soma das parcelas deve igualar o valor total.',
        })
      }

      const number = await deps.numbers.allocate(deps.organizationId)
      const totals = {
        currency: origin.currency,
        originalAmount: origin.originalAmount,
        openBalance: origin.originalAmount,
      }

      try {
        const payable = await deps.payables.create(
          deps.organizationId,
          deps.userId,
          {
            number,
            supplier: origin.supplier,
            purchase: origin.purchase,
            receiving: origin.receiving,
            status: 'draft',
            currency: origin.currency,
            totals,
            issueDate,
            notes: input.notes?.trim() || null,
          },
        )

        const createdInstallments = await deps.installments.createMany(
          deps.organizationId,
          deps.userId,
          payable.id,
          installments,
        )

        await audit(deps, {
          accountsPayableId: payable.id,
          action: 'payable.created',
          newValue: payable.number,
        })
        deps.events.emit({
          type: 'PayableCreated',
          organizationId: deps.organizationId,
          accountsPayableId: payable.id,
          number: payable.number,
          at: deps.clock.nowIso(),
        })
        for (const inst of createdInstallments) {
          deps.events.emit({
            type: 'InstallmentCreated',
            organizationId: deps.organizationId,
            accountsPayableId: payable.id,
            installmentId: inst.id,
            at: deps.clock.nowIso(),
          })
        }

        return { payable, installments: createdInstallments }
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async updatePayable(
      accountsPayableId: string,
      input: UpdatePayableInput,
    ): Promise<AccountsPayable> {
      if (!canEditPayables(deps.can)) throw new PayablePermissionError()
      const existing = await requirePayable(deps, accountsPayableId)
      assertDraft(existing)
      const errors = validateUpdatePayable(input)
      if (hasFieldErrors(errors)) throw new PayableValidationError(errors)

      try {
        const payable = await deps.payables.updateHeader(
          deps.organizationId,
          deps.userId,
          accountsPayableId,
          input,
        )
        await audit(deps, {
          accountsPayableId,
          action: 'payable.updated',
          fieldName: 'header',
          oldValue: existing.notes,
          newValue: payable.notes,
        })
        return payable
      } catch (error) {
        mapRepositoryError(error)
      }
    },

    async approvePayable(accountsPayableId: string): Promise<AccountsPayable> {
      if (!canApprovePayables(deps.can)) throw new PayablePermissionError()
      const existing = await requirePayable(deps, accountsPayableId)
      assertPayableTransition(existing.status, 'approved')
      const installments = await deps.installments.listByPayable(
        deps.organizationId,
        accountsPayableId,
      )
      if (installments.length === 0) {
        throw new PayableConflictError('Aprove apenas contas com parcelas.')
      }
      const payable = await deps.payables.setStatus(
        deps.organizationId,
        deps.userId,
        accountsPayableId,
        'approved',
        { archivedAt: null, archivedBy: null, previousStatus: null },
      )
      await audit(deps, {
        accountsPayableId,
        action: 'payable.approved',
        oldValue: existing.status,
        newValue: 'approved',
      })
      deps.events.emit({
        type: 'PayableApproved',
        organizationId: deps.organizationId,
        accountsPayableId,
        at: deps.clock.nowIso(),
      })
      return payable
    },

    async cancelPayable(
      accountsPayableId: string,
      reason?: string | null,
    ): Promise<AccountsPayable> {
      if (!canCancelPayables(deps.can)) throw new PayablePermissionError()
      const existing = await requirePayable(deps, accountsPayableId)
      assertPayableTransition(existing.status, 'cancelled')
      await deps.installments.cancelAll(
        deps.organizationId,
        deps.userId,
        accountsPayableId,
      )
      await deps.payables.updateTotals(
        deps.organizationId,
        deps.userId,
        accountsPayableId,
        {
          currency: existing.currency,
          originalAmount: existing.totals.originalAmount,
          openBalance: '0.0000',
        },
      )
      const payable = await deps.payables.setStatus(
        deps.organizationId,
        deps.userId,
        accountsPayableId,
        'cancelled',
        { archivedAt: null, archivedBy: null, previousStatus: null },
      )
      await audit(deps, {
        accountsPayableId,
        action: 'payable.cancelled',
        oldValue: existing.status,
        newValue: 'cancelled',
        reason: reason ?? null,
      })
      deps.events.emit({
        type: 'PayableCancelled',
        organizationId: deps.organizationId,
        accountsPayableId,
        at: deps.clock.nowIso(),
      })
      return payable
    },

    async archivePayable(accountsPayableId: string): Promise<AccountsPayable> {
      if (!canArchivePayables(deps.can)) throw new PayablePermissionError()
      const existing = await requirePayable(deps, accountsPayableId)
      if (existing.status === 'archived') return existing
      assertPayableTransition(existing.status, 'archived')
      const previous = existing.status as Exclude<typeof existing.status, 'archived'>
      const payable = await deps.payables.setStatus(
        deps.organizationId,
        deps.userId,
        accountsPayableId,
        'archived',
        {
          archivedAt: deps.clock.nowIso(),
          archivedBy: deps.userId,
          previousStatus: previous,
        },
      )
      await audit(deps, {
        accountsPayableId,
        action: 'payable.archived',
        oldValue: existing.status,
        newValue: 'archived',
      })
      deps.events.emit({
        type: 'PayableArchived',
        organizationId: deps.organizationId,
        accountsPayableId,
        at: deps.clock.nowIso(),
      })
      return payable
    },

    async restorePayable(accountsPayableId: string): Promise<AccountsPayable> {
      if (!canRestorePayables(deps.can)) throw new PayablePermissionError()
      const existing = await requirePayable(deps, accountsPayableId)
      if (existing.status !== 'archived') {
        throw new PayableConflictError(
          'Somente contas arquivadas podem ser restauradas.',
        )
      }
      const restoreTo = existing.previousStatus ?? 'draft'
      assertPayableTransition('archived', restoreTo)
      const payable = await deps.payables.setStatus(
        deps.organizationId,
        deps.userId,
        accountsPayableId,
        restoreTo,
        { archivedAt: null, archivedBy: null, previousStatus: null },
      )
      await audit(deps, {
        accountsPayableId,
        action: 'payable.restored',
        oldValue: 'archived',
        newValue: restoreTo,
      })
      deps.events.emit({
        type: 'PayableRestored',
        organizationId: deps.organizationId,
        accountsPayableId,
        at: deps.clock.nowIso(),
      })
      return payable
    },

    async getPayable(accountsPayableId: string): Promise<AccountsPayable> {
      if (!canReadPayables(deps.can)) throw new PayablePermissionError()
      return requirePayable(deps, accountsPayableId)
    },

    async getPayableSnapshot(
      accountsPayableId: string,
    ): Promise<PayableSnapshot> {
      if (!canReadPayables(deps.can)) throw new PayablePermissionError()
      const payable = await requirePayable(deps, accountsPayableId)
      const installments = await deps.installments.listByPayable(
        deps.organizationId,
        accountsPayableId,
      )
      return { payable, installments }
    },

    async listInstallments(
      accountsPayableId: string,
    ): Promise<PayableInstallment[]> {
      if (!canReadPayables(deps.can)) throw new PayablePermissionError()
      await requirePayable(deps, accountsPayableId)
      return deps.installments.listByPayable(
        deps.organizationId,
        accountsPayableId,
      )
    },

    async listPayables(query: ListPayablesQuery): Promise<ListPayablesResult> {
      if (!canReadPayables(deps.can)) throw new PayablePermissionError()
      return deps.search.list(deps.organizationId, query)
    },

    async searchPayables(
      query: SearchPayablesQuery,
    ): Promise<PayableListItem[]> {
      if (!canReadPayables(deps.can)) throw new PayablePermissionError()
      return deps.search.search(deps.organizationId, query)
    },

    async listHistory(
      accountsPayableId: string,
      limit?: number,
    ): Promise<PayableHistoryEntry[]> {
      if (!canReadPayables(deps.can)) throw new PayablePermissionError()
      await requirePayable(deps, accountsPayableId)
      return deps.history.listByPayable(
        deps.organizationId,
        accountsPayableId,
        limit,
      )
    },
  }
}

export type PayableService = ReturnType<typeof createPayableService>
