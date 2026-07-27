import type { CatalogRpcError, CatalogRpcResult } from '#/modules/catalog/ui/api/contracts'
import { catalogErrorMessage } from '#/modules/catalog/ui/errors/catalog-rpc-errors'

export class CatalogRpcClientError extends Error {
  readonly rpc: CatalogRpcError

  constructor(rpc: CatalogRpcError) {
    super(catalogErrorMessage(rpc))
    this.name = 'CatalogRpcClientError'
    this.rpc = rpc
  }
}

export function unwrapCatalogRpc<T>(result: CatalogRpcResult<T>): T {
  if (!result.ok) throw new CatalogRpcClientError(result.error)
  return result.data
}

export function getCatalogRpcError(error: unknown): CatalogRpcError | null {
  if (error instanceof CatalogRpcClientError) return error.rpc
  return null
}
