/** Safe UI label from auth metadata — not a domain profile. */
export function getAuthDisplayName(input: {
  email?: string | null
  userMetadata?: Record<string, unknown> | null
}): string {
  const meta = input.userMetadata ?? {}
  const fromMeta =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (typeof meta.display_name === 'string' && meta.display_name.trim())

  if (fromMeta) return fromMeta

  const email = input.email?.trim()
  if (email) return email

  return 'Usuário'
}
