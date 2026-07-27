import { describe, expect, it } from 'vitest'
import * as customerDocs from '#/modules/customers/domain/document'
import * as supplierDocs from '#/modules/suppliers/domain/document'

describe('Supplier document VO reuse', () => {
  it('re-exports the same CPF/CNPJ functions from Customer', () => {
    expect(supplierDocs.isValidCpf).toBe(customerDocs.isValidCpf)
    expect(supplierDocs.isValidCnpj).toBe(customerDocs.isValidCnpj)
    expect(supplierDocs.normalizeDocumentDigits).toBe(
      customerDocs.normalizeDocumentDigits,
    )
    expect(supplierDocs.isValidDocumentDigits).toBe(
      customerDocs.isValidDocumentDigits,
    )
    expect(supplierDocs.createSupplierDocument).toBe(
      customerDocs.createCustomerDocument,
    )
  })

  it('validates through shared implementation', () => {
    expect(supplierDocs.isValidCpf('52998224725')).toBe(true)
    expect(supplierDocs.isValidCnpj('11444777000161')).toBe(true)
    expect(supplierDocs.createSupplierDocument('PF', '529.982.247-25').digits).toBe(
      '52998224725',
    )
  })
})
