import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isRolePreset,
  permissionsForRole,
  type PermissionKey,
} from '@rescript/permissions'
import type { Database } from '@rescript/database'
import type { PermissionRepository } from '#/platform/permissions/types'
import { createBrowserSupabaseClient } from '#/lib/supabase/client'

export class SupabasePermissionRepository implements PermissionRepository {
  constructor(
    private readonly client: SupabaseClient<Database> = createBrowserSupabaseClient(),
  ) {}

  async listForMembership(
    organizationId: string,
    userId: string,
  ): Promise<readonly PermissionKey[]> {
    const { data, error } = await this.client
      .from('membership')
      .select('role, status')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) throw error
    if (!data || data.status !== 'active') return []
    if (!isRolePreset(data.role)) return []
    return permissionsForRole(data.role)
  }
}

export const supabasePermissionRepository = new SupabasePermissionRepository()
