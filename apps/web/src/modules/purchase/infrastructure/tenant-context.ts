import { PurchasePermissionError } from '#/modules/purchase/application/errors'

export function assertEntityOrganization(
  entityOrganizationId: string,
  trustedOrganizationId: string,
): void {
  if (entityOrganizationId !== trustedOrganizationId) {
    throw new PurchasePermissionError('organization_mismatch')
  }
}
