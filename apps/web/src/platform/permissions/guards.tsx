import type { ReactNode } from 'react'
import type { PermissionKey } from '@rescript/permissions'
import { usePermission } from '#/platform/permissions/permission-context'
import { ForbiddenState, PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'

/**
 * Soft gate for inline UI (e.g. buttons).
 * While loading: renders nothing (no Forbidden, no protected children).
 * After ready: children if allowed, otherwise fallback.
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: {
  permission: PermissionKey
  children: ReactNode
  fallback?: ReactNode
}) {
  const { can, status } = usePermission()
  if (status === 'loading') return null
  if (status === 'error' || !can(permission)) return <>{fallback}</>
  return <>{children}</>
}

/**
 * Hard gate for page sections.
 * loading → PageLoading | error → PageError | ready+denied → Forbidden | ready+allowed → children
 * Denial is `status === 'ready' && !can(permission)` — no separate "denied" status.
 */
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
  const { can, status, error } = usePermission()

  if (status === 'loading') {
    return <PageLoading label="Carregando permissões…" />
  }
  if (status === 'error') {
    return (
      <PageError error={error} onRetry={() => window.location.reload()} />
    )
  }
  // status === 'ready'
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
 * Page-level gate: same lifecycle as PermissionBoundary.
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
