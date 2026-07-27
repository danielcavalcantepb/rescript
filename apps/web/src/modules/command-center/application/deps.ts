import type { PermissionKey } from '@rescript/permissions'
import type { CommandCenterReadRepository } from './ports'

export type CommandCenterAppDeps = {
  can: (permission: PermissionKey) => boolean
  read: CommandCenterReadRepository
}
