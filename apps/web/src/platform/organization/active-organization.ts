import { storageService } from '#/platform/services/storage'

/**
 * Active organization preference (client hint only).
 * Never authorizes alone — always validate against active memberships.
 *
 * Decision: localStorage for this phase (simplest). Not a cookie/JWT claim.
 * See docs/development/OrganizationsSetup.md
 */
export const ACTIVE_ORG_STORAGE_KEY = 'rescript.activeOrganizationId'

export function readActiveOrganizationId(): string | null {
  return storageService.get(ACTIVE_ORG_STORAGE_KEY)
}

export function writeActiveOrganizationId(organizationId: string) {
  storageService.set(ACTIVE_ORG_STORAGE_KEY, organizationId)
}

export function clearActiveOrganizationId() {
  storageService.remove(ACTIVE_ORG_STORAGE_KEY)
}
