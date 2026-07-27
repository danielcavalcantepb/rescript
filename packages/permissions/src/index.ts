export {
  PERMISSIONS,
  type Permission,
  type PermissionKey,
} from './keys'

export {
  ROLE_PRESETS,
  ROLE_PERMISSIONS,
  permissionsForRole,
  isRolePreset,
  type RolePreset,
} from './roles'

import type { Permission } from './keys'

export function can(
  granted: readonly string[],
  permission: Permission,
): boolean {
  if (granted.includes(permission)) return true

  // products.write implies Catalog variant management actions.
  if (
    permission.startsWith('products.variants.') &&
    granted.includes('products.write')
  ) {
    return true
  }
  if (
    permission === 'products.variants.read' &&
    granted.includes('products.read')
  ) {
    return true
  }

  // products.write also implies Price Engine actions (Catalog ops roles).
  if (permission.startsWith('prices.') && granted.includes('products.write')) {
    return true
  }
  if (permission === 'prices.read' && granted.includes('products.read')) {
    return true
  }
  if (permission === 'prices.resolve' && granted.includes('products.read')) {
    return true
  }

  // Customer aggregate implications.
  if (
    (permission === 'customers.contacts.manage' ||
      permission === 'customers.addresses.manage') &&
    (granted.includes('customers.edit') || granted.includes('customers.write'))
  ) {
    return true
  }
  if (
    (permission === 'customers.archive' ||
      permission === 'customers.restore') &&
    (granted.includes('customers.edit') || granted.includes('customers.write'))
  ) {
    return true
  }

  // Supplier aggregate implications.
  if (
    (permission === 'suppliers.contacts.manage' ||
      permission === 'suppliers.addresses.manage') &&
    (granted.includes('suppliers.edit') || granted.includes('suppliers.write'))
  ) {
    return true
  }
  if (
    (permission === 'suppliers.archive' ||
      permission === 'suppliers.restore') &&
    (granted.includes('suppliers.edit') || granted.includes('suppliers.write'))
  ) {
    return true
  }

  // Purchase aggregate implications.
  if (
    permission === 'purchase.items.manage' &&
    granted.includes('purchase.edit')
  ) {
    return true
  }
  if (
    (permission === 'purchase.archive' || permission === 'purchase.restore') &&
    granted.includes('purchase.edit')
  ) {
    return true
  }

  // Receiving aggregate implications.
  if (
    permission === 'receiving.receive' &&
    (granted.includes('receiving.create') || granted.includes('receiving.post'))
  ) {
    return true
  }
  if (
    (permission === 'receiving.archive' ||
      permission === 'receiving.restore') &&
    (granted.includes('receiving.create') || granted.includes('receiving.post'))
  ) {
    return true
  }

  // Accounts Payable implications.
  if (
    (permission === 'payable.archive' || permission === 'payable.restore') &&
    (granted.includes('payable.edit') || granted.includes('payable.approve'))
  ) {
    return true
  }

  // Inventory foundation / ledger implications.
  if (
    permission === 'inventory.read' &&
    (granted.includes('inventory.move') ||
      granted.includes('inventory.adjust') ||
      granted.includes('inventory.create') ||
      granted.includes('inventory.edit') ||
      granted.includes('inventory.locations.manage') ||
      granted.includes('inventory.movements.read') ||
      granted.includes('inventory.movements.create') ||
      granted.includes('inventory.transfer') ||
      granted.includes('inventory.reverse'))
  ) {
    return true
  }
  if (
    permission === 'inventory.movements.read' &&
    (granted.includes('inventory.move') ||
      granted.includes('inventory.adjust') ||
      granted.includes('inventory.movements.create') ||
      granted.includes('inventory.read'))
  ) {
    return true
  }
  if (
    permission === 'inventory.movements.create' &&
    granted.includes('inventory.move')
  ) {
    return true
  }
  if (
    permission === 'inventory.transfer' &&
    granted.includes('inventory.movements.create')
  ) {
    return true
  }
  if (
    permission === 'inventory.reverse' &&
    granted.includes('inventory.adjust')
  ) {
    return true
  }

  // *.write implies create/edit and Catalog lifecycle / configure actions.
  // Note: inventory.locations.manage is never mapped via *.write.
  if (
    permission.endsWith('.create') ||
    permission.endsWith('.edit') ||
    permission.endsWith('.publish') ||
    permission.endsWith('.archive') ||
    permission.endsWith('.restore') ||
    permission.endsWith('.configure') ||
    permission.endsWith('.activate') ||
    permission.endsWith('.resolve')
  ) {
    const writeKey = permission.replace(
      /\.(create|edit|publish|archive|restore|configure|activate|resolve)$/,
      '.write',
    )
    return granted.includes(writeKey)
  }
  return false
}

export function cannot(
  granted: readonly string[],
  permission: Permission,
): boolean {
  return !can(granted, permission)
}

export function canAny(
  granted: readonly string[],
  permissions: readonly Permission[],
): boolean {
  return permissions.some((p) => can(granted, p))
}

export function canAll(
  granted: readonly string[],
  permissions: readonly Permission[],
): boolean {
  return permissions.every((p) => can(granted, p))
}
