/** Auth identity from Supabase — not a domain User / Membership. */
export type AuthUser = {
  id: string
  email: string
  /** Full resolved human name — never derived from email. */
  displayName: string
  /** First name for greetings — never email local-part. */
  firstName: string
}

export type AuthSessionSnapshot = {
  user: AuthUser | null
  isAuthenticated: boolean
}
