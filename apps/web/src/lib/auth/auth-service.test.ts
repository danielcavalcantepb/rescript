import { beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithPassword = vi.fn()
const signOut = vi.fn()

vi.mock('#/lib/supabase/client', () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      signInWithPassword,
      signOut,
    },
  }),
}))

describe('authService', () => {
  beforeEach(() => {
    vi.resetModules()
    signInWithPassword.mockReset()
    signOut.mockReset()
  })

  it('returns ok on valid login', async () => {
    signInWithPassword.mockResolvedValue({ error: null })
    const { authService } = await import('./auth-service')
    await expect(authService.login('a@b.com', 'secret')).resolves.toEqual({
      ok: true,
    })
  })

  it('maps invalid credentials', async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })
    const { authService } = await import('./auth-service')
    await expect(authService.login('a@b.com', 'wrong')).resolves.toEqual({
      ok: false,
      message: 'E-mail ou senha incorretos.',
    })
  })

  it('handles network failures', async () => {
    signInWithPassword.mockRejectedValue(new Error('fetch failed'))
    const { authService } = await import('./auth-service')
    await expect(authService.login('a@b.com', 'secret')).resolves.toEqual({
      ok: false,
      message: 'Não foi possível entrar agora. Tente novamente.',
    })
  })

  it('logs out via supabase', async () => {
    signOut.mockResolvedValue({ error: null })
    const { authService } = await import('./auth-service')
    await authService.logout()
    expect(signOut).toHaveBeenCalledOnce()
  })
})
