import { mapAuthError, buildAuthNameMetadata } from '@rescript/auth'
import { createBrowserSupabaseClient } from '#/lib/supabase/client'

export type LoginResult =
  | { ok: true }
  | { ok: false; message: string }

export type UpdateProfileNameResult =
  | { ok: true; fullName: string }
  | { ok: false; message: string }

export type SignupResult =
  | { ok: true; userId: string }
  | { ok: false; message: string }

/** Client-side auth actions — no direct Supabase calls in UI components. */
export const authService = {
  async signup(email: string, password: string, fullName: string): Promise<SignupResult> {
    try {
      const supabase = createBrowserSupabaseClient()
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: buildAuthNameMetadata(fullName) },
      })
      if (error || !data.user) {
        return { ok: false, message: 'Já existe uma conta associada a este e-mail. Entre na plataforma ou recupere sua senha.' }
      }
      return { ok: true, userId: data.user.id }
    } catch {
      return { ok: false, message: 'Não foi possível criar a conta agora. Tente novamente.' }
    }
  },

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

  /**
   * Persists human identity on the authenticated user via user_metadata.
   * Uses supabase.auth.updateUser — never service_role, never app_metadata.
   */
  async updateProfileName(fullName: string): Promise<UpdateProfileNameResult> {
    try {
      let metadata: { full_name: string; display_name: string }
      try {
        metadata = buildAuthNameMetadata(fullName)
      } catch {
        return {
          ok: false,
          message: 'Informe seu nome completo (mínimo 2 caracteres).',
        }
      }

      const supabase = createBrowserSupabaseClient()
      const { data, error } = await supabase.auth.updateUser({
        data: metadata,
      })

      if (error) {
        return { ok: false, message: mapAuthError(error) }
      }

      if (!data.user) {
        return {
          ok: false,
          message: 'Não foi possível salvar seu nome. Tente novamente.',
        }
      }

      return { ok: true, fullName: metadata.full_name }
    } catch {
      return {
        ok: false,
        message: 'Não foi possível salvar seu nome. Tente novamente.',
      }
    }
  },
}
