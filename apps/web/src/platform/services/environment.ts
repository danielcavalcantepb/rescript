export const environmentService = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  hasSupabaseConfig: Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  ),
}
