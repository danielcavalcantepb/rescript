// @vitest-environment node
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@rescript/database'
import {
  closeCatalogSqlPools,
  createSupabaseCatalogRepos,
  getCatalogSql,
  type CatalogSupabaseReposOptions,
  type SupabaseCatalogRepos,
} from '#/modules/catalog/infrastructure/supabase/index.server'

/** Standard local Supabase demo keys (supabase start). Never log values. */
export const LOCAL_SUPABASE = {
  url: process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321',
  anonKey:
    process.env.SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  serviceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  databaseUrl:
    process.env.SUPABASE_DB_URL ??
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
}

const TEST_PASSWORD = 'catalog-test-password-123'

let localAvailable: boolean | null = null

export async function isLocalSupabaseAvailable(): Promise<boolean> {
  if (localAvailable != null) return localAvailable
  try {
    const rest = await fetch(`${LOCAL_SUPABASE.url}/rest/v1/`, {
      headers: {
        apikey: LOCAL_SUPABASE.anonKey,
        Authorization: `Bearer ${LOCAL_SUPABASE.anonKey}`,
      },
    })
    const auth = await fetch(`${LOCAL_SUPABASE.url}/auth/v1/settings`, {
      headers: { apikey: LOCAL_SUPABASE.anonKey },
    })
    localAvailable =
      (rest.ok || rest.status === 200 || rest.status === 401) && auth.ok
  } catch {
    localAvailable = false
  }
  return localAvailable
}

async function waitForAuthReady(attempts = 20): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      const auth = await fetch(`${LOCAL_SUPABASE.url}/auth/v1/settings`, {
        headers: { apikey: LOCAL_SUPABASE.anonKey },
      })
      if (auth.ok) return
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('local_supabase_auth_not_ready')
}

async function withAuthRetry<T>(run: () => Promise<T>, attempts = 8): Promise<T> {
  let last: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await run()
    } catch (error) {
      last = error
      await new Promise((r) => setTimeout(r, 750 * (i + 1)))
    }
  }
  throw last
}

