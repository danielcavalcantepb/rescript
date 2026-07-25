/** Audit hook — full audit log table is a future migration. */
export type ProductAuditPort = {
  record(event: {
    action:
      | 'product.created'
      | 'product.updated'
      | 'product.archived'
      | 'product.restored'
    organizationId: string
    productId: string
    actorUserId: string
  }): void
}

export const noopProductAudit: ProductAuditPort = {
  record() {
    /* prepared integration point — do not fake a partial audit log */
  },
}
