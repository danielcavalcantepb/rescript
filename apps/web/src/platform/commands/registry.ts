import type { AppCommand } from '#/platform/commands/types'

type Listener = () => void

const commands = new Map<string, AppCommand>()
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((l) => l())
}

export const commandRegistry = {
  register(command: AppCommand) {
    commands.set(command.id, command)
    emit()
    return () => {
      commands.delete(command.id)
      emit()
    }
  },
  registerMany(list: AppCommand[]) {
    const disposers = list.map((c) => commandRegistry.register(c))
    return () => disposers.forEach((d) => d())
  },
  unregister(id: string) {
    commands.delete(id)
    emit()
  },
  getAll(): AppCommand[] {
    return Array.from(commands.values())
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

/** Score command against query — higher is better. */
export function rankCommand(command: AppCommand, query: string): number {
  const q = query.trim().toLowerCase()
  if (!q) return command.priority ?? 0

  const label = command.label.toLowerCase()
  const keywords = (command.keywords ?? []).map((k) => k.toLowerCase())
  let score = command.priority ?? 0

  if (label === q) score += 100
  else if (label.startsWith(q)) score += 80
  else if (label.includes(q)) score += 50
  else if (keywords.some((k) => k.includes(q))) score += 30
  else return -1

  return score
}
