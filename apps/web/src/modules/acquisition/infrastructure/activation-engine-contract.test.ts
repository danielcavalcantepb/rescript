// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  canTransitionActivation,
  canTransitionProvisioningJob,
  isRecoverableProvisioningError,
  retryDelaysMs,
} from '../application/activation-engine'

const foundationMigration = readFileSync(
  new URL('../../../../../../supabase/migrations/20260731010000_cap_activation_engine_provisioning.sql', import.meta.url),
  'utf8',
)
const consolidationMigration = readFileSync(
  new URL('../../../../../../supabase/migrations/20260731011000_cap_activation_provisioning_consolidation.sql', import.meta.url),
  'utf8',
)

describe('CAP activation engine contract', () => {
  it('keeps guarded activation and provisioning lifecycles', () => {
    expect(canTransitionActivation('pending', 'validating')).toBe(true)
    expect(canTransitionActivation('completed', 'validating')).toBe(false)
    expect(canTransitionActivation('validated', 'subscription_creating')).toBe(true)
    expect(canTransitionProvisioningJob('queued', 'claimed')).toBe(true)
    expect(canTransitionProvisioningJob('completed', 'running')).toBe(false)
    expect(retryDelaysMs).toEqual([0, 60_000, 300_000, 900_000, 3_600_000])
    expect(isRecoverableProvisioningError('timeout')).toBe(true)
  })

  it('uses one activation and one job per confirmed billing session', () => {
    expect(foundationMigration).toContain('unique(billing_session_id)')
    expect(foundationMigration).toContain('activation_id uuid not null unique')
    expect(consolidationMigration).toContain('unique(gateway, external_event_id)')
    expect(consolidationMigration).toContain('cap_orchestrate_activation')
    expect(consolidationMigration).toContain('cap_execute_provisioning')
  })

  it('keeps gateway ingestion separate from provisioning and uses service role only', () => {
    expect(foundationMigration).toContain('cap_record_verified_payment_webhook')
    expect(consolidationMigration).toContain('cap_ingest_billing_event')
    expect(consolidationMigration).toContain("auth.role() <> 'service_role'")
    expect(consolidationMigration).toContain('cap_schedule_provisioning_retry')
    expect(consolidationMigration).toContain('cap_reprocess_provisioning_dead_letter')
  })

  it('provisions only the tenant foundation and records activation events', () => {
    expect(foundationMigration).toContain('create table public.tenant_provisioning_configuration')
    expect(consolidationMigration).toContain("'PaymentConfirmed'")
    expect(consolidationMigration).toContain("'ActivationStarted'")
    expect(consolidationMigration).toContain("'SubscriptionCreated'")
    expect(consolidationMigration).toContain("'ProvisioningQueued'")
    expect(consolidationMigration).toContain("'ProvisioningCompleted'")
    expect(consolidationMigration).toContain("'TenantActivated'")
    expect(consolidationMigration).toContain('insert into public.organization')
    expect(consolidationMigration).toContain('insert into public.subscription')
    expect(consolidationMigration).toContain('create table if not exists public.domain_outbox')
    expect(consolidationMigration).toContain('cap_mark_outbox_event_failed')
    expect(consolidationMigration).toContain('create or replace view public.cap_activation_timeline')
  })
})
