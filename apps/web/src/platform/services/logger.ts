type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  // Never log tokens / secrets
  const safe = context ? { ...context } : undefined
  if (safe) {
    delete safe.token
    delete safe.accessToken
    delete safe.refreshToken
    delete safe.password
  }
  const payload = safe ? [message, safe] : [message]
  console[level === 'debug' ? 'log' : level](...payload)
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    emit('error', message, context),
}
