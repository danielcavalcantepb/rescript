export class AnalyticsPermissionError extends Error {
  constructor() {
    super('analytics_permission_denied')
  }
}
