type RpcResult = { data: unknown; error: { message: string } | null }

type RpcClient = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<RpcResult>
}

export type OutboxEvent = {
  id: string
  aggregate_type: string
  aggregate_id: string
  event_type: string
  payload: Record<string, unknown>
  correlation_id: string
  occurred_at: string
}

/** The transport is injected so CAP remains independent from a message broker. */
export interface DomainEventTransport {
  publish(event: OutboxEvent): Promise<void>
}

/**
 * Server-only worker entry point. It claims durable outbox records before
 * dispatching them and records publication failures for retry/dead-lettering.
 */
export async function publishAvailableOutboxEvents(
  publisherId: string,
  transport: DomainEventTransport,
  limit = 25,
) {
  const { createServiceRoleSupabaseClient } = await import('#/lib/supabase/service-role.server')
  const client = createServiceRoleSupabaseClient() as unknown as RpcClient
  const claimed = await client.rpc('cap_claim_outbox_events', {
    p_publisher_id: publisherId,
    p_limit: Math.max(1, Math.min(limit, 100)),
  })
  if (claimed.error) throw new Error(claimed.error.message)

  const events = (Array.isArray(claimed.data) ? claimed.data : []) as OutboxEvent[]
  let published = 0
  for (const event of events) {
    try {
      await transport.publish(event)
      const result = await client.rpc('cap_mark_outbox_event_published', { p_event_id: event.id })
      if (result.error) throw new Error(result.error.message)
      published += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown publisher error'
      const failure = await client.rpc('cap_mark_outbox_event_failed', {
        p_event_id: event.id,
        p_error_code: 'publisher_dispatch_failed',
        p_error_message: message,
      })
      if (failure.error) {
        throw new Error(`${message}; outbox failure registration failed: ${failure.error.message}`, {
          cause: error,
        })
      }
    }
  }

  return { claimed: events.length, published }
}
