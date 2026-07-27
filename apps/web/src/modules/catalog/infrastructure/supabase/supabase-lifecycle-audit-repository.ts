import '#/modules/catalog/infrastructure/supabase/assert-server-only'
import type {
  CatalogLifecycleAuditAppendInput,
  CatalogLifecycleAuditPort,
  CatalogLifecycleAuditRecord,
  CatalogLifecycleAction,
} from '#/modules/catalog/application/ports/lifecycle-audit'
import type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'
import { getCatalogSql } from '#/modules/catalog/infrastructure/supabase/sql.server'

type LifecycleEventRow = {
  id: string
  organization_id: string
  product_id: string
  from_status: string
  to_status: string
  action: string
  reason: string | null
  actor_user_id: string
  occurred_at: string
}

function mapRow(row: LifecycleEventRow): CatalogLifecycleAuditRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    productId: row.product_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    action: row.action as CatalogLifecycleAction,
    reason: row.reason,
    actorUserId: row.actor_user_id,
    occurredAt: row.occurred_at,
  }
}

/**
 * Lifecycle audit via privileged SQL (same path as product aggregate writes).
 * Tenant + actor are pinned by factory verification — never from untrusted input alone.
 */
export class SupabaseLifecycleAuditRepository
  implements CatalogLifecycleAuditPort
{
  constructor(private readonly options: CatalogSupabaseReposOptions) {}

  private assertOrg(organizationId: string) {
    if (organizationId !== this.options.organizationId) {
      throw new Error('organization_mismatch')
    }
  }

  async append(input: CatalogLifecycleAuditAppendInput): Promise<void> {
    this.assertOrg(input.organizationId)
    if (input.actorUserId !== this.options.actorUserId) {
      throw new Error('actor_mismatch')
    }
    const sql = getCatalogSql(this.options.databaseUrl)
    await sql`
      insert into public.catalog_product_lifecycle_event (
        organization_id,
        product_id,
        from_status,
        to_status,
        action,
        reason,
        actor_user_id,
        occurred_at
      ) values (
        ${this.options.organizationId}::uuid,
        ${input.productId}::uuid,
        ${input.fromStatus},
        ${input.toStatus},
        ${input.action},
        ${input.reason},
        ${this.options.actorUserId}::uuid,
        ${input.occurredAt}::timestamptz
      )
    `
  }

  async listByProduct(
    organizationId: string,
    productId: string,
  ): Promise<CatalogLifecycleAuditRecord[]> {
    this.assertOrg(organizationId)
    const sql = getCatalogSql(this.options.databaseUrl)
    const rows = await sql<LifecycleEventRow[]>`
      select
        id::text,
        organization_id::text,
        product_id::text,
        from_status,
        to_status,
        action,
        reason,
        actor_user_id::text,
        occurred_at::text
      from public.catalog_product_lifecycle_event
      where organization_id = ${this.options.organizationId}::uuid
        and product_id = ${productId}::uuid
      order by occurred_at desc
    `
    return rows.map(mapRow)
  }
}
