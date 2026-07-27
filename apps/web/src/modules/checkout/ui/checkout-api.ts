import { createServerFn } from '@tanstack/react-start'
import type {
  BillingCycle,
  CheckoutDetailsInput,
  CheckoutSession,
  PlanCode,
  ProvisioningResult,
} from '#/modules/checkout/domain/types'

export type CheckoutRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

type RpcClient = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>
}

function rowToSession(row: Record<string, unknown>): CheckoutSession {
  return {
    id: String(row.id),
    publicToken: String(row.public_token),
    status: row.status as CheckoutSession['status'],
    selectedPlan: row.selected_plan as PlanCode,
    billingCycle: row.billing_cycle as BillingCycle,
    organizationName:
      row.organization_name == null ? null : String(row.organization_name),
    ownerName: row.owner_name == null ? null : String(row.owner_name),
    ownerEmail: row.owner_email == null ? null : String(row.owner_email),
    phone: row.phone == null ? null : String(row.phone),
    country: String(row.country),
    language: String(row.language),
    currency: String(row.currency),
    createdAt: String(row.created_at),
    expiresAt: String(row.expires_at),
  }
}

function rowToProvisioningResult(row: Record<string, unknown>): ProvisioningResult {
  return {
    checkoutId: String(row.checkoutId),
    tenantId: String(row.tenantId),
    organizationId: String(row.organizationId),
    ownerId: String(row.ownerId),
    subscriptionId: String(row.subscriptionId),
    status: 'SUCCESS',
  }
}

async function run<T>(work: () => Promise<T>): Promise<CheckoutRpcResult<T>> {
  try {
    return { ok: true, data: await work() }
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'checkout_error'
    const code = Object.keys(messages).find((key) => raw.includes(key)) ?? raw
    return {
      ok: false,
      error: {
        code,
        message: messages[code] ?? 'Não foi possível concluir o checkout.',
      },
    }
  }
}

const messages: Record<string, string> = {
  invalid_plan: 'Selecione um plano válido.',
  invalid_billing_cycle: 'Selecione um ciclo de cobrança válido.',
  invalid_organization_name: 'Informe o nome da empresa.',
  invalid_owner_name: 'Informe o nome do responsável.',
  invalid_owner_email: 'Informe um e-mail válido.',
  owner_email_already_exists: 'Este e-mail já possui uma conta Rescript.',
  weak_password: 'A senha deve ter pelo menos 8 caracteres.',
  terms_not_accepted: 'Aceite os termos para continuar.',
  checkout_expired: 'Esta sessão expirou. Inicie novamente.',
  checkout_not_found: 'Sessão de checkout não encontrada.',
  checkout_not_ready: 'Revise os dados antes de finalizar.',
  owner_auth_user_mismatch: 'Não foi possível validar o usuário proprietário.',
  supabase_admin_missing:
    'Provisionamento indisponível: credenciais administrativas do Supabase não configuradas.',
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

export const createCheckoutSession = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      selectedPlan: PlanCode
      billingCycle: BillingCycle
      country?: string
      language?: string
      currency?: string
    }) => data,
  )
  .handler(({ data }) =>
    run(async () => {
      const { createServerSupabaseClient } = await import(
        '#/lib/supabase/server.server'
      )
      const client = createServerSupabaseClient() as unknown as RpcClient
      const row = await rpc<Record<string, unknown>>(client, 'create_checkout_session', {
        p_selected_plan: data.selectedPlan,
        p_billing_cycle: data.billingCycle,
        p_country: data.country ?? 'BR',
        p_language: data.language ?? 'pt-BR',
        p_currency: data.currency ?? 'BRL',
      })
      return rowToSession(row)
    }),
  )

export const startCheckoutSession = createServerFn({ method: 'POST' })
  .validator((data: CheckoutDetailsInput) => data)
  .handler(({ data }) =>
    run(async () => {
      const { validateCheckoutDetails } = await import(
        '#/modules/checkout/domain/validation'
      )
      const { createServerSupabaseClient } = await import(
        '#/lib/supabase/server.server'
      )
      validateCheckoutDetails(data)
      const client = createServerSupabaseClient() as unknown as RpcClient
      const row = await rpc<Record<string, unknown>>(client, 'start_checkout_session', {
        p_public_token: data.publicToken,
        p_selected_plan: data.selectedPlan,
        p_billing_cycle: data.billingCycle,
        p_organization_name: data.organizationName,
        p_owner_name: data.ownerName,
        p_owner_email: data.ownerEmail,
        p_phone: data.phone,
        p_country: data.country,
        p_language: data.language,
        p_currency: data.currency,
        p_terms_accepted: data.termsAccepted,
      })
      return rowToSession(row)
    }),
  )

export const completeCheckoutSession = createServerFn({ method: 'POST' })
  .validator((data: CheckoutDetailsInput & { idempotencyKey: string }) => data)
  .handler(({ data }) =>
    run(async () => {
      const { validateCheckoutDetails } = await import(
        '#/modules/checkout/domain/validation'
      )
      const { createAdminSupabaseClient } = await import(
        '#/lib/supabase/admin.server'
      )
      validateCheckoutDetails(data)

      const admin = createAdminSupabaseClient()
      const rpcClient = admin as unknown as RpcClient

      const existing = await rpc<Record<string, unknown> | null>(
        rpcClient,
        'get_checkout_result',
        { p_public_token: data.publicToken },
      )
      if (existing) return rowToProvisioningResult(existing)

      const { data: created, error: authError } =
        await admin.auth.admin.createUser({
          email: data.ownerEmail.trim().toLowerCase(),
          password: data.ownerPassword,
          email_confirm: true,
          user_metadata: {
            full_name: data.ownerName.trim(),
            display_name: data.ownerName.trim(),
            terms_accepted_at: new Date().toISOString(),
            checkout_public_token: data.publicToken,
          },
        })

      if (authError || !created.user) {
        await rpc<void>(rpcClient, 'record_checkout_failure', {
          p_public_token: data.publicToken,
          p_reason: authError?.message ?? 'owner_auth_creation_failed',
        }).catch(() => undefined)
        throw new Error(
          authError?.message.includes('already')
            ? 'owner_email_already_exists'
            : (authError?.message ?? 'owner_auth_creation_failed'),
        )
      }

      try {
        const result = await rpc<Record<string, unknown>>(
          rpcClient,
          'provision_checkout_session',
          {
            p_public_token: data.publicToken,
            p_owner_user_id: created.user.id,
            p_idempotency_key: data.idempotencyKey,
          },
        )
        return rowToProvisioningResult(result)
      } catch (error) {
        await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined)
        await rpc<void>(rpcClient, 'record_checkout_failure', {
          p_public_token: data.publicToken,
          p_reason: error instanceof Error ? error.message : 'provisioning_failed',
        }).catch(() => undefined)
        throw error
      }
    }),
  )

export const cancelCheckoutSession = createServerFn({ method: 'POST' })
  .validator((data: { publicToken: string; reason?: string }) => data)
  .handler(({ data }) =>
    run(async () => {
      const { createServerSupabaseClient } = await import(
        '#/lib/supabase/server.server'
      )
      const client = createServerSupabaseClient() as unknown as RpcClient
      const row = await rpc<Record<string, unknown>>(client, 'cancel_checkout_session', {
        p_public_token: data.publicToken,
        p_reason: data.reason ?? null,
      })
      return rowToSession(row)
    }),
  )
