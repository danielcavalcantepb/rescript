import { useOrganization } from '#/platform/organization/organization-context'
import { icons } from '#/platform/icons/catalog'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/utils'
import { notificationService } from '#/platform/services'

export function OrganizationSwitcher({
  collapsed = false,
}: {
  collapsed?: boolean
}) {
  const {
    organizations,
    currentOrganization,
    switchOrganization,
    isLoading,
  } = useOrganization()
  const Building = icons.building
  const ChevronDown = icons.chevronDown
  const Check = icons.check

  const selectable = organizations.filter((o) => o.status === 'active')

  if (isLoading || !currentOrganization) {
    return (
      <div
        className={cn(
          'h-5 animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-border-soft)]',
          collapsed ? 'mx-auto w-8' : 'mt-8 w-full',
        )}
      />
    )
  }

  async function onSwitch(organizationId: string) {
    try {
      await switchOrganization(organizationId)
    } catch {
      notificationService.error(
        'Não foi possível trocar de organização',
        'Verifique se sua membership ainda está ativa.',
      )
    }
  }

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="mx-auto size-8 text-[var(--color-text-secondary)]"
            aria-label={currentOrganization.name}
          >
            <Building className="size-3.5" strokeWidth={1.5} />
          </Button>
        </DropdownMenuTrigger>
        <OrgMenu
          organizations={selectable}
          currentId={currentOrganization.id}
          onSwitch={onSwitch}
        />
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="mt-8 flex w-full items-center justify-between gap-1 truncate text-left text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-ink)]"
          aria-label="Trocar organização"
        >
          <span className="truncate">{currentOrganization.name}</span>
          <ChevronDown className="size-3 shrink-0 opacity-50" strokeWidth={1.5} />
        </button>
      </DropdownMenuTrigger>
      <OrgMenu
        organizations={selectable}
        currentId={currentOrganization.id}
        onSwitch={onSwitch}
        Check={Check}
      />
    </DropdownMenu>
  )
}

function OrgMenu({
  organizations,
  currentId,
  onSwitch,
  Check,
}: {
  organizations: { id: string; name: string; status: string }[]
  currentId: string
  onSwitch: (id: string) => Promise<void>
  Check?: typeof icons.check
}) {
  const CheckIcon = Check ?? icons.check
  return (
    <DropdownMenuContent align="start" className="w-56">
      <DropdownMenuLabel>Organizações</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {organizations.length === 0 ? (
        <DropdownMenuItem disabled>Nenhuma organização ativa</DropdownMenuItem>
      ) : (
        organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => void onSwitch(org.id)}
            className="gap-2"
          >
            <span className="flex-1 truncate">{org.name}</span>
            {org.id === currentId ? (
              <CheckIcon className="size-3.5 text-[var(--color-primary)]" />
            ) : null}
          </DropdownMenuItem>
        ))
      )}
    </DropdownMenuContent>
  )
}
