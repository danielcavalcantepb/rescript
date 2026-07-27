import { CustomerPermissionError } from '#/modules/customers/application/errors'

export function assertEntityOrganization(
  entityOrganizationId: string,
  trustedOrganizationId: string,
): void {
  if (entityOrganizationId !== trustedOrganizationId) {
    throw new CustomerPermissionError('organization_mismatch')
  }
}
