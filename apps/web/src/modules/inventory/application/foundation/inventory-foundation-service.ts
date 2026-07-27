import type { InventoryFoundationDeps } from '#/modules/inventory/application/foundation/deps'
import type {
  CreateInventoryItemCommand,
  CreateLocationCommand,
  GetAvailabilityQuery,
  LocationIdCommand,
  UpdateInventoryItemCommand,
  UpdateLocationCommand,
} from '#/modules/inventory/application/foundation/dto'
import type {
  CreateAdjustmentCommand,
  CreateEntryCommand,
  CreateExitCommand,
  CreateTransferCommand,
  ListMovementsQuery,
  ReverseMovementCommand,
} from '#/modules/inventory/application/foundation/ledger-dto'
import * as items from '#/modules/inventory/application/foundation/item-use-cases'
import * as ledger from '#/modules/inventory/application/foundation/ledger-use-cases'
import * as locations from '#/modules/inventory/application/foundation/location-use-cases'

export function createInventoryFoundationService(
  deps: InventoryFoundationDeps,
) {
  return {
    listLocations: () => locations.listLocations(deps),
    getLocation: (locationId: string) => locations.getLocation(deps, locationId),
    createLocation: (command: CreateLocationCommand) =>
      locations.createLocation(deps, command),
    updateLocation: (command: UpdateLocationCommand) =>
      locations.updateLocation(deps, command),
    activateLocation: (command: LocationIdCommand) =>
      locations.activateLocation(deps, command),
    deactivateLocation: (command: LocationIdCommand) =>
      locations.deactivateLocation(deps, command),
    archiveLocation: (command: LocationIdCommand) =>
      locations.archiveLocation(deps, command),
    restoreLocation: (command: LocationIdCommand) =>
      locations.restoreLocation(deps, command),

    listInventoryItems: (query?: {
      variantId?: string
      locationId?: string
    }) => items.listInventoryItems(deps, query),
    getInventoryItem: (inventoryItemId: string) =>
      items.getInventoryItem(deps, inventoryItemId),
    createInventoryItem: (command: CreateInventoryItemCommand) =>
      items.createInventoryItem(deps, command),
    updateInventoryItem: (command: UpdateInventoryItemCommand) =>
      items.updateInventoryItem(deps, command),
    getAvailability: (query: GetAvailabilityQuery) =>
      items.getAvailability(deps, query),
    getVariantInventorySummary: (variantId: string) =>
      items.getVariantInventorySummary(deps, variantId),
    lookupVariant: (variantId: string) =>
      items.lookupVariantOperational(deps, variantId),

    createEntry: (command: CreateEntryCommand) =>
      ledger.createEntry(deps, command),
    createExit: (command: CreateExitCommand) =>
      ledger.createExit(deps, command),
    createAdjustment: (command: CreateAdjustmentCommand) =>
      ledger.createAdjustment(deps, command),
    createTransfer: (command: CreateTransferCommand) =>
      ledger.createTransfer(deps, command),
    reverseMovement: (command: ReverseMovementCommand) =>
      ledger.reverseMovement(deps, command),
    listMovements: (query?: ListMovementsQuery) =>
      ledger.listMovements(deps, query),
    getMovement: (movementId: string) => ledger.getMovement(deps, movementId),
    getInventoryHistory: (query: {
      variantId?: string
      inventoryItemId?: string
      limit?: number
    }) => ledger.getInventoryHistory(deps, query),
  }
}

export type InventoryFoundationService = ReturnType<
  typeof createInventoryFoundationService
>
