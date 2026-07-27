import type {
  CreateLocationCommand,
  LocationIdCommand,
  StockLocationResponse,
  UpdateLocationCommand,
} from '#/modules/inventory/application/foundation/dto'
import {
  requireInventoryArchive,
  requireInventoryRead,
  requireInventoryRestore,
  requireLocationsManage,
  type InventoryFoundationDeps,
} from '#/modules/inventory/application/foundation/deps'
import {
  InventoryFoundationConflictError,
  InventoryFoundationNotFoundError,
  InventoryFoundationPermissionError,
  InventoryFoundationValidationError,
} from '#/modules/inventory/application/foundation/errors'
import { toStockLocationResponse } from '#/modules/inventory/application/foundation/mappers'
import { createStockLocation } from '#/modules/inventory/domain/foundation/factories'
import type { StockLocation } from '#/modules/inventory/domain/foundation/types'

async function loadLocation(
  deps: InventoryFoundationDeps,
  locationId: string,
): Promise<StockLocation> {
  const location = await deps.locations.getById(
    deps.organizationId,
    locationId,
  )
  if (!location) {
    throw new InventoryFoundationNotFoundError('location_not_found')
  }
  return location
}

function normalizePriority(value: number | undefined, fallback: number) {
  const priority = value ?? fallback
  if (!Number.isInteger(priority) || priority < 0 || priority > 1000) {
    throw new InventoryFoundationValidationError({
      priority: 'Prioridade deve ser um inteiro entre 0 e 1000.',
    })
  }
  return priority
}

function validateCodeName(code: string, name: string) {
  const errors: Record<string, string> = {}
  if (!code.trim() || code.trim().length > 32) {
    errors.code = 'Código obrigatório (máx. 32).'
  }
  if (!name.trim() || name.trim().length > 120) {
    errors.name = 'Nome obrigatório (máx. 120).'
  }
  if (Object.keys(errors).length > 0) {
    throw new InventoryFoundationValidationError(errors)
  }
}

