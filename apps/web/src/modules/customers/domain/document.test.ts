import { describe, expect, it } from 'vitest'
import {
  createCustomerDocument,
  isValidCnpj,
  isValidCpf,
  normalizeDocumentDigits,
  tryCreateCustomerDocument,
} from '#/modules/customers/domain/document'

describe('CustomerDocument VOs', () => {
  it('normalizes without mask', () => {
    expect(normalizeDocumentDigits('529.982.247-25')).toBe('52998224725')
    expect(normalizeDocumentDigits('11.444.777/0001-61')).toBe('11444777000161')
  })

  it('validates CPF checksum', () => {
    expect(isValidCpf('52998224725')).toBe(true)
    expect(isValidCpf('11111111111')).toBe(false)
    expect(isValidCpf('52998224726')).toBe(false)
  })

  it('validates CNPJ checksum', () => {
    expect(isValidCnpj('11444777000161')).toBe(true)
    expect(isValidCnpj('00000000000000')).toBe(false)
  })

  it('creates typed documents', () => {
    expect(createCustomerDocument('PF', '529.982.247-25')).toEqual({
      personType: 'PF',
      digits: '52998224725',
    })
    expect(createCustomerDocument('PJ', '11444777000161').digits).toBe(
      '11444777000161',
    )
    expect(tryCreateCustomerDocument('PF', '')).toBeNull()
    expect(() => createCustomerDocument('PF', '123')).toThrow(/cpf/)
  })
})
