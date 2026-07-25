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
  if (permission.endsWith('.create') || permission.endsWith('.edit')) {
    const writeKey = permission.replace(/\.(create|edit)$/, '.write')
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
