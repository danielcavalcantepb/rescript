export class CommandCenterPermissionError extends Error {
  constructor() {
    super('permission_denied')
    this.name = 'CommandCenterPermissionError'
  }
}
