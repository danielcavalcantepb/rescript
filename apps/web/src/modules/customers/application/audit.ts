/** Audit hook — full audit log table is a future migration. */
export type CustomerAuditPort = {
  record(event: {
    action:
      | 'customer.created'
      | 'customer.updated'
      | 'customer.archived'
      | 'customer.restored'
    organizationId: string
    customerId: string
    actorUserId: string
  }): void
}

export const noopCustomerAudit: CustomerAuditPort = {
  record() {
    /* prepared integration point — do not fake a partial audit log */
  },
}
