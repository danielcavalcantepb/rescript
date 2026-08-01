type RpcClient = { rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }> }

/** Server-only pull worker. A scheduler invokes this; it never runs in a browser. */
export async function claimProvisioningJob(workerId: string) {
  const { createServiceRoleSupabaseClient } = await import('#/lib/supabase/service-role.server')
  const client = createServiceRoleSupabaseClient() as unknown as RpcClient
  const { data, error } = await client.rpc('cap_claim_provisioning_job', { p_worker_id: workerId })
  if (error) throw new Error(error.message)
  return data
}

export async function runOneProvisioningJob(workerId: string) {
  const claimed = await claimProvisioningJob(workerId) as { activationId?: string } | null
  if (!claimed?.activationId) return null
  const { createServiceRoleSupabaseClient } = await import('#/lib/supabase/service-role.server')
  const client = createServiceRoleSupabaseClient() as unknown as RpcClient
  const { data, error } = await client.rpc('cap_execute_provisioning', { p_activation_public_id: claimed.activationId })
  if (error) {
    const retry = await client.rpc('cap_schedule_provisioning_retry', {
      p_activation_public_id: claimed.activationId,
      p_error_code: 'worker_execution_failed',
      p_error_message: error.message,
    })
    if (retry.error) throw new Error(`${error.message}; retry scheduling failed: ${retry.error.message}`)
    return retry.data
  }
  return data
}
