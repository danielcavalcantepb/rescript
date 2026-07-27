import type {
  CreateAddressInput,
  CreateContactInput,
  CreateCustomerInput,
  Customer,
  CustomerAddress,
  CustomerContact,
  CustomerHistoryEntry,
  CustomerListItem,
  CustomerSnapshot,
  ListCustomersQuery,
  ListCustomersResult,
  SearchCustomersQuery,
  UpdateAddressInput,
  UpdateContactInput,
  UpdateCustomerInput,
} from '#/modules/customers/domain/types'

export type CustomerRpcError = {
  code: string
  message: string
  fieldErrors?: Record<string, string>
}

export type CustomerRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: CustomerRpcError }

export type CustomerSummaryDto = CustomerListItem
export type CustomerDto = Customer
export type CustomerContactDto = CustomerContact
export type CustomerAddressDto = CustomerAddress
export type CustomerSearchDto = CustomerListItem
export type CustomerSnapshotDto = CustomerSnapshot
export type CustomerHistoryDto = CustomerHistoryEntry

export type {
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateContactInput,
  UpdateContactInput,
  CreateAddressInput,
  UpdateAddressInput,
  ListCustomersQuery,
  ListCustomersResult,
  SearchCustomersQuery,
}
