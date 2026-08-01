// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getCertificationConfig } from './environment'

const credentials = {
  CERTIFICATION_SUPABASE_URL: 'https://homologation.example.supabase.co',
  CERTIFICATION_SUPABASE_ANON_KEY: 'anon-test-key',
  CERTIFICATION_SUPABASE_SERVICE_ROLE_KEY: 'service-test-key',
  CERTIFICATION_DATABASE_URL: 'postgresql://test',
}

describe('remote certification environment guard', () => {
  it.each(['development', 'homologation', 'test'] as const)(
    'allows %s',
    (APP_ENV) => {
      expect(getCertificationConfig({ ...credentials, APP_ENV }).environment).toBe(APP_ENV)
    },
  )

  it('always rejects production', () => {
    expect(() => getCertificationConfig({ ...credentials, APP_ENV: 'production' })).toThrow(
      'certification_forbidden_in_production',
    )
  })

  it('does not permit an undeclared environment', () => {
    expect(() => getCertificationConfig(credentials)).toThrow(
      'certification_environment_must_be_development_or_homologation',
    )
  })
})
