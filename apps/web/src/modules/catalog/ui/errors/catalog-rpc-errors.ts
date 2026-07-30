import type { CatalogRpcError, CatalogRpcErrorCode } from '#/modules/catalog/ui/api/contracts'

const SAFE_MESSAGES: Record<CatalogRpcErrorCode, string> = {
  validation: 'Verifique os campos do formulário.',
  conflict: 'Já existe um registro incompatível com estes dados.',
  not_found: 'Produto não encontrado.',
  forbidden: 'Você não tem permissão para esta ação.',
  unauthenticated: 'Sessão expirada. Faça login novamente.',
  unavailable: 'Catálogo temporariamente indisponível.',
  unexpected: 'Não foi possível concluir a operação. Tente novamente.',
}

export function catalogErrorMessage(error: CatalogRpcError): string {
  if (error.message && error.code === 'validation') return error.message
  if (error.message && error.code === 'conflict') {
    // Only allow known safe conflict messages from the application layer.
    const allowed = new Set([
      'Já existe um SKU com este código.',
      'Já existe um código de barras com este valor.',
      'Já existe um registro incompatível com estes dados.',
      'Restaure o produto para rascunho antes de publicar novamente.',
      'Esta transição de ciclo de vida não é permitida no estado atual.',
      'Produto simples não aceita variantes adicionais.',
      'Não é possível arquivar a única variante de produto simples.',
      'Produto deve manter ao menos uma variante não arquivada.',
      'Não é possível remover um eixo usado por variantes ativas ou em rascunho.',
      'Não é possível remover uma opção usada por variantes ativas ou em rascunho.',
      'Para o primeiro eixo, use a aplicação da matriz de combinações.',
      'Selecione ao menos uma combinação para criar, ou preserve variantes existentes.',
      'Variante ativa exige SKU e UOM.',
      'Variante ativa exige preço na lista padrão.',
    ])
    if (allowed.has(error.message)) return error.message
  }
  return SAFE_MESSAGES[error.code]
}

export function isCatalogRpcError(value: unknown): value is CatalogRpcError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  )
}

/** Map application / gateway failures to a safe client contract. */
export function toCatalogRpcError(error: unknown): CatalogRpcError {
  if (isCatalogRpcError(error)) return error

  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message : 'unexpected'

  if (name === 'CatalogValidationError' && error instanceof Error) {
    const fieldErrors =
      'fieldErrors' in error &&
      typeof (error as { fieldErrors?: unknown }).fieldErrors === 'object'
        ? ((error as { fieldErrors: Record<string, string> }).fieldErrors ?? {})
        : {}
    return {
      code: 'validation',
      message: SAFE_MESSAGES.validation,
      fieldErrors,
    }
  }

  if (message === 'product_archived') {
    return {
      code: 'forbidden',
      message: 'Produto arquivado não pode ser editado.',
    }
  }
  if (message === 'restore_required_before_publish') {
    return {
      code: 'conflict',
      message:
        'Restaure o produto para rascunho antes de publicar novamente.',
    }
  }
  if (message === 'invalid_lifecycle_action') {
    return {
      code: 'conflict',
      message: 'Esta transição de ciclo de vida não é permitida no estado atual.',
    }
  }
  if (name === 'CatalogPermissionError' || message === 'permission_denied') {
    return { code: 'forbidden', message: SAFE_MESSAGES.forbidden }
  }
  if (message === 'unit_of_measure_not_found') {
    return {
      code: 'validation',
      message: SAFE_MESSAGES.validation,
      fieldErrors: { unitOfMeasureId: 'Unidade de medida inválida.' },
    }
  }
  if (message === 'product_name_and_unit_required') {
    return {
      code: 'validation',
      message: 'Informe o nome e a unidade do produto.',
      fieldErrors: { name: 'Informe o nome.', unitOfMeasureId: 'Selecione uma unidade válida.' },
    }
  }
  if (message === 'at_least_one_variant_required') {
    return { code: 'validation', message: 'Adicione ao menos uma variante.' }
  }
  if (message === 'variant_sku_required') {
    return { code: 'validation', message: 'Informe o SKU de cada variante.' }
  }
  if (message === 'initial_price_required') {
    return { code: 'validation', message: 'Informe um preço de venda válido para cada variante.' }
  }
  if (message === 'valid_branch_required') {
    return { code: 'validation', message: 'Selecione uma filial ativa para o estoque inicial.' }
  }
  if (message === 'valid_stock_location_required') {
    return { code: 'validation', message: 'Selecione um local de estoque ativo para o saldo inicial.' }
  }
  if (message === 'initial_quantity_invalid') {
    return { code: 'validation', message: 'A quantidade inicial não pode ser negativa.' }
  }
  if (message === 'initial_unit_cost_invalid') {
    return { code: 'validation', message: 'Informe um custo inicial válido.' }
  }
  if (message === 'invalid_variant_attribute_assignment') {
    return { code: 'validation', message: 'Revise os atributos informados em cada variante.' }
  }
  if (message === 'invalid_ncm') {
    return { code: 'validation', message: 'O NCM deve possuir oito dígitos.' }
  }
  if (message === 'brand_not_found') {
    return {
      code: 'validation',
      message: SAFE_MESSAGES.validation,
      fieldErrors: { brandId: 'Marca inválida.' },
    }
  }
  if (message === 'category_not_found') {
    return {
      code: 'validation',
      message: SAFE_MESSAGES.validation,
      fieldErrors: { primaryCategoryId: 'Categoria inválida.' },
    }
  }
  if (
    name === 'CatalogNotFoundError' ||
    message === 'product_not_found' ||
    message.endsWith('_not_found')
  ) {
    return { code: 'not_found', message: SAFE_MESSAGES.not_found }
  }
  if (name === 'CatalogConflictError' && error instanceof Error) {
    return {
      code: 'conflict',
      message: error.message || SAFE_MESSAGES.conflict,
    }
  }
  if (
    name === 'CatalogDomainRuleError' ||
    message.includes('conflict') ||
    message.includes('duplicate')
  ) {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : message
    const friendly =
      code === 'duplicate_sku' || code.includes('sku')
        ? 'Já existe um SKU com este código.'
        : code.includes('barcode')
          ? 'Já existe um código de barras com este valor.'
          : error instanceof Error && error.message
            ? error.message
            : SAFE_MESSAGES.conflict
    return { code: 'conflict', message: friendly }
  }
  if (message === 'not_authenticated') {
    return { code: 'unauthenticated', message: SAFE_MESSAGES.unauthenticated }
  }
  if (
    message === 'not_org_member' ||
    message === 'organization_mismatch' ||
    message === 'actor_mismatch'
  ) {
    return { code: 'forbidden', message: SAFE_MESSAGES.forbidden }
  }
  if (message === 'catalog_database_unavailable') {
    return { code: 'unavailable', message: SAFE_MESSAGES.unavailable }
  }

  return { code: 'unexpected', message: SAFE_MESSAGES.unexpected }
}
