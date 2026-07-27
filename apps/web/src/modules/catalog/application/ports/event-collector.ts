import type { CatalogDomainEvent } from '#/modules/catalog/domain/events'

/** Collects domain events internally — no external publish in Phase 3A. */
export type CatalogEventCollector = {
  append(events: readonly CatalogDomainEvent[]): void
  drain(): CatalogDomainEvent[]
  peek(): readonly CatalogDomainEvent[]
}

export function createInMemoryEventCollector(): CatalogEventCollector {
  const buffer: CatalogDomainEvent[] = []
  return {
    append(events) {
      buffer.push(...events)
    },
    drain() {
      return buffer.splice(0, buffer.length)
    },
    peek() {
      return buffer
    },
  }
}