export async function listLocations(
  deps: InventoryFoundationDeps,
): Promise<StockLocationResponse[]> {
  if (!requireInventoryRead(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const locations = await deps.locations.listByOrganization(deps.organizationId)
  return locations
    .slice()
    .sort(
      (a, b) =>
        Number(b.isDefault) - Number(a.isDefault) ||
        b.priority - a.priority ||
        a.name.localeCompare(b.name),
    )
    .map(toStockLocationResponse)
}

export async function getLocation(
  deps: InventoryFoundationDeps,
  locationId: string,
): Promise<StockLocationResponse> {
  if (!requireInventoryRead(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  return toStockLocationResponse(await loadLocation(deps, locationId))
}

export async function createLocation(
  deps: InventoryFoundationDeps,
  command: CreateLocationCommand,
): Promise<StockLocationResponse> {
  if (!requireLocationsManage(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  validateCodeName(command.code, command.name)
  const priority = normalizePriority(
    command.priority,
    command.isDefault ? 100 : 0,
  )

  if (command.isDefault) {
    const existingDefault = await deps.locations.getDefault(deps.organizationId)
    if (existingDefault) {
      throw new InventoryFoundationConflictError('default_location_exists')
    }
  }

  const existing = await deps.locations.listByOrganization(deps.organizationId)
  const code = command.code.trim().toUpperCase()
  if (existing.some((l) => l.code === code)) {
    throw new InventoryFoundationConflictError('location_code_exists')
  }

  const location = createStockLocation({
    id: deps.ids.next(),
    organizationId: deps.organizationId,
    code,
    name: command.name,
    description: command.description,
    isDefault: command.isDefault ?? false,
    priority,
  })
  await deps.locations.save(location)
  deps.events.append([
    {
      type: 'LocationCreated',
      organizationId: deps.organizationId,
      locationId: location.id,
    },
  ])
  return toStockLocationResponse(location)
}

export async function updateLocation(
  deps: InventoryFoundationDeps,
  command: UpdateLocationCommand,
): Promise<StockLocationResponse> {
  if (!requireLocationsManage(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const current = await loadLocation(deps, command.locationId)
  if (current.status === 'archived') {
    throw new InventoryFoundationConflictError('location_archived')
  }

  const code = command.code?.trim().toUpperCase() ?? current.code
  const name = command.name?.trim() ?? current.name
  validateCodeName(code, name)
  const priority = normalizePriority(command.priority, current.priority)
  const isDefault = command.isDefault ?? current.isDefault

  if (isDefault && !current.isDefault) {
    const existingDefault = await deps.locations.getDefault(deps.organizationId)
    if (existingDefault && existingDefault.id !== current.id) {
      throw new InventoryFoundationConflictError('default_location_exists')
    }
  }

  const siblings = await deps.locations.listByOrganization(deps.organizationId)
  if (siblings.some((l) => l.id !== current.id && l.code === code)) {
    throw new InventoryFoundationConflictError('location_code_exists')
  }

  const next: StockLocation = {
    ...current,
    code,
    name,
    description:
      command.description !== undefined
        ? command.description?.trim() || null
        : current.description,
    isDefault,
    priority,
  }
  await deps.locations.save(next)
  return toStockLocationResponse(next)
}

export async function activateLocation(
  deps: InventoryFoundationDeps,
  command: LocationIdCommand,
): Promise<StockLocationResponse> {
  if (!requireLocationsManage(deps.can) && !requireInventoryRestore(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const current = await loadLocation(deps, command.locationId)
  if (current.isDefault) {
    const existingDefault = await deps.locations.getDefault(deps.organizationId)
    if (existingDefault && existingDefault.id !== current.id) {
      throw new InventoryFoundationConflictError('default_location_exists')
    }
  }
  const next: StockLocation = {
    ...current,
    status: 'active',
  }
  await deps.locations.save(next)
  deps.events.append([
    {
      type: 'LocationActivated',
      organizationId: deps.organizationId,
      locationId: next.id,
    },
  ])
  return toStockLocationResponse(next)
}

export async function deactivateLocation(
  deps: InventoryFoundationDeps,
  command: LocationIdCommand,
): Promise<StockLocationResponse> {
  if (!requireLocationsManage(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const current = await loadLocation(deps, command.locationId)
  if (current.isDefault) {
    throw new InventoryFoundationConflictError(
      'cannot_deactivate_default_location',
    )
  }
  const next: StockLocation = { ...current, status: 'inactive' }
  await deps.locations.save(next)
  deps.events.append([
    {
      type: 'LocationDeactivated',
      organizationId: deps.organizationId,
      locationId: next.id,
    },
  ])
  return toStockLocationResponse(next)
}

export async function archiveLocation(
  deps: InventoryFoundationDeps,
  command: LocationIdCommand,
): Promise<StockLocationResponse> {
  if (!requireLocationsManage(deps.can) && !requireInventoryArchive(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const current = await loadLocation(deps, command.locationId)
  if (current.isDefault) {
    throw new InventoryFoundationConflictError(
      'cannot_archive_default_location',
    )
  }
  const next: StockLocation = { ...current, status: 'archived' }
  await deps.locations.save(next)
  deps.events.append([
    {
      type: 'LocationArchived',
      organizationId: deps.organizationId,
      locationId: next.id,
    },
  ])
  return toStockLocationResponse(next)
}

export async function restoreLocation(
  deps: InventoryFoundationDeps,
  command: LocationIdCommand,
): Promise<StockLocationResponse> {
  if (!requireLocationsManage(deps.can) && !requireInventoryRestore(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const current = await loadLocation(deps, command.locationId)
  const next: StockLocation = { ...current, status: 'inactive' }
  await deps.locations.save(next)
  return toStockLocationResponse(next)
}
