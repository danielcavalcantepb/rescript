// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import {
  LOCAL_SUPABASE,
  afterAllCatalogPersistence,
  createAnonClient,
  createServiceRoleClient,
  isLocalSupabaseAvailable,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'
import { getCatalogSql } from '#/modules/catalog/infrastructure/supabase/index.server'

type RpcClient = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>
}

async function rpc<T>(
  client: RpcClient,
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await client.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

async function cleanup(checkoutId?: string, organizationId?: string) {
  const sql = getCatalogSql(LOCAL_SUPABASE.databaseUrl)
  await sql.begin(async (tx) => {
    await tx`select set_config('checkout.allow_history_admin', 'on', true)`
    if (checkoutId) {
      await tx`delete from public.provisioning_history where checkout_id = ${checkoutId}::uuid`
      await tx`delete from public.provisioning_run where checkout_id = ${checkoutId}::uuid`
      await tx`delete from public.checkout_history where checkout_id = ${checkoutId}::uuid`
      await tx`delete from public.checkout_search where checkout_id = ${checkoutId}::uuid`
      await tx`delete from public.checkout_session where id = ${checkoutId}::uuid`
    }
    if (organizationId) {
      await tx`select set_config('audit.allow_admin', 'on', true)`
      await tx`delete from public.audit_event where organization_id = ${organizationId}::uuid`
      await tx`delete from public.subscription_event where organization_id = ${organizationId}::uuid`
      await tx`delete from public.organization_onboarding where organization_id = ${organizationId}::uuid`
      await tx`delete from public.subscription where organization_id = ${organizationId}::uuid`
      await tx`delete from public.stock_location where organization_id = ${organizationId}::uuid`
      await tx`delete from public.branch where organization_id = ${organizationId}::uuid`
      await tx`delete from public.membership where organization_id = ${organizationId}::uuid`
      await tx`delete from public.organization where id = ${organizationId}::uuid`
    }
  })
}

describe('checkout tenant provisioning integration', () => {
  afterAll(async () => {
    await afterAllCatalogPersistence()
  })

  it('creates checkout, provisions tenant transactionally and is idempotent', async () => {
    if (!(await isLocalSupabaseAvailable())) return

    const anon = createAnonClient() as unknown as RpcClient
    const admin = createServiceRoleClient()
    const adminRpc = admin as unknown as RpcClient
    const sql = getCatalogSql(LOCAL_SUPABASE.databaseUrl)
    const email = `checkout-${crypto.randomUUID()}@example.com`
    const password = 'checkout-password-123'
    let ownerId: string | undefined
    let checkoutId: string | undefined
    let organizationId: string | undefined

    try {
      const created = await rpc<Record<string, unknown>>(
        anon,
        'create_checkout_session',
        {
          p_selected_plan: 'rescript',
          p_billing_cycle: 'monthly',
          p_country: 'BR',
          p_language: 'pt-BR',
          p_currency: 'BRL',
        },
      )
      checkoutId = String(created.id)
      const token = String(created.public_token)
      expect(created.status).toBe('CREATED')

      const started = await rpc<Record<string, unknown>>(
        anon,
        'start_checkout_session',
        {
          p_public_token: token,
          p_selected_plan: 'rescript',
          p_billing_cycle: 'monthly',
          p_organization_name: 'Checkout Test Store',
          p_owner_name: 'Ana Clara',
          p_owner_email: email,
          p_phone: '+55 11 99999-9999',
          p_country: 'BR',
          p_language: 'pt-BR',
          p_currency: 'BRL',
          p_terms_accepted: true,
        },
      )
      expect(started.status).toBe('STARTED')

      const { data: userData, error: userError } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: 'Ana Clara' },
        })
      if (userError || !userData.user) {
        throw userError ?? new Error('failed_to_create_owner')
      }
      ownerId = userData.user.id

      const result = await rpc<Record<string, unknown>>(
        adminRpc,
        'provision_checkout_session',
        {
          p_public_token: token,
          p_owner_user_id: ownerId,
          p_idempotency_key: 'integration-key',
        },
      )
      organizationId = String(result.organizationId)
      expect(result.status).toBe('SUCCESS')
      expect(result.tenantId).toBe(organizationId)

      const repeated = await rpc<Record<string, unknown>>(
        adminRpc,
        'provision_checkout_session',
        {
          p_public_token: token,
          p_owner_user_id: ownerId,
          p_idempotency_key: 'integration-key',
        },
      )
      expect(repeated.organizationId).toBe(organizationId)

      const [org] = await sql<{ status: string; currency: string }[]>`
        select status, currency from public.organization where id = ${organizationId}::uuid
      `
      expect(org).toEqual({ status: 'active', currency: 'BRL' })

      const [membership] = await sql<{ role: string; is_owner: boolean }[]>`
        select role, is_owner from public.membership
        where organization_id = ${organizationId}::uuid and user_id = ${ownerId}::uuid
      `
      expect(membership).toEqual({ role: 'owner', is_owner: true })

      const [subscription] = await sql<{ status: string; billing_cycle: string }[]>`
        select status, billing_cycle from public.subscription
        where organization_id = ${organizationId}::uuid
      `
      expect(subscription).toEqual({ status: 'trial', billing_cycle: 'monthly' })

      const [workspace] = await sql<{ status: string }[]>`
        select status from public.organization_onboarding
        where organization_id = ${organizationId}::uuid
      `
      expect(workspace).toEqual({ status: 'pending' })

      const [search] = await sql<{ status: string; selected_plan: string }[]>`
        select status, selected_plan from public.checkout_search
        where checkout_id = ${checkoutId}::uuid
      `
      expect(search).toEqual({ status: 'COMPLETED', selected_plan: 'rescript' })

      const [effects] = await sql<{
        receivables: string
        payments: string
        movements: string
        ledger: string
      }[]>`
        select
          (select count(*) from public.accounts_receivable where organization_id = ${organizationId}::uuid)::text as receivables,
          (select count(*) from public.payment where organization_id = ${organizationId}::uuid)::text as payments,
          (select count(*) from public.inventory_movement where organization_id = ${organizationId}::uuid)::text as movements,
          (select count(*) from public.inventory_ledger_movement where organization_id = ${organizationId}::uuid)::text as ledger
      `
      expect(effects).toEqual({
        receivables: '0',
        payments: '0',
        movements: '0',
        ledger: '0',
      })
    } finally {
      await cleanup(checkoutId, organizationId)
      if (ownerId) await admin.auth.admin.deleteUser(ownerId)
    }
  })
})
