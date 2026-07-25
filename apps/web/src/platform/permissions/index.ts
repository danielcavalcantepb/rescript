/**
 * Platform permissions public surface.
 * Prefer this barrel in app code; avoid deep imports of the same symbols.
 */
export {
  PermissionProvider,
  usePermission,
  type PermissionStatus,
} from '#/platform/permissions/permission-context'
export {
  FeatureGate,
  PermissionBoundary,
  PermissionGuard,
  RequirePermission,
} from '#/platform/permissions/guards'
