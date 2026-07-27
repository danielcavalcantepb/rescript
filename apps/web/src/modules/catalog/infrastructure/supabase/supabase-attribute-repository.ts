import '#/modules/catalog/infrastructure/supabase/assert-server-only'
import type { AttributeDefinitionRepository } from '#/modules/catalog/application/ports/repositories'
import type { AttributeDefinition } from '#/modules/catalog/domain/types'
import type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'
import { resolveNowIso } from '#/modules/catalog/infrastructure/supabase/client-options'
import { throwIfSupabaseError } from '#/modules/catalog/infrastructure/supabase/errors'
import {
  attributeDefinitionToRow,
  attributeOptionToRow,
  mapAttributeDefinition,
} from '#/modules/catalog/infrastructure/supabase/mappers'
import type {
  AttributeDefinitionRow,
  AttributeOptionRow,
} from '#/modules/catalog/infrastructure/supabase/persistence-types'
import { withCatalogTransaction } from '#/modules/catalog/infrastructure/supabase/sql.server'
import { assertEntityOrganization } from '#/modules/catalog/infrastructure/supabase/tenant-context'

export class SupabaseAttributeRepository
  implements AttributeDefinitionRepository
{
  constructor(private readonly options: CatalogSupabaseReposOptions) {}

  async getById(
    organizationId: string,
    definitionId: string,
  ): Promise<AttributeDefinition | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)

    const { data: definition, error } = await this.options.client
      .from('attribute_definition')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', definitionId)
      .maybeSingle()
    throwIfSupabaseError(error)
    if (!definition) return null

    return this.loadDefinitionWithOptions(
      definition as AttributeDefinitionRow,
    )
  }

  async findByNormalizedName(
    organizationId: string,
    normalizedName: string,
  ): Promise<AttributeDefinition | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)

    const { data: definition, error } = await this.options.client
      .from('attribute_definition')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('normalized_name', normalizedName)
      .maybeSingle()
    throwIfSupabaseError(error)
    if (!definition) return null

    return this.loadDefinitionWithOptions(
      definition as AttributeDefinitionRow,
    )
  }

  private async loadDefinitionWithOptions(
    definition: AttributeDefinitionRow,
  ): Promise<AttributeDefinition> {
    const { data: options, error: optionsError } = await this.options.client
      .from('attribute_option')
      .select('*')
      .eq('definition_id', definition.id)
      .order('sort_order', { ascending: true })
    throwIfSupabaseError(optionsError)

    return mapAttributeDefinition({
      definition,
      options: (options ?? []) as AttributeOptionRow[],
    })
  }

  async save(definition: AttributeDefinition): Promise<void> {
    assertEntityOrganization(
      definition.organizationId,
      this.options.organizationId,
    )

    const ctx = {
      actorUserId: this.options.actorUserId,
      nowIso: resolveNowIso(this.options),
    }
    const orgId = this.options.organizationId

    await withCatalogTransaction(
      this.options.databaseUrl,
      orgId,
      this.options.actorUserId,
      async ({ sql }) => {
        const existingDef = await sql<AttributeDefinitionRow[]>`
          select * from public.attribute_definition
          where id = ${definition.id}::uuid
            and organization_id = ${orgId}::uuid
        `
        const defRow = attributeDefinitionToRow(
          definition,
          ctx,
          existingDef[0] ?? null,
        )

        await sql`
          insert into public.attribute_definition ${sql(defRow)}
          on conflict (id) do update set
            name = excluded.name,
            normalized_name = excluded.normalized_name,
            value_type = excluded.value_type,
            status = excluded.status,
            archived_at = excluded.archived_at,
            archived_by = excluded.archived_by,
            updated_at = excluded.updated_at,
            updated_by = excluded.updated_by
          where public.attribute_definition.organization_id = ${orgId}::uuid
        `

        const existingOptions = await sql<AttributeOptionRow[]>`
          select o.*
          from public.attribute_option o
          inner join public.attribute_definition d on d.id = o.definition_id
          where o.definition_id = ${definition.id}::uuid
            and d.organization_id = ${orgId}::uuid
        `
        const existingById = new Map(existingOptions.map((o) => [o.id, o]))
        const keepIds = new Set(definition.options.map((o) => o.id))

        const removeIds = existingOptions
          .filter((o) => !keepIds.has(o.id))
          .map((o) => o.id)
        if (removeIds.length > 0) {
          await sql`
            delete from public.attribute_option o
            using public.attribute_definition d
            where o.definition_id = d.id
              and d.organization_id = ${orgId}::uuid
              and o.id = any(${removeIds}::uuid[])
          `
        }

        for (const option of definition.options) {
          const optionRow = attributeOptionToRow(
            option,
            ctx,
            existingById.get(option.id) ?? null,
          )
          await sql`
            insert into public.attribute_option ${sql(optionRow)}
            on conflict (id) do update set
              label = excluded.label,
              normalized_label = excluded.normalized_label,
              sort_order = excluded.sort_order,
              status = excluded.status,
              archived_at = excluded.archived_at,
              archived_by = excluded.archived_by,
              updated_at = excluded.updated_at,
              updated_by = excluded.updated_by
            where exists (
              select 1 from public.attribute_definition d
              where d.id = excluded.definition_id
                and d.organization_id = ${orgId}::uuid
            )
          `
        }
      },
    )
  }
}
