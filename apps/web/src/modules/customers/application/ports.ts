import type {
  CreateAddressInput,
  CreateContactInput,
  CreateCustomerInput,
  Customer,
  CustomerAddress,
  CustomerContact,
  CustomerHistoryEntry,
  CustomerListItem,
  ListCustomersQuery,
  ListCustomersResult,
  SearchCustomersQuery,
  UpdateAddressInput,
  UpdateContactInput,
  UpdateCustomerInput,
} from '#/modules/customers/domain/types'

export type CustomerRepository = {
  getById(organizationId: string, id: string): Promise<Customer | null>
  create(
    organizationId: string,
    userId: string,
    input: CreateCustomerInput & { status: Customer['status']; document: string | null },
  ): Promise<Customer>
  update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateCustomerInput & { document?: string | null },
  ): Promise<Customer>
  setStatus(
    organizationId: string,
    userId: string,
    id: string,
    status: Customer['status'],
    archive?: { archivedAt: string | null; archivedBy: string | null },
  ): Promise<Customer>
}

export type CustomerSearchRepository = {
  list(
    organizationId: string,
    query: ListCustomersQuery,
  ): Promise<ListCustomersResult>
  search(
    organizationId: string,
    query: SearchCustomersQuery,
  ): Promise<CustomerListItem[]>
}

export type CustomerContactRepository = {
  listByCustomer(
    organizationId: string,
    customerId: string,
  ): Promise<CustomerContact[]>
  getById(
    organizationId: string,
    id: string,
  ): Promise<CustomerContact | null>
  create(
    organizationId: string,
    userId: string,
    input: CreateContactInput,
  ): Promise<CustomerContact>
  update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateContactInput,
  ): Promise<CustomerContact>
  softRemove(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<CustomerContact>
  clearPrimary(
    organizationId: string,
    customerId: string,
    exceptId?: string,
  ): Promise<void>
}

export type CustomerAddressRepository = {
  listByCustomer(
    organizationId: string,
    customerId: string,
  ): Promise<CustomerAddress[]>
  getById(
    organizationId: string,
    id: string,
  ): Promise<CustomerAddress | null>
  create(
    organizationId: string,
    userId: string,
    input: CreateAddressInput,
  ): Promise<CustomerAddress>
  update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateAddressInput,
  ): Promise<CustomerAddress>
  softRemove(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<CustomerAddress>
  clearPrimaryForKind(
    organizationId: string,
    customerId: string,
    kind: CustomerAddress['kind'],
    exceptId?: string,
  ): Promise<void>
}

export type CustomerHistoryRepository = {
  append(
    organizationId: string,
    entry: {
      customerId: string
      action: string
      fieldName?: string | null
      oldValue?: string | null
      newValue?: string | null
      reason?: string | null
      actorUserId: string
      actorIp?: string | null
    },
  ): Promise<CustomerHistoryEntry>
  listByCustomer(
    organizationId: string,
    customerId: string,
    limit?: number,
  ): Promise<CustomerHistoryEntry[]>
}

/** @deprecated prefer typed ports above */
export type { CustomerRepository as LegacyCustomerRepositoryShape }
