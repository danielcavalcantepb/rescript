export function throwIfSupabaseError(
  error: { message?: string; code?: string } | null,
): void {
  if (error) {
    throw new Error(error.message ?? error.code ?? 'supabase_error')
  }
}
