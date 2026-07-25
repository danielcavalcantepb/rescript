import type { ReactNode } from 'react'
import { RescriptLogo } from '#/components/brand/RescriptLogo'
import { getIcon, type IconName } from '#/platform/icons/catalog'

export function PlatformEmptyState({
  icon,
  title,
  description,
  action,
  useBrandMark = true,
}: {
  icon?: IconName
  title: string
  description: string
  action?: ReactNode
  useBrandMark?: boolean
}) {
  const Icon = icon ? getIcon(icon) : null

  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center">
      {useBrandMark || !Icon ? (
        <RescriptLogo variant="mark" className="size-7 opacity-50" />
      ) : (
        <Icon className="size-7 text-[var(--color-muted)]" strokeWidth={1.5} />
      )}
      <h3 className="mt-3 text-sm font-medium text-[var(--color-ink)]">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] text-[var(--color-text-secondary)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
