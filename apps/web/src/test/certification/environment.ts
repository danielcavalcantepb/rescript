/**
 * Runtime guard for the remote operational-certification harness.
 *
 * Destructive certification is allowed only in explicitly non-production
 * environments. Project references and URLs are intentionally not used as a
 * production heuristic: the declared deployment environment is authoritative.
 */
export type CertificationEnvironment = 'development' | 'homologation' | 'test'

export type CertificationConfig = {
  environment: CertificationEnvironment
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
  databaseUrl: string
}

const permittedEnvironments = new Set<CertificationEnvironment>([
  'development',
  'homologation',
  'test',
])

function required(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`certification_missing_${name.toLowerCase()}`)
  }
  return value.trim()
}

export function getCertificationConfig(
  environment: NodeJS.ProcessEnv = process.env,
): CertificationConfig {
  const declaredEnvironment = (environment.APP_ENV ?? environment.ENVIRONMENT ?? '')
    .trim()
    .toLowerCase()

  if (declaredEnvironment === 'production') {
    throw new Error('certification_forbidden_in_production')
  }

  if (!permittedEnvironments.has(declaredEnvironment as CertificationEnvironment)) {
    throw new Error('certification_environment_must_be_development_or_homologation')
  }

  return {
    environment: declaredEnvironment as CertificationEnvironment,
    supabaseUrl: required(
      'SUPABASE_URL',
      environment.CERTIFICATION_SUPABASE_URL,
    ),
    anonKey: required(
      'SUPABASE_ANON_KEY',
      environment.CERTIFICATION_SUPABASE_ANON_KEY,
    ),
    serviceRoleKey: required(
      'SUPABASE_SERVICE_ROLE_KEY',
      environment.CERTIFICATION_SUPABASE_SERVICE_ROLE_KEY,
    ),
    databaseUrl: required(
      'DATABASE_URL',
      environment.CERTIFICATION_DATABASE_URL,
    ),
  }
}
