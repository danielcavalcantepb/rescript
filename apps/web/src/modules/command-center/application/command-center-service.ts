import { buildCommandCenterSnapshot } from '#/modules/command-center/domain/rules'
import type { CommandCenterSnapshot } from '#/modules/command-center/domain/types'
import type { CommandCenterAppDeps } from './deps'
import { CommandCenterPermissionError } from './errors'

export function createCommandCenterService(deps: CommandCenterAppDeps) {
  return {
    async getOverview(): Promise<CommandCenterSnapshot> {
      if (!deps.can('insights.view')) throw new CommandCenterPermissionError()
      return buildCommandCenterSnapshot(await deps.read.loadRawSnapshot())
    },
  }
}
