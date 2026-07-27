import '#/modules/catalog/infrastructure/supabase/assert-server-only'
import type { PriceListRepository } from '#/modules/catalog/application/ports/repositories'
import type { PriceList } from '#/modules/catalog/domain/types'
import type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'
import { resolveNowIso } from '#/modules/catalog/infrastructure/supabase/client-options'
import { throwIfSupabaseError } from '#/modules/catalog/infrastructure/supabase/errors'
import {
  mapPriceList,
  priceEntryToRow,
  priceListToRow,
} from '#/modules/catalog/infrastructure/supabase/mappers'
import type {
  PriceListEntryRow,
  PriceListRow,
} from '#/modules/catalog/infrastructure/supabase/persistence-types'
import { withCatalogTransaction } from '#/modules/catalog/infrastructure/supabase/sql.server'
import { assertEntityOrganization } from '#/modules/catalog/infrastructure/supabase/tenant-context'

export class SupabasePriceListRepository implements PriceListRepository {
  constructor(private readonly options: CatalogSupabaseReposOptions) {}

  async getById(
    organizationId: string,
    priceListId: string,
  ): Promise<PriceList | null> {
    this.assertOrg(organizationId)
    const { data: list, error } = await this.options.client
      .from('price_list')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', priceListId)
      .maybeSingle()
    throwIfSupabaseError(error)
    if (!list) return null
    return this.withEntries(list as PriceListRow)
  }

  async getDefault(organizationId: string): Promise<PriceList | null> {
    this.assertOrg(organizationId)
    const { data: list, error } = await this.options.client
      .from('price_list')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('is_default', true)
      .eq('status', 'active')
      .maybeSingle()
    throwIfSupabaseError(error)
    if (!list) return null
    return this.withEntries(list as PriceListRow)
  }

  async listByOrganization(organizationId: string): Promise<PriceList[]> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('price_list')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .order('name', { ascending: true })
    throwIfSupabaseError(error)

    const lists: PriceList[] = []
    for (const row of (data ?? []) as PriceListRow[]) {
      lists.push(await this.withEntries(row))
    }
    return lists
  }

  async save(priceList: PriceList): Promise<void> {
    assertEntityOrganization(
      priceList.organizationId,
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
        const existingList = await sql<PriceListRow[]>`
          select * from public.price_list
          where id = ${priceList.id}::uuid
            and organization_id = ${orgId}::uuid
        `
        const listRow = priceListToRow(
          priceList,
          ctx,
          existingList[0] ?? null,
        )

        await sql`
          insert into public.price_list ${sql(listRow)}
          on conflict (id) do update set
            name = excluded.name,
            description = excluded.description,
            currency = excluded.currency,
            is_default = excluded.is_default,
            priority = excluded.priority,
            status = excluded.status,
            archived_at = excluded.archived_at,
            archived_by = excluded.archived_by,
            updated_at = excluded.updated_at,
            updated_by = excluded.updated_by
          where public.price_list.organization_id = ${orgId}::uuid
        `

        const existingEntries = await sql<PriceListEntryRow[]>`
          select * from public.price_list_entry
          where price_list_id = ${priceList.id}::uuid
            and organization_id = ${orgId}::uuid
        `
        const existingById = new Map(existingEntries.map((e) => [e.id, e]))
        const keepIds = new Set(priceList.entries.map((e) => e.id))
        const removeIds = existingEntries
          .filter((e) => !keepIds.has(e.id))
          .map((e) => e.id)

        if (removeIds.length > 0) {
          await sql`
            update public.price_history
            set entry_id = null
            where organization_id = ${orgId}::uuid
              and entry_id = any(${removeIds}::uuid[])
          `
          await sql`
            delete from public.price_list_entry
            where organization_id = ${orgId}::uuid
              and id = any(${removeIds}::uuid[])
          `
        }

        for (const entry of priceList.entries) {
          const previous = existingById.get(entry.id) ?? null
          const entryRow = priceEntryToRow(entry, orgId, ctx, previous)
          await sql`
            insert into public.price_list_entry ${sql(entryRow)}
            on conflict (id) do update set
              amount = excluded.amount,
              currency = excluded.currency,
              valid_from = excluded.valid_from,
              valid_to = excluded.valid_to,
              updated_at = excluded.updated_at,
              updated_by = excluded.updated_by
            where public.price_list_entry.organization_id = ${orgId}::uuid
          `

          const amountChanged =
            !previous ||
            Number(previous.amount) !== Number(entry.amount.amount) ||
            previous.valid_from !== entry.validFrom

          if (amountChanged) {
            await sql`
              insert into public.price_history (
                organization_id, price_list_id, variant_id, entry_id,
                amount, currency, effective_at, recorded_at, recorded_by
              ) values (
                ${orgId}::uuid,
                ${priceList.id}::uuid,
                ${entry.variantId}::uuid,
                ${entry.id}::uuid,
                ${Number(entry.amount.amount)},
                ${entry.amount.currency},
                ${entry.validFrom}::timestamptz,
                ${ctx.nowIso}::timestamptz,
                ${ctx.actorUserId}::uuid
              )
            `
          }
        }
      },
    )
  }

  private async withEntries(list: PriceListRow): Promise<PriceList> {
    const { data: entries, error } = await this.options.client
      .from('price_list_entry')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('price_list_id', list.id)
      .order('valid_from', { ascending: true })
    throwIfSupabaseError(error)
    return mapPriceList({
      list,
      entries: (entries ?? []) as PriceListEntryRow[],
    })
  }

  private assertOrg(organizationId: string): void {
    assertEntityOrganization(organizationId, this.options.organizationId)
  }
}
