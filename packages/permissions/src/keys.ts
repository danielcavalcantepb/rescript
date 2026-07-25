/**
 * Permission keys — resource.action convention.
 * Never check roles in UI; always check permissions.
 */
export const PERMISSIONS = [
  'insights.view',
  'customers.read',
  'customers.create',
  'customers.edit',
  'customers.write',
  'products.read',
  'products.create',
  'products.edit',
  'products.write',
  'sales.read',
  'sales.create',
  'sales.edit',
  'sales.confirm',
  'sales.cancel',
  'sales.discount',
  'sales.discount.authorize',
  'inventory.move',
  'inventory.adjust',
  'finance.receive',
  'payments.register',
  'payments.reverse',
  'imports.run',
  'org.settings',
  'members.invite',
  'members.manage_roles',
  'audit.view',
] as const

export type Permission = (typeof PERMISSIONS)[number]
export type PermissionKey = Permission
