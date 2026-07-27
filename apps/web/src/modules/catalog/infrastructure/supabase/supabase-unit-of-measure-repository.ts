import '#/modules/catalog/infrastructure/supabase/assert-server-only'
import type { UnitOfMeasureRepository } from '#/modules/catalog/application/ports/repositories'
import type { UnitOfMeasure } from '#/modules/catalog/domain/types'
import type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'
import { throwIfSupabaseError } from '#/modules/catalog/infrastructure/supabase/errors'
import type { Tables } from '@rescript/database'

type UnitRow = Tables<'unit_of_measure'>

function mapUnit(row: UnitRow): UnitOfMeasure {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    precision: row.precision,
    integerOnly: row.integer_only,
  }
}

export class SupabaseUnitOfMeasureRepository implements UnitOfMeasureRepository {
  constructor(private readonly options: CatalogSupabaseReposOptions) {}

  private assertOrg(organizationId: string) {
    if (organizationId !== this.options.organizationId) {
      throw new Error('organization_mismatch')
    }
  }

  async listAvailable(organizationId: string): Promise<UnitOfMeasure[]> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('unit_of_measure')
      .select('*')
      .eq('status', 'active')
      .or(
        `organization_id.is.null,organization_id.eq.${this.options.organizationId}`,
      )
      .order('code', { ascending: true })
    throwIfSupabaseError(error)
    return (data ?? []).map((row) => mapUnit(row as UnitRow))
  }

  async getById(
    organizationId: string,
    unitOfMeasureId: string,
  ): Promise<UnitOfMeasure | null> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('unit_of_measure')
      .select('*')
      .eq('id', unitOfMeasureId)
      .or(
        `organization_id.is.null,organization_id.eq.${this.options.organizationId}`,
      )
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapUnit(data as UnitRow) : null
  }
}
