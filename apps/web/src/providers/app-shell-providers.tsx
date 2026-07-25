import type { ReactNode } from 'react'
import { OrganizationProvider } from '#/platform/organization/organization-context'
import { PermissionProvider } from '#/platform/permissions/permission-context'
import { CommandBootstrap } from '#/platform/commands/command-bootstrap'
import { ToastViewport } from '#/platform/toast'
import { DialogHost } from '#/platform/dialogs'
import { GlobalErrorBoundary } from '#/platform/errors'

/**
 * Permanent App Shell providers.
 * Business modules must not own session, org, permissions, toast, or dialogs.
 */
export function AppShellProviders({ children }: { children: ReactNode }) {
  return (
    <GlobalErrorBoundary
      onRecover={() => {
        window.location.href = '/'
      }}
    >
      <OrganizationProvider>
        <PermissionProvider>
          <CommandBootstrap>
            {children}
            <ToastViewport />
            <DialogHost />
          </CommandBootstrap>
        </PermissionProvider>
      </OrganizationProvider>
    </GlobalErrorBoundary>
  )
}
