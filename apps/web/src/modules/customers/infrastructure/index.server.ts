import '#/modules/customers/infrastructure/assert-server-only'

export type { CustomerReposOptions } from '#/modules/customers/infrastructure/client-options'
export {
  createSupabaseCustomerRepos,
  type SupabaseCustomerRepos,
} from '#/modules/customers/infrastructure/create-supabase-customer-repos'
