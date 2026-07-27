import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Customer inline create contract', () => {
  const source = readFileSync(
    resolve(
      process.cwd(),
      'src/modules/customers/ui/components/customer-quick-create-form.tsx',
    ),
    'utf8',
  )

  it('reuses the canonical Customer RPCs and permission model', () => {
    expect(source).toContain('useCreateCustomer')
    expect(source).toContain('customerCreateAddress')
    expect(source).toContain("can('customers.addresses.manage')")
    expect(source).not.toContain("from('@supabase")
    expect(source).not.toContain(".from('customer")
  })
})
