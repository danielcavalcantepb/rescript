import type {
  InventoryVariantLookup,
  StockLocation,
} from '#/modules/inventory/domain/foundation/types'
import {
  ledgerDelta,
  type LedgerMovementType,
} from '#/modules/inventory/domain/ledger/types'

export type MovementPolicyInput = {
  type: LedgerMovementType
  quantity: number
  reason: string
  location: StockLocation
  lookup: InventoryVariantLookup
  currentOnHand: number
  /** For transfer_in destination / transfer_out source checks. */
  toLocation?: StockLocation | null
  reversesSignedDelta?: number | null
}

export type MovementPolicyOk = {
  ok: true
  signedDelta: number
  afterQuantity: number
}

export type MovementPolicyErr = {
  ok: false
  code: string
  message: string
}

export type MovementPolicyResult = MovementPolicyOk | MovementPolicyErr

/**
 * Pure MovementPolicy — never touches persistence.
 */
export const MovementPolicy = {
  validate(input: MovementPolicyInput): MovementPolicyResult {
    if (!(input.quantity > 0) || !Number.isFinite(input.quantity)) {
      return fail('invalid_quantity', 'Quantidade deve ser positiva.')
    }
    if (!input.reason.trim()) {
      return fail('invalid_reason', 'Motivo obrigatório.')
    }
    if (input.location.status !== 'active') {
      return fail('location_not_active', 'Local inativo ou arquivado.')
    }
    if (input.lookup.organizationId !== input.location.organizationId) {
      return fail('organization_mismatch', 'Organização inconsistente.')
    }
    if (input.lookup.productStatus !== 'active') {
      return fail('product_not_active', 'Produto não está ativo.')
    }
    if (input.lookup.variantStatus !== 'active') {
      return fail('variant_not_active', 'Variante não está ativa.')
    }
    if (!input.lookup.tracksInventory) {
      return fail(
        'variant_does_not_track_inventory',
        'Variante não controla estoque.',
      )
    }
    if (input.currentOnHand < 0) {
      return fail('invalid_quantity', 'Saldo atual inválido.')
    }

    if (
      (input.type === 'transfer_out' || input.type === 'transfer_in') &&
      input.toLocation
    ) {
      if (input.toLocation.status !== 'active') {
        return fail('location_not_active', 'Local de destino inativo.')
      }
      if (input.toLocation.id === input.location.id) {
        return fail('transfer_same_location', 'Origem e destino iguais.')
      }
    }

    let signedDelta: number
    if (input.type === 'reversal') {
      if (
        input.reversesSignedDelta === null ||
        input.reversesSignedDelta === undefined ||
        !Number.isFinite(input.reversesSignedDelta)
      ) {
        return fail('reversal_requires_target', 'Reversão sem movimento alvo.')
      }
      signedDelta = -input.reversesSignedDelta
    } else {
      const delta = ledgerDelta(input.type, input.quantity)
      if (delta === null) {
        return fail('invalid_movement_type', 'Tipo de movimento inválido.')
      }
      signedDelta = delta
    }

    const after = input.currentOnHand + signedDelta
    if (after < 0) {
      return fail('insufficient_stock', 'Saldo insuficiente para a saída.')
    }

    return { ok: true, signedDelta, afterQuantity: after }
  },
}

function fail(code: string, message: string): MovementPolicyErr {
  return { ok: false, code, message }
}
