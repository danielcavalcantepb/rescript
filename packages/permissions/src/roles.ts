import { PERMISSIONS, type PermissionKey } from './keys'

/** Initial role presets — never check these in UI; map to permission keys. */
export const ROLE_PRESETS = [
  'owner',
  'admin',
  'manager',
  'seller',
  'inventory',
  'finance',
  'viewer',
] as const

export type RolePreset = (typeof ROLE_PRESETS)[number]

const ALL: readonly PermissionKey[] = PERMISSIONS

const READ_CORE: readonly PermissionKey[] = [
  'insights.view',
  'customers.read',
  'products.read',
  'sales.read',
  'inventory.read',
]

/**
 * Preset → permission keys.
 * Future: custom roles, extra grants, restrictions, entitlements.
 */
export const ROLE_PERMISSIONS: Record<RolePreset, readonly PermissionKey[]> = {
  owner: ALL,
  /** Admin ≈ full ops; ownership transfer remains gated by membership.is_owner in services. */
  admin: ALL,
  manager: [
    ...READ_CORE,
    'customers.create',
    'customers.edit',
    'customers.write',
    'products.create',
    'products.edit',
    'products.write',
    'sales.create',
    'sales.edit',
    'sales.confirm',
    'sales.cancel',
    'sales.discount',
    'inventory.read',
    'inventory.move',
    'inventory.adjust',
    'payments.register',
    'imports.run',
  ],
  seller: [
    'insights.view',
    'customers.read',
    'customers.create',
    'customers.edit',
    'products.read',
    'sales.read',
    'sales.create',
    'sales.edit',
    'sales.confirm',
    'sales.discount',
    'payments.register',
  ],
  inventory: [
    'insights.view',
    'products.read',
    'products.create',
    'products.edit',
    'inventory.read',
    'inventory.move',
    'inventory.adjust',
  ],
  finance: [
    'insights.view',
    'customers.read',
    'sales.read',
    'finance.receive',
    'payments.register',
    'payments.reverse',
  ],
  viewer: READ_CORE,
}

export function isRolePreset(value: string): value is RolePreset {
  return (ROLE_PRESETS as readonly string[]).includes(value)
}

export function permissionsForRole(role: RolePreset): readonly PermissionKey[] {
  return ROLE_PERMISSIONS[role]
}
