import '#/modules/receiving/infrastructure/assert-server-only'
import type { GoodsReceiptPostPort } from '#/modules/receiving/application/ports'
import type { GoodsReceipt } from '#/modules/receiving/domain/types'
import type { ReceivingReposOptions } from '#/modules/receiving/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/receiving/infrastructure/errors'
import { mapGoodsReceipt } from '#/modules/receiving/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/receiving/infrastructure/tenant-context'

export class SupabaseGoodsReceiptPostPort implements GoodsReceiptPostPort {
  constructor(private readonly options: ReceivingReposOptions) {}

  async post(
    organizationId: string,
    input: Parameters<GoodsReceiptPostPort['post']>[1],
  ): Promise<GoodsReceipt> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client.rpc('post_goods_receipt', {
      p_organization_id: this.options.organizationId,
      p_goods_receipt_id: input.goodsReceiptId,
      p_idempotency_key: input.idempotencyKey,
      p_allow_over_receive: input.allowOverReceive ?? false,
    })
    throwIfSupabaseError(error)
    if (!data) throw new Error('post_goods_receipt_failed')
    return mapGoodsReceipt(data)
  }
}
