import { describe, expect, it } from 'vitest'
import { CatalogPermissionError } from '#/modules/catalog/application/errors'
import {
  assertEntityOrganization,
  assertSafeDatabaseUrl,
  redactSensitive,
} from '#/modules/catalog/infrastructure/supabase/tenant-context'

describe('catalog tenant context guards', () => {
  it('rejects organization mismatch', () => {
    expect(() =>
      assertEntityOrganization('org-a', 'org-b'),
    ).toThrow(CatalogPermissionError)
  })

  it('accepts only postgres URLs for databaseUrl', () => {
    expect(() => assertSafeDatabaseUrl('')).toThrow(CatalogPermissionError)
    expect(() =>
      assertSafeDatabaseUrl('https://example.com'),
    ).toThrow(CatalogPermissionError)
    expect(() =>
      assertSafeDatabaseUrl('postgresql://postgres:postgres@127.0.0.1:54322/postgres'),
    ).not.toThrow()
  })

  it('redacts connection strings and JWTs from diagnostics', () => {
    const raw =
      'fail postgresql://postgres:secret@127.0.0.1:54322/postgres token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb service_role'
    const redacted = redactSensitive(raw)
    expect(redacted).not.toContain('secret')
    expect(redacted).not.toContain('eyJ')
    expect(redacted).toContain('postgresql://***')
    expect(redacted).toContain('[redacted_role]')
  })
})
