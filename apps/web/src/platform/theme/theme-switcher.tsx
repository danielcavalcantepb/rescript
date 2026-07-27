import { Button } from '#/components/ui/button'
import { icons } from '#/platform/icons/catalog'
import { useTheme } from '#/platform/theme/theme-provider'
import { cn } from '#/lib/utils'

export function ThemeSwitcher({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme()
  const Sun = icons.sun
  const Moon = icons.moon
  const isDark = resolved === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'size-9 text-[var(--color-text-secondary)] transition-transform duration-[var(--motion-base)] ease-[var(--ease-out)] hover:text-[var(--color-ink)] active:scale-95',
        className,
      )}
      onClick={toggle}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      {isDark ? (
        <Sun className="size-4 transition-opacity duration-[var(--motion-fast)]" strokeWidth={1.5} />
      ) : (
        <Moon className="size-4 transition-opacity duration-[var(--motion-fast)]" strokeWidth={1.5} />
      )}
    </Button>
  )
}
