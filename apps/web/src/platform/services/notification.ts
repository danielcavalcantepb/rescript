import { toast } from '#/platform/toast'

/** App-level notification facade — modules use this, never alert(). */
export const notificationService = {
  success: toast.success,
  error: toast.error,
  warning: toast.warning,
  info: toast.info,
  loading: toast.loading,
  promise: toast.promise,
  dismiss: toast.dismiss.bind(toast),
}
