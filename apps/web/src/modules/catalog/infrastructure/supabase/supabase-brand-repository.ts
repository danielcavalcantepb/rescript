import '#/modules/catalog/infrastructure/supabase/assert-server-only'
import type { BrandRepository } from '#/modules/catalog/application/ports/repositories'
import type { Brand } from '#/modules/catalog/domain/types'
import type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'
import { resolveNowIso } from '#/modules/catalog/infrastructure/supabase/client-options'
import { throwIfSupabaseError } from '#/modules/catalog/infrastructure/supabase/errors'
import {
  brandToRow,
  mapBrand,
} from '#/modules/catalog/infrastructure/supabase/mappers'
import type { BrandRow } from '#/modules/catalog/infrastructure/supabase/persistence-types'
import { assertEntityOrganization } from '#/modules/catalog/infrastructure/supabase/tenant-context'

export class SupabaseBrandRepository implements BrandRepository {
  constructor(private readonly options: CatalogSupabaseReposOptions) {}

  async getById(organizationId: string, brandId: string): Promise<Brand | null> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('brand')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', brandId)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapBrand(data as BrandRow) : null
  }

  async listByOrganization(organizationId: string): Promise<Brand[]> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('brand')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .order('name', { ascending: true })
    throwIfSupabaseError(error)
    return (data ?? []).map((row) => mapBrand(row as BrandRow))
  }

  async findByNormalizedName(
    organizationId: string,
    normalizedName: string,
  ): Promise<Brand | null> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('brand')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('normalized_name', normalizedName)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapBrand(data as BrandRow) : null
  }

  async save(brand: Brand): Promise<void> {
    assertEntityOrganization(brand.organizationId, this.options.organizationId)
    const orgId = this.options.organizationId
    const ctx = {
      actorUserId: this.options.actorUserId,
      nowIso: resolveNowIso(this.options),
    }

    const { data: existing, error: readError } = await this.options.client
      .from('brand')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', brand.id)
      .maybeSingle()
    throwIfSupabaseError(readError)

    const row = brandToRow(brand, ctx, (existing as BrandRow | null) ?? null)

    if (existing) {
      const { error } = await this.options.client
        .from('brand')
        .update({
          name: row.name,
          normalized_name: row.normalized_name,
          slug: row.slug,
          description: row.description,
          sort_order: row.sort_order,
          status: row.status,
          archived_at: row.archived_at,
          archived_by: row.archived_by,
          updated_at: row.updated_at,
          updated_by: row.updated_by,
        })
        .eq('id', brand.id)
        .eq('organization_id', orgId)
      throwIfSupabaseError(error)
      return
    }

    const { error } = await this.options.client.from('brand').insert({
      ...row,
      slug: row.slug!,
      description: row.description ?? null,
      sort_order: row.sort_order ?? 0,
    })
    throwIfSupabaseError(error)
  }

  private assertOrg(organizationId: string): void {
    assertEntityOrganization(organizationId, this.options.organizationId)
  }
}
