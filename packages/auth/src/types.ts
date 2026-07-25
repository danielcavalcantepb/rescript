/** Auth identity from Supabase — not a domain User / Membership. */
export type AuthUser = {
  id: string
  email: string
  displayName: string
}

export type AuthSessionSnapshot = {
  user: AuthUser | null
  isAuthenticated: boolean
}
