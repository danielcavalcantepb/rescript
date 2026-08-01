import { createFileRoute } from '@tanstack/react-router'
import {
  createCaktoBillingGatewayAdapter,
  hashCaktoWebhookPayload,
} from '#/modules/acquisition/infrastructure/cakto-billing-gateway-adapter'
import { createServiceRoleSupabaseClient } from '#/lib/supabase/service-role.server'

type RpcClient = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>
}

const requestCounts = new Map<string, { count: number; resetAt: number }>()

function isAllowed(ip: string) {
  const now = Date.now()
  const current = requestCounts.get(ip)
  if (!current || current.resetAt < now) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  current.count += 1
  return current.count <= 60
}

function methodNotAllowed() {
  return Response.json(
    { error: 'method_not_allowed' },
    { status: 405, headers: { Allow: 'POST' } },
  )
}

/**
 * Public Cakto webhook ingress. This is a TanStack Start Server Route so it
 * participates in the generated route tree and is deployed by Nitro/Vercel.
 * Cakto interpretation remains exclusively in the gateway adapter.
 */
export const Route = createFileRoute('/api/billing/webhook')({
  server: {
    handlers: {
      GET: methodNotAllowed,
      POST: async ({ request }) => {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        if (!isAllowed(ip)) {
          return Response.json({ error: 'rate_limited' }, { status: 429 })
        }

        if (process.env.CAP_BILLING_GATEWAY !== 'cakto') {
          return Response.json({ error: 'gateway_not_configured' }, { status: 503 })
        }

        const rawBody = await request.text()
        try {
          const adapter = createCaktoBillingGatewayAdapter()
          const signature = request.headers.get('x-cakto-signature')
          if (!rawBody || !(await adapter.validateWebhook(rawBody, signature))) {
            return Response.json({ error: 'invalid_signature' }, { status: 401 })
          }

          const billingEvent = adapter.normalizeWebhook(JSON.parse(rawBody))
          const client = createServiceRoleSupabaseClient() as unknown as RpcClient
          const { data, error } = await client.rpc('cap_ingest_billing_event', {
            p_gateway: 'cakto',
            p_external_event_id: billingEvent.externalEventId,
            p_billing_session_public_id: billingEvent.billingSessionPublicId,
            p_event_type: billingEvent.type,
            p_payload: billingEvent.payload,
            p_payload_hash: hashCaktoWebhookPayload(rawBody),
            p_correlation_id: null,
          })
          if (error) throw new Error(error.message)

          return Response.json(data ?? { accepted: true }, { status: 200 })
        } catch (error) {
          const code = error instanceof Error ? error.message : 'webhook_processing_failed'
          return Response.json({ error: code }, { status: 400 })
        }
      },
    },
  },
})
