import { beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithPassword = vi.fn()
const signOut = vi.fn()
const updateUser = vi.fn()

vi.mock('#/lib/supabase/client', () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      signInWithPassword,
      signOut,
      updateUser,
    },
  }),
}))

describe('authService', () => {
  beforeEach(() => {
    vi.resetModules()
    signInWithPassword.mockReset()
    signOut.mockReset()
    updateUser.mockReset()
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

  it('persists full_name and display_name via updateUser', async () => {
    updateUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    })
    const { authService } = await import('./auth-service')
    await expect(
      authService.updateProfileName('Daniel Cavalcante'),
    ).resolves.toEqual({
      ok: true,
      fullName: 'Daniel Cavalcante',
    })
    expect(updateUser).toHaveBeenCalledWith({
      data: {
        full_name: 'Daniel Cavalcante',
        display_name: 'Daniel Cavalcante',
      },
    })
  })

  it('rejects empty full name without calling Supabase', async () => {
    const { authService } = await import('./auth-service')
    await expect(authService.updateProfileName(' ')).resolves.toEqual({
      ok: false,
      message: 'Informe seu nome completo (mínimo 2 caracteres).',
    })
    expect(updateUser).not.toHaveBeenCalled()
  })
})
