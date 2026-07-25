import type {
  MembershipRole,
  MembershipStatus,
  OrganizationStatus,
} from '@rescript/database'

export type Organization = {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
}

export type CurrentOrganization = Organization | null

export type Membership = {
  id: string
  organizationId: string
  userId: string
  role: MembershipRole
  status: MembershipStatus
  isOwner: boolean
}

export type CreateOrganizationResult = {
  organization: Organization
  membership: Membership
}

export interface OrganizationRepository {
  listForUser(userId: string): Promise<Organization[]>
  getCurrent(userId: string): Promise<CurrentOrganization>
  setCurrent(userId: string, organizationId: string): Promise<Organization>
  createOrganization(name: string): Promise<CreateOrganizationResult>
  listMemberships(userId: string): Promise<Membership[]>
}
