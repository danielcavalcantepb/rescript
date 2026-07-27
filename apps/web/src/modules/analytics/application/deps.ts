import type { PermissionKey } from '@rescript/permissions'
import type { AnalyticsProvider } from './ports'

export type AnalyticsAppDeps = {
  can: (permission: PermissionKey) => boolean
  provider: AnalyticsProvider
}
