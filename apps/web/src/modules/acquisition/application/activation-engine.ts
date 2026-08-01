export const activationStates = [
  'pending', 'validating', 'validated', 'subscription_creating',
  'subscription_created', 'provisioning_queued', 'provisioning_running',
  'completed', 'failed', 'retry_scheduled', 'dead_lettered', 'cancelled',
] as const

export type ActivationState = (typeof activationStates)[number]

const activationTransitions: Readonly<Record<ActivationState, readonly ActivationState[]>> = {
  pending: ['validating', 'cancelled'], validating: ['validated', 'failed'],
  validated: ['subscription_creating'], subscription_creating: ['subscription_created', 'failed'],
  subscription_created: ['provisioning_queued'], provisioning_queued: ['provisioning_running', 'failed'],
  provisioning_running: ['completed', 'retry_scheduled', 'failed'], completed: [],
  failed: ['retry_scheduled', 'dead_lettered'], retry_scheduled: ['provisioning_queued', 'dead_lettered'],
  dead_lettered: [], cancelled: [],
}

export function canTransitionActivation(current: ActivationState, next: ActivationState) {
  return activationTransitions[current].includes(next)
}

export const provisioningJobStates = ['queued', 'claimed', 'running', 'completed', 'retry_scheduled', 'failed', 'dead_lettered', 'cancelled'] as const
export type ProvisioningJobState = (typeof provisioningJobStates)[number]
const provisioningTransitions: Readonly<Record<ProvisioningJobState, readonly ProvisioningJobState[]>> = {
  queued: ['claimed', 'cancelled'], claimed: ['running', 'queued'], running: ['completed', 'retry_scheduled', 'failed'],
  completed: [], retry_scheduled: ['claimed', 'dead_lettered'], failed: ['retry_scheduled', 'dead_lettered'], dead_lettered: [], cancelled: [],
}
export function canTransitionProvisioningJob(current: ProvisioningJobState, next: ProvisioningJobState) {
  return provisioningTransitions[current].includes(next)
}

export const retryDelaysMs = [0, 60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000] as const
export function isRecoverableProvisioningError(code: string) {
  return ['timeout', 'connection_reset', 'deadlock_detected', 'temporary_unavailable'].includes(code)
}
