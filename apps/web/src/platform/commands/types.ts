import type { IconName } from '#/platform/icons/catalog'
import type { PermissionKey } from '@rescript/permissions'

export type CommandCategory =
  | 'create'
  | 'navigate'
  | 'search'
  | 'action'
  | 'settings'

export type AppCommand = {
  id: string
  label: string
  category: CommandCategory
  keywords?: string[]
  shortcut?: string
  icon?: IconName
  /** Optional permission gate — resource.action */
  permission?: PermissionKey
  /** Higher = ranked first when scores tie */
  priority?: number
  run: (ctx: CommandRunContext) => void | Promise<void>
}

export type CommandRunContext = {
  navigate: (href: string) => void
  close: () => void
}

export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  create: 'Criar',
  navigate: 'Ir para',
  search: 'Buscar',
  action: 'Ações',
  settings: 'Configurações',
}

export const CATEGORY_ORDER: CommandCategory[] = [
  'create',
  'navigate',
  'search',
  'action',
  'settings',
]
