import { ReceivingPermissionError } from '#/modules/receiving/application/errors'

export function assertEntityOrganization(
  entityOrganizationId: string,
  trustedOrganizationId: string,
): void {
  if (entityOrganizationId !== trustedOrganizationId) {
    throw new ReceivingPermissionError('organization_mismatch')
  }
}
