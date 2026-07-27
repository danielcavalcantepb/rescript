import type {
  AttributeIdCommand,
  AttributeResponse,
  AttributeValueIdCommand,
  CreateAttributeCommand,
  CreateAttributeValueCommand,
  UpdateAttributeCommand,
  UpdateAttributeValueCommand,
} from '#/modules/catalog/application/dto'
import {
  CatalogConflictError,
  CatalogNotFoundError,
  CatalogPermissionError,
  throwIfDomainError,
} from '#/modules/catalog/application/errors'
import {
  requireAttributeRead,
  requireAttributeWrite,
  type CatalogAppDeps,
} from '#/modules/catalog/application/deps'
import { toAttributeResponse } from '#/modules/catalog/application/mappers'
import { createAttributeDefinition } from '#/modules/catalog/domain/factories/taxonomy-factory'
import { createNamedLabel } from '#/modules/catalog/domain/value-objects/normalized-name'

async function assertNameAvailable(
  deps: CatalogAppDeps,
  normalizedName: string,
  exceptId?: string,
) {
  const existing = await deps.attributes.findByNormalizedName(
    deps.organizationId,
    normalizedName,
  )
  if (existing && existing.id !== exceptId) {
    throw new CatalogConflictError('attribute_name_conflict')
  }
}

async function assertNotUsed(
  deps: CatalogAppDeps,
  attributeId: string,
  optionId?: string,
) {
  const products = await deps.products.listByOrganization(deps.organizationId)
  const used = products.some(
    (product) =>
      (!optionId &&
        product.axes.some(
          (axis) => axis.attributeDefinitionId === attributeId,
        )) ||
      product.variants.some((variant) =>
        variant.attributeValues.some(
          (value) =>
            value.attributeDefinitionId === attributeId &&
            (!optionId || value.optionId === optionId),
        ),
      ),
  )
  if (used) throw new CatalogConflictError('attribute_in_use')
}

export async function listAttributes(
  deps: CatalogAppDeps,
): Promise<AttributeResponse[]> {
  if (!requireAttributeRead(deps.can)) throw new CatalogPermissionError()
  const attributes = await deps.attributes.listByOrganization(
    deps.organizationId,
  )
  return attributes
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.name.localeCompare(b.name, 'pt-BR'),
    )
    .map(toAttributeResponse)
}

export async function getAttribute(
  deps: CatalogAppDeps,
  command: AttributeIdCommand,
): Promise<AttributeResponse> {
  if (!requireAttributeRead(deps.can)) throw new CatalogPermissionError()
  const attribute = await deps.attributes.getById(
    deps.organizationId,
    command.attributeId,
  )
  if (!attribute) throw new CatalogNotFoundError('attribute_not_found')
  return toAttributeResponse(attribute)
}

export async function createAttribute(
  deps: CatalogAppDeps,
  command: CreateAttributeCommand,
): Promise<AttributeResponse> {
  if (!requireAttributeWrite(deps.can)) throw new CatalogPermissionError()
  if (command.isVariantAxis && command.valueType !== 'option') {
    throw new CatalogConflictError('variant_axis_requires_option')
  }
  const attribute = throwIfDomainError(
    createAttributeDefinition(
      deps.organizationId,
      command.name,
      command.valueType,
      command.options ?? [],
      () => deps.ids.next(),
    ),
  )
  await assertNameAvailable(deps, attribute.normalizedName)
  attribute.isVariantAxis =
    command.isVariantAxis ?? attribute.valueType === 'option'
  attribute.isFilterable = command.isFilterable ?? true
  attribute.sortOrder = command.sortOrder ?? 0
  await deps.attributes.save(attribute)
  return toAttributeResponse(attribute)
}

export async function updateAttribute(
  deps: CatalogAppDeps,
  command: UpdateAttributeCommand,
): Promise<AttributeResponse> {
  if (!requireAttributeWrite(deps.can)) throw new CatalogPermissionError()
  const attribute = await deps.attributes.getById(
    deps.organizationId,
    command.attributeId,
  )
  if (!attribute) throw new CatalogNotFoundError('attribute_not_found')
  if (command.isVariantAxis && attribute.valueType !== 'option') {
    throw new CatalogConflictError('variant_axis_requires_option')
  }
  const label = throwIfDomainError(
    createNamedLabel(command.name, { max: 120 }, 'Informe o atributo.'),
  )
  await assertNameAvailable(deps, label.normalizedName, attribute.id)
  const next = {
    ...attribute,
    name: label.name,
    normalizedName: label.normalizedName,
    isVariantAxis: command.isVariantAxis ?? attribute.isVariantAxis ?? false,
    isFilterable: command.isFilterable ?? attribute.isFilterable ?? true,
    sortOrder: command.sortOrder ?? attribute.sortOrder ?? 0,
  }
  await deps.attributes.save(next)
  return toAttributeResponse(next)
}

