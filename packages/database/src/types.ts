/**
 * Domain aliases over CLI-generated Database types.
 * Do not hand-edit `generated.ts` — regenerate with `npm run db:types`.
 */
import type { Tables } from './generated'

export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from './generated'

/** CHECK-constrained unions (Postgres text + check; not PG enums). */
export type OrganizationStatus = 'active' | 'suspended' | 'canceled'
export type MembershipStatus = 'active' | 'suspended' | 'removed'
export type MembershipRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'seller'
  | 'inventory'
  | 'finance'
  | 'viewer'
export type CustomerStatus = 'active' | 'inactive'
export type CustomerPersonType = 'PF' | 'PJ'
export type ProductStatus = 'active' | 'inactive'

export type OrganizationRow = Omit<Tables<'organization'>, 'status'> & {
  status: OrganizationStatus
}

export type MembershipRow = Omit<Tables<'membership'>, 'status' | 'role'> & {
  status: MembershipStatus
  role: MembershipRole
}

export type CustomerRow = Omit<
  Tables<'customer'>,
  'status' | 'person_type'
> & {
  status: CustomerStatus
  person_type: CustomerPersonType
}

export type ProductRow = Omit<Tables<'product'>, 'status'> & {
  status: ProductStatus
}
