import type { ReactNode } from 'react'
import type { PermissionKey } from '@rescript/permissions'
import { usePermission } from '#/platform/permissions/permission-context'
import { ForbiddenState } from '#/platform/errors/states'

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: {
  permission: PermissionKey
  children: ReactNode
  fallback?: ReactNode
}) {
  const { can, isLoading } = usePermission()
  if (isLoading) return null
  if (!can(permission)) return <>{fallback}</>
  return <>{children}</>
}

export function PermissionBoundary({
  permission,
  children,
  title = 'Sem permissão',
  description = 'Você não tem acesso a este recurso nesta organização.',
}: {
  permission: PermissionKey
  children: ReactNode
  title?: string
  description?: string
}) {
  const { can, isLoading } = usePermission()
  if (isLoading) return null
  if (!can(permission)) {
    return <ForbiddenState title={title} description={description} />
  }
  return <>{children}</>
}

export function FeatureGate({
  permission,
  children,
  fallback = null,
}: {
  permission: PermissionKey
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <PermissionGuard permission={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}
