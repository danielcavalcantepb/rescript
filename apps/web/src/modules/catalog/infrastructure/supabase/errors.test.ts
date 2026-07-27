import { describe, expect, it } from 'vitest'
import {
  CatalogConflictError,
  CatalogNotFoundError,
  CatalogPermissionError,
} from '#/modules/catalog/application/errors'
import { mapSupabaseError } from '#/modules/catalog/infrastructure/supabase/errors'

describe('mapSupabaseError', () => {
  it('maps unique violation to CatalogConflictError', () => {
    expect(() =>
      mapSupabaseError({
        code: '23505',
        message: 'duplicate key product_variant_org_sku_uidx',
      }),
    ).toThrow(CatalogConflictError)
    try {
      mapSupabaseError({
        code: '23505',
        message: 'duplicate key product_variant_org_sku_uidx',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogConflictError)
      expect((error as Error).message).toBe('sku_conflict')
    }
  })

  it('maps PGRST116 to CatalogNotFoundError', () => {
    expect(() => mapSupabaseError({ code: 'PGRST116' })).toThrow(
      CatalogNotFoundError,
    )
  })

  it('maps RLS / permission failures', () => {
    expect(() =>
      mapSupabaseError({
        code: '42501',
        message: 'new row violates row-level security policy',
      }),
    ).toThrow(CatalogPermissionError)
  })

  it('never returns raw supabase message for unknown failures', () => {
    try {
      mapSupabaseError({ code: 'XX000', message: 'super secret db dump' })
      expect.fail('should throw')
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogConflictError)
      expect((error as Error).message).toBe('persistence_failed')
      expect((error as Error).message).not.toContain('secret')
    }
  })

  it('does not surface connection strings from driver errors', () => {
    try {
      mapSupabaseError({
        code: 'XX000',
        message:
          'connect postgresql://postgres:hunter2@127.0.0.1:54322/postgres failed',
      })
      expect.fail('should throw')
    } catch (error) {
      expect((error as Error).message).toBe('persistence_failed')
      expect((error as Error).message).not.toContain('hunter2')
      expect((error as Error).message).not.toContain('postgresql://')
    }
  })
})
