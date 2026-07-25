import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  MembershipRow,
  OrganizationRow,
} from '@rescript/database'
import type {
  CreateOrganizationResult,
  CurrentOrganization,
  Membership,
  Organization,
  OrganizationRepository,
} from '#/platform/organization/types'
import {
  clearActiveOrganizationId,
  readActiveOrganizationId,
  writeActiveOrganizationId,
} from '#/platform/organization/active-organization'
import { createBrowserSupabaseClient } from '#/lib/supabase/client'

function mapOrg(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
  }
}

function mapMembership(row: MembershipRow): Membership {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    isOwner: row.is_owner,
  }
}

export class SupabaseOrganizationRepository implements OrganizationRepository {
  constructor(
    private readonly client: SupabaseClient<Database> = createBrowserSupabaseClient(),
  ) {}

  async listMemberships(userId: string): Promise<Membership[]> {
    const { data, error } = await this.client
      .from('membership')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error) throw error
    return (data ?? []).map(mapMembership)
  }

  async listForUser(userId: string): Promise<Organization[]> {
    const memberships = await this.listMemberships(userId)
    if (!memberships.length) return []

    const ids = memberships.map((m) => m.organizationId)
    const { data, error } = await this.client
      .from('organization')
      .select('*')
      .in('id', ids)

    if (error) throw error

    const byId = new Map((data ?? []).map((row) => [row.id, mapOrg(row)]))
    // Preserve membership order; exclude suspended/canceled from switcher list for selection
    return memberships
      .map((m) => byId.get(m.organizationId))
      .filter((o): o is Organization => Boolean(o))
  }

  async getCurrent(userId: string): Promise<CurrentOrganization> {
    const orgs = await this.listForUser(userId)
    const operable = orgs.filter((o) => o.status === 'active')
    if (!operable.length) {
      clearActiveOrganizationId()
      return null
    }

    const preferred = readActiveOrganizationId()
    const match = operable.find((o) => o.id === preferred)
    if (match) return match

    const fallback = operable[0]!
    writeActiveOrganizationId(fallback.id)
    return fallback
  }

  async setCurrent(
    userId: string,
    organizationId: string,
  ): Promise<Organization> {
    const orgs = await this.listForUser(userId)
    const org = orgs.find((o) => o.id === organizationId)
    if (!org) {
      throw new Error('organization_not_accessible')
    }
    if (org.status !== 'active') {
      throw new Error('organization_not_operable')
    }
    writeActiveOrganizationId(org.id)
    return org
  }

  async createOrganization(name: string): Promise<CreateOrganizationResult> {
    const { data, error } = await this.client.rpc('create_organization', {
      p_name: name,
    })

    if (error) throw error
    if (!data) throw new Error('create_organization_failed')

    // rpc may return object or array depending on PostgREST typing
    const row = (Array.isArray(data) ? data[0] : data) as OrganizationRow
    const organization = mapOrg(row)
    writeActiveOrganizationId(organization.id)

    const { data: membershipRows, error: membershipError } = await this.client
      .from('membership')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('status', 'active')
      .eq('is_owner', true)
      .limit(1)

    if (membershipError) throw membershipError
    const membershipRow = membershipRows?.[0]
    if (!membershipRow) throw new Error('owner_membership_missing')

    return {
      organization,
      membership: mapMembership(membershipRow),
    }
  }
}

export const supabaseOrganizationRepository =
  new SupabaseOrganizationRepository()
