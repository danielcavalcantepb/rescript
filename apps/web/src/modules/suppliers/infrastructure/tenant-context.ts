import { SupplierPermissionError } from '#/modules/suppliers/application/errors'

export function assertEntityOrganization(
  entityOrganizationId: string,
  trustedOrganizationId: string,
): void {
  if (entityOrganizationId !== trustedOrganizationId) {
    throw new SupplierPermissionError('organization_mismatch')
  }
}
