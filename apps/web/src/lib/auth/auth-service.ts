import { mapAuthError } from '@rescript/auth'
import { createBrowserSupabaseClient } from '#/lib/supabase/client'

export type LoginResult =
  | { ok: true }
  | { ok: false; message: string }

/** Client-side auth actions — no direct Supabase calls in UI components. */
export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        return { ok: false, message: mapAuthError(error) }
      }

      return { ok: true }
    } catch {
      return {
        ok: false,
        message: 'Não foi possível entrar agora. Tente novamente.',
      }
    }
  },

  async logout(): Promise<void> {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
  },
}
