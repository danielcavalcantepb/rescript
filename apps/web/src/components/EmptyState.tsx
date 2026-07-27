import type { ReactNode } from 'react'
import {
  PlatformEmptyState,
} from '#/platform/empty/empty-state'
import type { IconName } from '#/platform/icons/catalog'

/** Thin wrapper — modules pass icon name from the catalog. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  /** When an icon is provided, prefer it. Brand mark only for brand/marketing empties. */
  useBrandMark,
}: {
  icon?: IconName
  title: string
  description: string
  action?: ReactNode
  useBrandMark?: boolean
}) {
  const showBrand = useBrandMark ?? !icon

  return (
    <PlatformEmptyState
      icon={icon}
      title={title}
      description={description}
      action={action}
      useBrandMark={showBrand}
    />
  )
}
