import '#/modules/catalog/infrastructure/supabase/assert-server-only'
import type { CategoryRepository } from '#/modules/catalog/application/ports/repositories'
import type { Category } from '#/modules/catalog/domain/types'
import type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'
import { resolveNowIso } from '#/modules/catalog/infrastructure/supabase/client-options'
import { throwIfSupabaseError } from '#/modules/catalog/infrastructure/supabase/errors'
import {
  categoryToRow,
  mapCategory,
} from '#/modules/catalog/infrastructure/supabase/mappers'
import type { CategoryRow } from '#/modules/catalog/infrastructure/supabase/persistence-types'
import { assertEntityOrganization } from '#/modules/catalog/infrastructure/supabase/tenant-context'

export class SupabaseCategoryRepository implements CategoryRepository {
  constructor(private readonly options: CatalogSupabaseReposOptions) {}

  async getById(
    organizationId: string,
    categoryId: string,
  ): Promise<Category | null> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('category')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', categoryId)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapCategory(data as CategoryRow) : null
  }

  async listByOrganization(organizationId: string): Promise<Category[]> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('category')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .order('depth', { ascending: true })
      .order('name', { ascending: true })
    throwIfSupabaseError(error)
    return (data ?? []).map((row) => mapCategory(row as CategoryRow))
  }

  async save(category: Category): Promise<void> {
    assertEntityOrganization(
      category.organizationId,
      this.options.organizationId,
    )
    const orgId = this.options.organizationId
    const ctx = {
      actorUserId: this.options.actorUserId,
      nowIso: resolveNowIso(this.options),
    }

    const { data: existing, error: readError } = await this.options.client
      .from('category')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', category.id)
      .maybeSingle()
    throwIfSupabaseError(readError)

    const row = categoryToRow(
      category,
      ctx,
      (existing as CategoryRow | null) ?? null,
    )

    if (existing) {
      const { error } = await this.options.client
        .from('category')
        .update({
          parent_id: row.parent_id,
          name: row.name,
          normalized_name: row.normalized_name,
          depth: row.depth,
          status: row.status,
          archived_at: row.archived_at,
          archived_by: row.archived_by,
          updated_at: row.updated_at,
          updated_by: row.updated_by,
        })
        .eq('id', category.id)
        .eq('organization_id', orgId)
      throwIfSupabaseError(error)
      return
    }

    const { error } = await this.options.client.from('category').insert(row)
    throwIfSupabaseError(error)
  }

  private assertOrg(organizationId: string): void {
    assertEntityOrganization(organizationId, this.options.organizationId)
  }
}
