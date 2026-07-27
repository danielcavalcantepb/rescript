import type { CommandCenterRawSnapshot } from '#/modules/command-center/domain/types'

export type CommandCenterReadRepository = {
  loadRawSnapshot(): Promise<CommandCenterRawSnapshot>
}
