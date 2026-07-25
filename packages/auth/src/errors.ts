/**
 * Maps Supabase Auth errors to safe pt-BR messages.
 * Never reveals whether an e-mail exists.
 */
export function mapAuthError(error: { message?: string; status?: number } | null | undefined): string {
  if (!error?.message) {
    return 'Não foi possível entrar agora. Tente novamente.'
  }

  const message = error.message.toLowerCase()

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials') ||
    message.includes('email not confirmed') ||
    message.includes('user not found')
  ) {
    return 'E-mail ou senha incorretos.'
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'Não foi possível entrar agora. Tente novamente.'
  }

  if (message.includes('rate') || message.includes('too many')) {
    return 'Muitas tentativas. Aguarde um momento e tente novamente.'
  }

  return 'Não foi possível entrar agora. Tente novamente.'
}
