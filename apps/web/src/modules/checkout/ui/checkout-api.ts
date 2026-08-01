import { createServerFn } from '@tanstack/react-start'
import type {
  BillingCycle,
  CheckoutDetailsInput,
  CheckoutSession,
  PlanCode,
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
      validateCheckoutDetails(data)
      // This legacy entry point intentionally cannot provision a tenant.
      // Billing confirmation must enter through the verified webhook and CAP
      // Activation pipeline, which creates the canonical subscription first.
      throw new Error('legacy_checkout_redirect_to_onboarding')
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
