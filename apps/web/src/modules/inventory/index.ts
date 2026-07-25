export type {
  ProductStock,
  InventoryMovement,
  InventoryMovementType,
  StockStatus,
  CreateMovementInput,
  ListStockQuery,
  ListStockResult,
  ListMovementsQuery,
  ListMovementsResult,
  InventoryRepository,
} from '#/modules/inventory/domain/types'
export {
  validateCreateMovement,
  INVENTORY_LIMITS,
} from '#/modules/inventory/domain/validation'
export {
  movementDelta,
  applyDelta,
  stockStatus,
} from '#/modules/inventory/domain/balance'
export { getProductStock } from '#/modules/inventory/application/get-product-stock'
export { listStock } from '#/modules/inventory/application/list-stock'
export { listMovements } from '#/modules/inventory/application/list-movements'
export {
  registerEntry,
  type RegisterEntryInput,
} from '#/modules/inventory/application/register-entry'
export {
  registerExit,
  type RegisterExitInput,
} from '#/modules/inventory/application/register-exit'
export {
  registerAdjustment,
  type RegisterAdjustmentInput,
} from '#/modules/inventory/application/register-adjustment'
export {
  InventoryValidationError,
  PermissionError,
  NotFoundError,
  InsufficientStockError,
  ProductArchivedError,
  inventoryErrorMessage,
  mapRepositoryError,
} from '#/modules/inventory/application/errors'
export {
  SupabaseInventoryRepository,
  supabaseInventoryRepository,
} from '#/modules/inventory/infrastructure/supabase-inventory-repository'
