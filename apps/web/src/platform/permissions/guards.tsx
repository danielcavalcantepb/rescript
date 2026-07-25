import type { ReactNode } from 'react'
import type { PermissionKey } from '@rescript/permissions'
import { usePermission } from '#/platform/permissions/permission-context'
import { ForbiddenState, PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'

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
  const { can, isLoading, status, error } = usePermission()
  if (isLoading || status === 'loading') {
    return <PageLoading label="Carregando permissões…" />
  }
  if (status === 'error') {
    return (
      <PageError
        error={error}
        onRetry={() => window.location.reload()}
      />
    )
  }
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

/**
 * Page-level gate: loading → error → forbidden → children.
 * Never shows Forbidden or protected content while grants are unresolved.
 */
export function RequirePermission({
  permission,
  children,
  forbiddenDescription,
}: {
  permission: PermissionKey
  children: ReactNode
  forbiddenDescription?: string
}) {
  return (
    <PermissionBoundary
      permission={permission}
      description={forbiddenDescription}
    >
      {children}
    </PermissionBoundary>
  )
}
