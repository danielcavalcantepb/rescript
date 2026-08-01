// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL('../../../../../../supabase/migrations/20260730040000_cap_onboarding_session_refactor.sql', import.meta.url),
  'utf8',
)

describe('CAP OnboardingSession persistence contract', () => {
  it('renames the root and all owned children without deleting session data', () => {
    expect(migration).toContain('rename to onboarding_session')
    expect(migration).toContain('rename to onboarding_consent')
    expect(migration).toContain('rename to onboarding_business_profile')
    expect(migration).toContain('rename to onboarding_event')
    expect(migration).toContain('rename column acquisition_id to onboarding_id')
    expect(migration).toContain("constraint_catalog.conname like 'customer_acquisition%'")
  })

  it('keeps the public CAP RPC contract while guarding canonical lifecycle states', () => {
    expect(migration).toContain("'provisioned', 'operational_onboarding', 'completed'")
    expect(migration).toContain('onboarding_session_state_transition_guard')
    expect(migration).toContain('cap_transition_allowed')
    expect(migration).toContain('create or replace function public.cap_start')
    expect(migration).toContain('create or replace function public.cap_resume')
  })

  it('keeps session reads tenant-safe through renamed RLS policies', () => {
    expect(migration).toContain('onboarding_session_owner_read')
    expect(migration).toContain('onboarding_consent_owner_read')
    expect(migration).toContain('onboarding_business_profile_owner_read')
  })
})
