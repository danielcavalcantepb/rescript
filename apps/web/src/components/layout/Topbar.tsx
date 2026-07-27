import { Button } from '#/components/ui/button'
import { ThemeSwitcher } from '#/platform/theme'
import { UserMenu } from '#/components/layout/user-menu'
import { icons } from '#/platform/icons/catalog'
import { cn } from '#/lib/utils'

export function Topbar({
  onOpenCommand,
  onOpenMobileNav,
}: {
  onOpenCommand: () => void
  onOpenMobileNav: () => void
}) {
  const Menu = icons.menu
  const Search = icons.search

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center gap-3 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]/90 px-3 backdrop-blur-md md:gap-4 md:px-5">
      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Abrir menu"
      >
        <Menu className="size-4" strokeWidth={1.5} />
      </Button>

      <button
        type="button"
        onClick={onOpenCommand}
        className={cn(
          'group flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-canvas)] px-3 text-left text-[13px] text-[var(--color-text-secondary)]',
          'shadow-[var(--shadow-sm)] transition-all duration-[var(--motion-fast)] ease-[var(--ease-out)]',
          'hover:border-[var(--color-primary)]/35 hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-ink)]',
          'focus-visible:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]',
          'md:max-w-md lg:max-w-lg',
        )}
      >
        <Search
          className="size-3.5 shrink-0 text-[var(--color-muted)] transition-colors group-hover:text-[var(--color-primary)]"
          strokeWidth={1.5}
        />
        <span className="truncate">Buscar ou digitar um comando…</span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded-[var(--radius-sm)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-muted)] sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <ThemeSwitcher />
        <div
          className="mx-0.5 hidden h-5 w-px bg-[var(--color-border)] sm:block"
          aria-hidden
        />
        <UserMenu />
      </div>
    </header>
  )
}
