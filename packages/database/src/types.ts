/**
 * Hand-maintained Supabase Database types for Organizations + Memberships.
 * Regenerate via `supabase gen types` when CLI is linked (see Migrations.md).
 */

export type OrganizationStatus = 'active' | 'suspended' | 'canceled'
export type MembershipStatus = 'active' | 'suspended' | 'removed'
export type MembershipRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'seller'
  | 'inventory'
  | 'finance'
  | 'viewer'

export type OrganizationRow = {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
  currency: string
  created_at: string
  updated_at: string
  created_by: string
  version: number
}

export type MembershipRow = {
  id: string
  organization_id: string
  user_id: string
  role: MembershipRole
  status: MembershipStatus
  is_owner: boolean
  created_at: string
  updated_at: string
  created_by: string
}

export type Database = {
  public: {
    Tables: {
      organization: {
        Row: OrganizationRow
        Insert: {
          id?: string
          name: string
          slug: string
          status?: OrganizationStatus
          currency?: string
          created_at?: string
          updated_at?: string
          created_by: string
          version?: number
        }
        Update: Partial<OrganizationRow>
        Relationships: []
      }
      membership: {
        Row: MembershipRow
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: MembershipRole
          status?: MembershipStatus
          is_owner?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: Partial<MembershipRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_organization: {
        Args: { p_name: string }
        Returns: OrganizationRow
      }
      is_org_member: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      is_org_owner: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
