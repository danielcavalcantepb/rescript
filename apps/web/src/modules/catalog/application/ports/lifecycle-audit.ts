export type CatalogLifecycleAction =
  | 'publish'
  | 'archive'
  | 'restore'
  | 'deactivate'

export type CatalogLifecycleAuditRecord = {
  id: string
  organizationId: string
  productId: string
  fromStatus: string
  toStatus: string
  action: CatalogLifecycleAction
  reason: string | null
  actorUserId: string
  occurredAt: string
}

export type CatalogLifecycleAuditAppendInput = {
  organizationId: string
  productId: string
  fromStatus: string
  toStatus: string
  action: CatalogLifecycleAction
  reason: string | null
  actorUserId: string
  occurredAt: string
}

/** Append-only lifecycle audit — never update/delete. */
export type CatalogLifecycleAuditPort = {
  append(input: CatalogLifecycleAuditAppendInput): Promise<void>
  listByProduct(
    organizationId: string,
    productId: string,
  ): Promise<CatalogLifecycleAuditRecord[]>
}

export function createInMemoryLifecycleAudit(): CatalogLifecycleAuditPort & {
  records: CatalogLifecycleAuditRecord[]
} {
  const records: CatalogLifecycleAuditRecord[] = []
  let n = 0
  return {
    records,
    async append(input) {
      n += 1
      records.push({
        id: `audit-${n}`,
        ...input,
      })
    },
    async listByProduct(organizationId, productId) {
      return records
        .filter(
          (r) =>
            r.organizationId === organizationId && r.productId === productId,
        )
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    },
  }
}
