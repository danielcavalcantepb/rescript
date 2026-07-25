import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Command } from 'cmdk'
import { RescriptLogo } from '#/components/brand/RescriptLogo'
import { cn } from '#/lib/utils'
import { getIcon } from '#/platform/icons/catalog'
import {
  commandRegistry,
  rankCommand,
} from '#/platform/commands/registry'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type AppCommand,
  type CommandCategory,
} from '#/platform/commands/types'
import { usePermission } from '#/platform/permissions/permission-context'

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const { can } = usePermission()
  const [query, setQuery] = useState('')
  const [registryVersion, setRegistryVersion] = useState(0)

  useEffect(() => {
    return commandRegistry.subscribe(() => setRegistryVersion((n) => n + 1))
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onOpenChange, open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const grouped = useMemo(() => {
    const all = commandRegistry.getAll().filter((cmd) => {
      if (cmd.permission && !can(cmd.permission)) return false
      return rankCommand(cmd, query) >= 0
    })

    all.sort((a, b) => rankCommand(b, query) - rankCommand(a, query))

    const map = new Map<CommandCategory, AppCommand[]>()
    for (const cat of CATEGORY_ORDER) map.set(cat, [])
    for (const cmd of all) {
      map.get(cmd.category)?.push(cmd)
    }
    return map
  }, [can, query, registryVersion])

  const run = (cmd: AppCommand) => {
    const close = () => {
      onOpenChange(false)
      setQuery('')
    }
    void cmd.run({
      navigate: (href) => {
        close()
        void navigate({ href })
      },
      close,
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[var(--z-command)]">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-overlay)]"
        aria-label="Fechar busca"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative mx-auto mt-[12vh] w-[min(92vw,560px)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] shadow-[var(--shadow-overlay)]">
        <div className="flex items-center gap-2 border-b border-[var(--color-border-soft)] px-3 py-2">
          <RescriptLogo variant="palette" />
          <span className="text-[11px] text-[var(--color-muted)]">Rescript</span>
        </div>
        <Command label="Command palette" shouldFilter={false}>
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar ou digitar um comando…"
            className="w-full border-b border-[var(--color-border-soft)] px-4 py-3 text-sm outline-none"
          />
          <Command.List className="max-h-80 overflow-auto p-2">
            <Command.Empty className="px-3 py-6 text-sm text-[var(--color-text-secondary)]">
              Nada encontrado para “{query}”.
            </Command.Empty>

            {CATEGORY_ORDER.map((category) => {
              const items = grouped.get(category) ?? []
              if (!items.length) return null
              return (
                <Command.Group
                  key={category}
                  heading={CATEGORY_LABELS[category]}
                  className={groupClass}
                >
                  {items.map((cmd) => (
                    <CommandItem
                      key={cmd.id}
                      command={cmd}
                      onSelect={() => run(cmd)}
                    />
                  ))}
                </Command.Group>
              )
            })}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}

const groupClass =
  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--color-muted)]'

function CommandItem({
  command,
  onSelect,
}: {
  command: AppCommand
  onSelect: () => void
}) {
  const Icon = command.icon ? getIcon(command.icon) : getIcon('search')
  return (
    <Command.Item
      value={command.label}
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-sm text-[var(--color-ink)]',
        'aria-selected:bg-[var(--color-primary-soft)]',
      )}
    >
      <Icon className="size-4 text-[var(--color-muted)]" strokeWidth={1.5} />
      <span className="flex-1 truncate">{command.label}</span>
      {command.shortcut ? (
        <kbd className="text-[10px] text-[var(--color-muted)]">
          {command.shortcut}
        </kbd>
      ) : null}
    </Command.Item>
  )
}