export function createServiceRoleClient(): SupabaseClient<Database> {
  return createClient<Database>(
    LOCAL_SUPABASE.url,
    LOCAL_SUPABASE.serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export function createAnonClient(): SupabaseClient<Database> {
  return createClient<Database>(LOCAL_SUPABASE.url, LOCAL_SUPABASE.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export type CatalogPersistenceFixture = {
  client: SupabaseClient<Database>
  organizationId: string
  userId: string
  unitOfMeasureId: string
  repos: SupabaseCatalogRepos
  options: CatalogSupabaseReposOptions
  email: string
  cleanup: () => Promise<void>
}

async function seedOrgMembership(
  userId: string,
  organizationId: string,
  label: string,
): Promise<void> {
  const sql = getCatalogSql(LOCAL_SUPABASE.databaseUrl)
  const slug = `cat-${organizationId.replace(/-/g, '').slice(0, 12)}`
  await sql`
    insert into public.organization (
      id, name, slug, status, currency, created_by, version
    ) values (
      ${organizationId}::uuid,
      ${`Catalog Test ${label}`},
      ${slug},
      'active',
      'BRL',
      ${userId}::uuid,
      1
    )
  `
  await sql`
    insert into public.membership (
      organization_id, user_id, role, status, is_owner, created_by
    ) values (
      ${organizationId}::uuid,
      ${userId}::uuid,
      'owner',
      'active',
      true,
      ${userId}::uuid
    )
  `
}

export async function createCatalogPersistenceFixture(
  label = 'catalog',
): Promise<CatalogPersistenceFixture> {
  await waitForAuthReady()
  const admin = createServiceRoleClient()
  const email = `${label}-${crypto.randomUUID()}@example.com`
  const created = await withAuthRetry(async () => {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (error || !data.user) throw error ?? new Error('failed_to_create_test_user')
    return data
  })
  const userId = created.user!.id
  const organizationId = crypto.randomUUID()
  await seedOrgMembership(userId, organizationId, label)

  const sql = getCatalogSql(LOCAL_SUPABASE.databaseUrl)
  const uomRows = await sql<{ id: string }[]>`
    select id from public.unit_of_measure
    where organization_id is null and code = 'un'
    limit 1
  `
  const unitOfMeasureId = uomRows[0]?.id
  if (!unitOfMeasureId) throw new Error('platform_uom_un_missing')

  const client = createAnonClient()
  const session = await withAuthRetry(async () => {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: TEST_PASSWORD,
    })
    if (error || !data.session) {
      throw error ?? new Error('failed_to_sign_in_test_user')
    }
    return data
  })
  if (!session.session) throw new Error('failed_to_sign_in_test_user')

  const options: CatalogSupabaseReposOptions = {
    client,
    actorUserId: userId,
    organizationId,
    databaseUrl: LOCAL_SUPABASE.databaseUrl,
    nowIso: () => new Date().toISOString(),
  }
  const repos = await createSupabaseCatalogRepos(options)

  return {
    client,
    organizationId,
    userId,
    unitOfMeasureId,
    repos,
    options,
    email,
    cleanup: async () => {
      await wipeOrganization(organizationId)
      await admin.auth.admin.deleteUser(userId)
    },
  }
}

export async function wipeOrganization(organizationId: string): Promise<void> {
  const sql = getCatalogSql(LOCAL_SUPABASE.databaseUrl)
  await sql.begin(async (tx) => {
    // Session-local bypass for append-only cleanup (never set by app RPCs).
    await tx`select set_config('inventory.allow_ledger_admin', 'on', true)`
    await tx`select set_config('customer.allow_history_admin', 'on', true)`
    await tx`select set_config('supplier.allow_history_admin', 'on', true)`
    await tx`select set_config('purchase.allow_history_admin', 'on', true)`
    await tx`select set_config('receiving.allow_history_admin', 'on', true)`
    await tx`delete from public.catalog_product_lifecycle_event where organization_id = ${organizationId}::uuid`
    await tx`delete from public.customer_history where organization_id = ${organizationId}::uuid`
    await tx`delete from public.customer_contact where organization_id = ${organizationId}::uuid`
    await tx`delete from public.customer_address where organization_id = ${organizationId}::uuid`
    await tx`delete from public.customer_search where organization_id = ${organizationId}::uuid`
    await tx`delete from public.customer where organization_id = ${organizationId}::uuid`
    await tx`delete from public.goods_receipt_history where organization_id = ${organizationId}::uuid`
    await tx`delete from public.goods_receipt_item where organization_id = ${organizationId}::uuid`
    await tx`delete from public.goods_receipt_search where organization_id = ${organizationId}::uuid`
    await tx`delete from public.goods_receipt where organization_id = ${organizationId}::uuid`
    await tx`delete from public.goods_receipt_number_counter where organization_id = ${organizationId}::uuid`
    await tx`delete from public.purchase_history where organization_id = ${organizationId}::uuid`
    await tx`delete from public.purchase_item where organization_id = ${organizationId}::uuid`
    await tx`delete from public.purchase_search where organization_id = ${organizationId}::uuid`
    await tx`delete from public.purchase_order where organization_id = ${organizationId}::uuid`
    await tx`delete from public.purchase_number_counter where organization_id = ${organizationId}::uuid`
    await tx`delete from public.supplier_history where organization_id = ${organizationId}::uuid`
    await tx`delete from public.supplier_contact where organization_id = ${organizationId}::uuid`
    await tx`delete from public.supplier_address where organization_id = ${organizationId}::uuid`
    await tx`delete from public.supplier_search where organization_id = ${organizationId}::uuid`
    await tx`delete from public.supplier where organization_id = ${organizationId}::uuid`
    await tx`delete from public.inventory_ledger_movement where organization_id = ${organizationId}::uuid`
    await tx`delete from public.inventory_item_history where organization_id = ${organizationId}::uuid`
    await tx`delete from public.inventory_item where organization_id = ${organizationId}::uuid`
    await tx`delete from public.stock_location where organization_id = ${organizationId}::uuid`
    await tx`delete from public.price_history where organization_id = ${organizationId}::uuid`
    await tx`delete from public.price_list_entry where organization_id = ${organizationId}::uuid`
    await tx`delete from public.price_list where organization_id = ${organizationId}::uuid`
    await tx`delete from public.product_variant_barcode where organization_id = ${organizationId}::uuid`
    await tx`
      delete from public.product_variant_attribute_value
      where variant_id in (
        select id from public.product_variant where organization_id = ${organizationId}::uuid
      )
    `
    await tx`
      delete from public.product_variant_axis_option
      where axis_id in (
        select id from public.product_variant_axis where organization_id = ${organizationId}::uuid
      )
    `
    await tx`delete from public.product_variant_axis where organization_id = ${organizationId}::uuid`
    await tx`delete from public.product_variant where organization_id = ${organizationId}::uuid`
    await tx`delete from public.product where organization_id = ${organizationId}::uuid`
    await tx`
      delete from public.attribute_option
      where definition_id in (
        select id from public.attribute_definition where organization_id = ${organizationId}::uuid
      )
    `
    await tx`delete from public.attribute_definition where organization_id = ${organizationId}::uuid`
    await tx`delete from public.category where organization_id = ${organizationId}::uuid`
    await tx`delete from public.brand where organization_id = ${organizationId}::uuid`
    await tx`delete from public.membership where organization_id = ${organizationId}::uuid`
    await tx`delete from public.organization where id = ${organizationId}::uuid`
  })
}

export async function afterAllCatalogPersistence(): Promise<void> {
  await closeCatalogSqlPools()
}

export { TEST_PASSWORD }
