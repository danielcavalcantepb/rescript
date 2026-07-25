import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { EntityAvatar } from '#/components/EntityAvatar'
import { useSession } from '#/providers/app-session'
import { icons } from '#/platform/icons/catalog'
import { ButtonLoading } from '#/platform/loading'

export function Topbar({
  onOpenCommand,
  onOpenMobileNav,
}: {
  onOpenCommand: () => void
  onOpenMobileNav: () => void
}) {
  const { authUser, logout } = useSession()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const Menu = icons.menu
  const Search = icons.search

  const label = authUser?.displayName ?? 'Usuário'
  const subtitle =
    authUser?.email && authUser.displayName !== authUser.email
      ? authUser.email
      : 'Conta'

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center gap-4 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]/95 px-4 backdrop-blur-sm md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="size-9 lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Abrir menu"
      >
        <Menu className="size-4" strokeWidth={1.5} />
      </Button>

      <button
        type="button"
        onClick={onOpenCommand}
        className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-canvas)] px-3.5 text-left text-sm text-[var(--color-text-secondary)] transition-colors duration-[var(--motion-fast)] hover:border-[var(--color-primary)]/40 focus-visible:border-[var(--color-primary)] md:max-w-xl"
      >
        <Search className="size-4 shrink-0" strokeWidth={1.5} />
        <span className="truncate">Buscar ou digitar um comando…</span>
        <kbd className="ml-auto hidden rounded border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-muted)] sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-[13px] leading-tight font-medium text-[var(--color-ink)]">
            {label}
          </p>
          <p className="text-[11px] text-[var(--color-muted)]">{subtitle}</p>
        </div>
        <EntityAvatar name={label} />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          disabled={signingOut}
          onClick={() => {
            if (signingOut) return
            setSigningOut(true)
            void logout()
              .then(() => navigate({ to: '/login' }))
              .finally(() => setSigningOut(false))
          }}
        >
          {signingOut ? <ButtonLoading label="Saindo…" /> : 'Sair'}
        </Button>
      </div>
    </header>
  )
}
