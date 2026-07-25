/** Audit hook — full audit log table is a future migration. */
export type InventoryAuditPort = {
  record(event: {
    action:
      | 'inventory.entry'
      | 'inventory.exit'
      | 'inventory.adjustment_in'
      | 'inventory.adjustment_out'
    organizationId: string
    productId: string
    movementId: string
    actorUserId: string
  }): void
}

export const noopInventoryAudit: InventoryAuditPort = {
  record() {
    /* prepared integration point — do not fake a partial audit log */
  },
}
