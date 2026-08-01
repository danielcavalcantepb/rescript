// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL('../../../../../../supabase/migrations/20260730050000_cap_subscription_intent_billing_foundation.sql', import.meta.url),
  'utf8',
)

describe('CAP commercial intent contract', () => {
  it('keeps commercial intent, billing attempt, and active subscription separate', () => {
    expect(migration).toContain('create table public.subscription_intent')
    expect(migration).toContain('create table public.billing_session')
    expect(migration).toContain("'plan_selected','checkout_created','checkout_started'")
    expect(migration).toContain("comment on table public.subscription_intent is 'CAP commercial decision only")
  })

  it('resolves catalog pricing on the server and protects write paths', () => {
    expect(migration).toContain('cap_resolve_subscription_price')
    expect(migration).toContain('cap_get_plans')
    expect(migration).toContain('cap_get_prices')
    expect(migration).toContain('cap_calculate_pricing')
    expect(migration).toContain('cap_validate_coupon')
    expect(migration).toContain('revoke all on public.subscription_intent')
  })

  it('provides state guards, idempotency, coupon contracts, and owner-scoped policies', () => {
    expect(migration).toContain('subscription_intent_transition_guard')
    expect(migration).toContain('unique (onboarding_session_id, idempotency_key)')
    expect(migration).toContain('cap_apply_coupon')
    expect(migration).toContain('cap_remove_coupon')
    expect(migration).toContain('subscription_intent_owner_read')
    expect(migration).toContain('billing_session_owner_read')
  })
})
