import type { PermissionKey } from '@rescript/permissions'

export interface PermissionRepository {
  listForMembership(
    organizationId: string,
    userId: string,
  ): Promise<readonly PermissionKey[]>
}
