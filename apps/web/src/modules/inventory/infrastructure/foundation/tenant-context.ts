import { InventoryFoundationPermissionError } from '#/modules/inventory/application/foundation/errors'
import type { InventoryFoundationReposOptions } from '#/modules/inventory/infrastructure/foundation/client-options'

export async function assertInventoryTenantAccess(
  options: InventoryFoundationReposOptions,
): Promise<void> {
  const { data: auth, error: authError } = await options.client.auth.getUser()
  if (authError || !auth.user?.id) {
    throw new InventoryFoundationPermissionError('not_authenticated')
  }
  if (auth.user.id !== options.actorUserId) {
    throw new InventoryFoundationPermissionError('actor_mismatch')
  }

  const { data: membership, error: membershipError } = await options.client
    .from('membership')
    .select('id')
    .eq('organization_id', options.organizationId)
    .eq('user_id', options.actorUserId)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membership) {
    throw new InventoryFoundationPermissionError('not_org_member')
  }
}

export function assertEntityOrganization(
  entityOrganizationId: string,
  trustedOrganizationId: string,
): void {
  if (entityOrganizationId !== trustedOrganizationId) {
    throw new InventoryFoundationPermissionError('organization_mismatch')
  }
}
