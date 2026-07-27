import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const clientDist = path.resolve(__dirname, '../../../../dist/client')

function walkJsFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walkJsFiles(full, acc)
    else if (entry.endsWith('.js')) acc.push(full)
  }
  return acc
}

describe('payable client bundle safety', () => {
  it('public payable barrel does not re-export server repos', async () => {
    const mod = await import('#/modules/payable')
    expect('createSupabasePayableRepos' in mod).toBe(false)
    expect('SupabaseAccountsPayableRepository' in mod).toBe(false)
    expect('supabaseAccountsPayableRepository' in mod).toBe(false)
  })

  it('client dist (when built) excludes payable server factory markers', () => {
    if (!existsSync(clientDist)) {
      expect(existsSync(clientDist)).toBe(false)
      return
    }
    const files = walkJsFiles(clientDist)
    expect(files.length).toBeGreaterThan(0)
    const forbidden = [
      /createSupabasePayableRepos/,
      /SupabasePayableHistoryRepository/,
      /payable\.allow_history_admin/,
      /allocate_accounts_payable_number/,
      /from\s*["']postgres["']/,
      /service_role/,
    ]
    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      for (const pattern of forbidden) {
        expect(content, `${path.basename(file)} matched ${pattern}`).not.toMatch(
          pattern,
        )
      }
    }
  })
})
