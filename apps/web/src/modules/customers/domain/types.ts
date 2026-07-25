import type { CustomerPersonType, CustomerStatus } from '@rescript/database'

/** Application model — never expose raw DB rows to UI. */
export type Customer = {
  id: string
  organizationId: string
  name: string
  tradeName: string | null
  personType: CustomerPersonType
  document: string | null
  email: string | null
  phone: string | null
  city: string | null
  notes: string | null
  status: CustomerStatus
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CustomerListItem = Pick<
  Customer,
  'id' | 'name' | 'tradeName' | 'document' | 'city' | 'status' | 'updatedAt'
>

export type CreateCustomerInput = {
  name: string
  tradeName?: string | null
  personType: CustomerPersonType
  document?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  notes?: string | null
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>

export type ListCustomersQuery = {
  q?: string
  status?: CustomerStatus | 'all'
  /** cursor = updated_at ISO + id for stable pagination */
  cursor?: string | null
  limit?: number
  sort?: 'name_asc' | 'updated_desc'
}

export type ListCustomersResult = {
  items: CustomerListItem[]
  nextCursor: string | null
}

export type CustomerRepository = {
  list(
    organizationId: string,
    query: ListCustomersQuery,
  ): Promise<ListCustomersResult>
  getById(organizationId: string, id: string): Promise<Customer | null>
  create(
    organizationId: string,
    userId: string,
    input: CreateCustomerInput,
  ): Promise<Customer>
  update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer>
  archive(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<Customer>
  restore(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<Customer>
}
