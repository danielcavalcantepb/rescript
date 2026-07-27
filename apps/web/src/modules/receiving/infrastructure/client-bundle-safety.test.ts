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

describe('receiving client bundle safety', () => {
  it('public receiving barrel does not re-export server repos', async () => {
    const mod = await import('#/modules/receiving')
    expect('createSupabaseReceivingRepos' in mod).toBe(false)
    expect('SupabaseGoodsReceiptRepository' in mod).toBe(false)
    expect('supabaseGoodsReceiptRepository' in mod).toBe(false)
  })

  it('client dist (when built) excludes receiving server factory markers', () => {
    if (!existsSync(clientDist)) {
      expect(existsSync(clientDist)).toBe(false)
      return
    }
    const files = walkJsFiles(clientDist)
    expect(files.length).toBeGreaterThan(0)
    const forbidden = [
      /createSupabaseReceivingRepos/,
      /SupabaseGoodsReceiptHistoryRepository/,
      /receiving\.allow_history_admin/,
      /allocate_goods_receipt_number/,
      /post_goods_receipt/,
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
