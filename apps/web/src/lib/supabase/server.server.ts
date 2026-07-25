import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie, setResponseHeader } from '@tanstack/react-start/server'
import type { Database } from '@rescript/database'

/**
 * Server-only Supabase client for loaders / server functions.
 * Filename `.server.ts` keeps it out of the browser bundle.
 */
export function createServerSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    throw new Error(
      'Supabase não configurado no servidor. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.',
    )
  }

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value,
        }))
      },
      setAll(cookies, headers) {
        cookies.forEach(({ name, value, options }) => {
          setCookie(name, value, options)
        })
        Object.entries(headers).forEach(([name, value]) => {
          setResponseHeader(name, value)
        })
      },
    },
  })
}
