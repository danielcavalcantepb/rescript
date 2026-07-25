import { useEffect, type ReactNode } from 'react'
import { commandRegistry } from '#/platform/commands/registry'
import { defaultCommands } from '#/platform/commands/default-commands'

/** Registers platform default commands once. Modules can register more later. */
export function CommandBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => commandRegistry.registerMany(defaultCommands), [])
  return children
}
