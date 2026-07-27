export function throwIfSupabaseError(
  error: { message?: string; code?: string } | null,
): void {
  if (error) {
    const err = new Error(error.message ?? error.code ?? 'supabase_error') as Error & {
      code?: string
    }
    err.code = error.code
    throw err
  }
}