export async function archiveAttribute(
  deps: CatalogAppDeps,
  command: AttributeIdCommand,
): Promise<AttributeResponse> {
  if (!requireAttributeWrite(deps.can)) throw new CatalogPermissionError()
  const attribute = await deps.attributes.getById(
    deps.organizationId,
    command.attributeId,
  )
  if (!attribute) throw new CatalogNotFoundError('attribute_not_found')
  await assertNotUsed(deps, attribute.id)
  const next = { ...attribute, status: 'archived' as const }
  await deps.attributes.save(next)
  return toAttributeResponse(next)
}

export async function createAttributeValue(
  deps: CatalogAppDeps,
  command: CreateAttributeValueCommand,
): Promise<AttributeResponse> {
  if (!requireAttributeWrite(deps.can)) throw new CatalogPermissionError()
  const attribute = await deps.attributes.getById(
    deps.organizationId,
    command.attributeId,
  )
  if (!attribute) throw new CatalogNotFoundError('attribute_not_found')
  if (attribute.valueType !== 'option') {
    throw new CatalogConflictError('attribute_does_not_accept_values')
  }
  const label = throwIfDomainError(
    createNamedLabel(command.label, { max: 120 }, 'Informe o valor.'),
  )
  if (
    attribute.options.some(
      (option) =>
        option.normalizedLabel === label.normalizedName &&
        option.status === 'active',
    )
  ) {
    throw new CatalogConflictError('attribute_value_conflict')
  }
  const next = {
    ...attribute,
    options: [
      ...attribute.options,
      {
        id: deps.ids.next(),
        definitionId: attribute.id,
        label: label.name,
        normalizedLabel: label.normalizedName,
        sortOrder: command.sortOrder ?? attribute.options.length,
        status: 'active' as const,
      },
    ],
  }
  await deps.attributes.save(next)
  return toAttributeResponse(next)
}

export async function updateAttributeValue(
  deps: CatalogAppDeps,
  command: UpdateAttributeValueCommand,
): Promise<AttributeResponse> {
  if (!requireAttributeWrite(deps.can)) throw new CatalogPermissionError()
  const attribute = await deps.attributes.getById(
    deps.organizationId,
    command.attributeId,
  )
  if (!attribute) throw new CatalogNotFoundError('attribute_not_found')
  const current = attribute.options.find(
    (option) => option.id === command.valueId,
  )
  if (!current) throw new CatalogNotFoundError('attribute_value_not_found')
  const label = throwIfDomainError(
    createNamedLabel(command.label, { max: 120 }, 'Informe o valor.'),
  )
  if (
    attribute.options.some(
      (option) =>
        option.id !== current.id &&
        option.normalizedLabel === label.normalizedName &&
        option.status === 'active',
    )
  ) {
    throw new CatalogConflictError('attribute_value_conflict')
  }
  const next = {
    ...attribute,
    options: attribute.options.map((option) =>
      option.id === current.id
        ? {
            ...option,
            label: label.name,
            normalizedLabel: label.normalizedName,
            sortOrder: command.sortOrder ?? option.sortOrder,
          }
        : option,
    ),
  }
  await deps.attributes.save(next)
  return toAttributeResponse(next)
}

export async function archiveAttributeValue(
  deps: CatalogAppDeps,
  command: AttributeValueIdCommand,
): Promise<AttributeResponse> {
  if (!requireAttributeWrite(deps.can)) throw new CatalogPermissionError()
  const attribute = await deps.attributes.getById(
    deps.organizationId,
    command.attributeId,
  )
  if (!attribute) throw new CatalogNotFoundError('attribute_not_found')
  if (!attribute.options.some((option) => option.id === command.valueId)) {
    throw new CatalogNotFoundError('attribute_value_not_found')
  }
  await assertNotUsed(deps, attribute.id, command.valueId)
  const next = {
    ...attribute,
    options: attribute.options.map((option) =>
      option.id === command.valueId
        ? { ...option, status: 'archived' as const }
        : option,
    ),
  }
  await deps.attributes.save(next)
  return toAttributeResponse(next)
}
