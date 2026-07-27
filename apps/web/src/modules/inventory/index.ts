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
export type {
  CreateInventoryReservationInput,
  InventoryReservationDetail,
  InventoryReservationHistoryEntry,
  InventoryReservationItem,
  InventoryReservationListItem,
  InventoryReservationListQuery,
  InventoryReservationStatus,
  ReleaseInventoryReservationInput,
} from '#/modules/inventory/domain/reservation/types'
export {
  assertReservationTransition,
  reservationOpenQuantity,
  reservationStatusLabel,
} from '#/modules/inventory/domain/reservation/lifecycle'
export type {
  CreateInventoryPickingInput,
  InventoryPickingDetail,
  InventoryPickingHistoryEntry,
  InventoryPickingItem,
  InventoryPickingListItem,
  InventoryPickingListQuery,
  InventoryPickingStatus,
  UpdateInventoryPickingItemsInput,
} from '#/modules/inventory/domain/picking/types'
export {
  assertPickingTransition,
  pickingOpenQuantity,
  pickingStatusLabel,
} from '#/modules/inventory/domain/picking/lifecycle'
export type {
  CreateInventoryPackingInput,
  InventoryPackingDetail,
  InventoryPackingHistoryEntry,
  InventoryPackingItem,
  InventoryPackingListItem,
  InventoryPackingListQuery,
  InventoryPackingStatus,
} from '#/modules/inventory/domain/packing/types'
export {
  assertPackingTransition,
  packingStatusLabel,
} from '#/modules/inventory/domain/packing/lifecycle'
export type {
  CancelInventoryShipmentInput,
  CompleteInventoryShipmentInput,
  CreateInventoryShipmentInput,
  DispatchInventoryShipmentInput,
  InventoryShipmentDetail,
  InventoryShipmentHistoryEntry,
  InventoryShipmentItem,
  InventoryShipmentListItem,
  InventoryShipmentListQuery,
  InventoryShipmentMovement,
  InventoryShipmentStatus,
  MarkInventoryShipmentReadyInput,
} from '#/modules/inventory/domain/shipment/types'
export {
  assertShipmentTransition,
  shipmentStatusLabel,
} from '#/modules/inventory/domain/shipment/lifecycle'
