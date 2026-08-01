import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const migration = readFileSync(
  resolve(process.cwd(), '../../supabase/migrations/20260801020000_cap_onboarding_input_validation_fix.sql'),
  'utf8',
)

describe('CAP onboarding validation migration', () => {
  it('uses PostgreSQL-compatible e-mail and phone regular expressions', () => {
    expect(migration).toContain("'^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'")
    expect(migration).toContain("regexp_replace(p_phone, '\\D', '', 'g')")
    expect(migration).not.toContain('\\\\s')
    expect(migration).not.toContain('\\\\D')
  })
})
