import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const readSource = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

describe('Financial Workspace navigation contract', () => {
  it('exposes one Financeiro entry in the main sidebar', () => {
    const sidebar = readSource('../../../components/layout/Sidebar.tsx')

    expect(sidebar).toContain("to: '/finance', label: 'Financeiro'")
    expect(sidebar).not.toContain("to: '/finance/accounts-payable', label: 'Contas a pagar'")
    expect(sidebar).not.toContain("to: '/finance/payments', label: 'Pagamentos'")
    expect(sidebar).not.toContain("to: '/finance/receivables', label: 'Contas a receber'")
  })

  it('exposes only implemented areas with existing permissions', () => {
    const workspace = readSource('../finance.tsx')

    expect(workspace).toContain('Contas a receber')
    expect(workspace).toContain('Contas a pagar')
    expect(workspace).toContain('Pagamentos')
    expect(workspace).not.toContain('Fluxo de caixa')
    expect(workspace).not.toContain('Conciliação')
    expect(workspace).toContain("'receivables.read'")
    expect(workspace).toContain("'payable.read'")
    expect(workspace).toContain("'payments.read'")
  })
})
