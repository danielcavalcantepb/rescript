// @vitest-environment node
import { existsSync,readFileSync } from 'node:fs'
import path from 'node:path'
import { describe,expect,it } from 'vitest'
import { permissionsForRole } from '@rescript/permissions'

const rootMigration=path.resolve(process.cwd(),'supabase/migrations/20260726100000_payments.sql')
const migration=readFileSync(
  path.resolve(process.cwd(),existsSync(rootMigration)?'supabase/migrations/20260726100000_payments.sql':'../../supabase/migrations/20260726100000_payments.sql'),
  'utf8',
)

describe('payments persistence contract',()=>{
  it('keeps confirmation and reversal atomic, locked and idempotent',()=>{
    expect(migration).toMatch(/function public\.confirm_payment/)
    expect(migration).toMatch(/function public\.reverse_payment/)
    expect(migration).toMatch(/for update of pi/)
    expect(migration).toMatch(/confirmation_idempotency_key/)
    expect(migration).toMatch(/reversal_idempotency_key/)
    expect(migration).toMatch(/payment_single_reversal_idx/)
  })
  it('updates partial and total balances without changing original amount',()=>{
    expect(migration).toMatch(/'partially_paid'/)
    expect(migration).toMatch(/'paid'/)
    expect(migration).not.toMatch(/set original_amount/)
    expect(migration).not.toMatch(/set amount=amount-/)
  })
  it('enforces tenant ownership and server-aligned database permissions',()=>{
    expect(migration).toMatch(/public\.can_manage_payments\(p_organization_id\)/)
    expect(migration).toMatch(/organization_id=p_organization_id/)
    expect(migration).toMatch(/enable row level security/g)
  })
})

describe('payments permissions',()=>{
  it('finance can operate payments and viewer remains read-only',()=>{
    const finance=permissionsForRole('finance');const viewer=permissionsForRole('viewer')
    expect(finance).toEqual(expect.arrayContaining(['payments.read','payments.create','payments.confirm','payments.reverse','payments.archive','financial_accounts.read']))
    expect(viewer).toContain('payments.read')
    expect(viewer).not.toContain('payments.create')
  })
})

describe('payments RPC surface',()=>{
  it('exposes every serializable command and query contract',async()=>{
    const api=await import('#/modules/payments/ui/payments-api')
    expect(api).toEqual(expect.objectContaining({
      createPayment:expect.any(Function),confirmPayment:expect.any(Function),reversePayment:expect.any(Function),
      archivePayment:expect.any(Function),getPayment:expect.any(Function),listPayments:expect.any(Function),
      searchPayments:expect.any(Function),listFinancialAccounts:expect.any(Function),
    }))
  })
})
