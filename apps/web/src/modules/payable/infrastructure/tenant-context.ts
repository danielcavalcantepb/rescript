import { PayablePermissionError } from '#/modules/payable/application/errors'

export function assertEntityOrganization(
  entityOrganizationId: string,
  trustedOrganizationId: string,
): void {
  if (entityOrganizationId !== trustedOrganizationId) {
    throw new PayablePermissionError('organization_mismatch')
  }
}
