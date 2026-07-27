import { describe, expect, it } from 'vitest'
import {
  createBarcode,
  gs1CheckDigit,
} from '#/modules/catalog/domain/value-objects/barcode'
import {
  compareMoney,
  createMoney,
  formatMoneyDisplay,
  isZeroMoney,
} from '#/modules/catalog/domain/value-objects/money'
import { createQuantity } from '#/modules/catalog/domain/value-objects/quantity'
import { createSku } from '#/modules/catalog/domain/value-objects/sku'
import { normalizeName } from '#/modules/catalog/domain/value-objects/normalized-name'

describe('Sku', () => {
  it('normalizes trim and uppercase without spaces', () => {
    const sku = createSku('  ab-12  ')
    expect(sku.ok).toBe(true)
    if (sku.ok) expect(sku.value.value).toBe('AB-12')
  })

  it('rejects empty and invalid characters; strips spaces on normalize', () => {
    expect(createSku('').ok).toBe(false)
    expect(createSku('sku@1').ok).toBe(false)
    const spaced = createSku('SKU COM ESPACO')
    expect(spaced.ok).toBe(true)
    if (spaced.ok) expect(spaced.value.value).toBe('SKUCOMESPACO')
  })
})

describe('Barcode', () => {
  it('validates EAN-13 check digit', () => {
    expect(gs1CheckDigit('590123412345')).toBe(7)
    const ok = createBarcode('EAN_13', '5901234123457')
    expect(ok.ok).toBe(true)
    const bad = createBarcode('EAN_13', '5901234123450')
    expect(bad.ok).toBe(false)
  })

  it('accepts internal codes without GS1', () => {
    const code = createBarcode('internal', 'INT-001')
    expect(code.ok).toBe(true)
  })
})

describe('Money', () => {
  it('stores exact decimal without float drift', () => {
    const money = createMoney('19.99')
    expect(money.ok).toBe(true)
    if (money.ok) {
      expect(money.value.amount).toBe('19.99')
      expect(formatMoneyDisplay(money.value)).toBe('19.99')
    }
  })

  it('rejects negative list prices and excess scale', () => {
    expect(createMoney('-1').ok).toBe(false)
    expect(createMoney('1.1234567').ok).toBe(false)
  })

  it('compares and detects zero', () => {
    const a = createMoney('10.5')
    const b = createMoney('10.50')
    const z = createMoney(0)
    expect(a.ok && b.ok && z.ok).toBe(true)
    if (a.ok && b.ok && z.ok) {
      expect(compareMoney(a.value, b.value)).toBe(0)
      expect(isZeroMoney(z.value)).toBe(true)
    }
  })
})

describe('Quantity', () => {
  it('rejects precision overflow instead of rounding', () => {
    expect(createQuantity('1.23', 1).ok).toBe(false)
    expect(createQuantity('1.2', 1).ok).toBe(true)
    expect(createQuantity('1.0', 0).ok).toBe(false)
  })
})

describe('NormalizedName', () => {
  it('strips accents and lowercases', () => {
    expect(normalizeName('  Café  Preto ')).toBe('cafe preto')
  })
})
