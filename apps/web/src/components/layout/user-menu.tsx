import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { EntityAvatar } from '#/components/EntityAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { useSession } from '#/providers/app-session'
import {
  MEMBERSHIP_ROLE_LABELS,
  useOrganization,
} from '#/platform/organization'
import { icons } from '#/platform/icons/catalog'
import { ButtonLoading } from '#/platform/loading'
import { cn } from '#/lib/utils'

/**
 * Profile menu — Linear / Vercel inspired.
 * Name is primary; email is secondary; role shown when membership exists.
 */
export function UserMenu() {
  const { authUser, logout } = useSession()
  const { currentMembership, currentOrganization } = useOrganization()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const LogOut = icons.logOut
  const ChevronDown = icons.chevronDown

  const name = authUser?.displayName?.trim() || 'Usuário'
  const email = authUser?.email?.trim() || null
  const roleLabel = currentMembership
    ? MEMBERSHIP_ROLE_LABELS[currentMembership.role]
    : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'group flex items-center gap-2.5 rounded-[var(--radius-md)] py-1 pr-1.5 pl-1 text-left',
            'transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)]',
            'hover:bg-[var(--color-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]',
          )}
          aria-label={`Conta de ${name}`}
        >
          <EntityAvatar name={name} className="size-8" />
          <span className="hidden min-w-0 flex-col sm:flex">
            <span className="max-w-[140px] truncate text-[13px] leading-tight font-medium text-[var(--color-ink)]">
              {name}
            </span>
            <span className="max-w-[140px] truncate text-[11px] leading-tight text-[var(--color-muted)]">
              {roleLabel ?? currentOrganization?.name ?? 'Conta'}
            </span>
          </span>
          <ChevronDown
            className="hidden size-3.5 text-[var(--color-muted)] opacity-70 transition-transform duration-[var(--motion-fast)] group-data-[state=open]:rotate-180 sm:block"
            strokeWidth={1.5}
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-1.5">
        <div className="flex items-start gap-3 px-2 py-2.5">
          <EntityAvatar name={name} className="size-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[var(--color-ink)]">
              {name}
            </p>
            {roleLabel ? (
              <p className="mt-0.5 truncate text-[12px] text-[var(--color-text-secondary)]">
                {roleLabel}
                {currentOrganization?.name
                  ? ` · ${currentOrganization.name}`
                  : ''}
              </p>
            ) : currentOrganization?.name ? (
              <p className="mt-0.5 truncate text-[12px] text-[var(--color-text-secondary)]">
                {currentOrganization.name}
              </p>
            ) : null}
            {email ? (
              <p className="mt-1 truncate text-[11px] text-[var(--color-muted)]">
                {email}
              </p>
            ) : null}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={signingOut}
          className="gap-2 text-[var(--color-danger)] focus:bg-[var(--color-danger-bg)] focus:text-[var(--color-danger)]"
          onSelect={() => {
            if (signingOut) return
            setSigningOut(true)
            void logout()
              .then(() => navigate({ to: '/login' }))
              .finally(() => setSigningOut(false))
          }}
        >
          {signingOut ? (
            <ButtonLoading label="Saindo…" />
          ) : (
            <>
              <LogOut className="size-3.5" strokeWidth={1.5} />
              Sair
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
