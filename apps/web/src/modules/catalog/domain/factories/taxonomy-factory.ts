import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'
import { createNamedLabel } from '#/modules/catalog/domain/value-objects/normalized-name'
import type {
  AttributeDefinition,
  AttributeOption,
  AttributeValueType,
  Brand,
  Category,
  IdGenerator,
  OrganizationId,
  UnitOfMeasure,
} from '#/modules/catalog/domain/types'

const NAME_MAX = 120
export const CATEGORY_MAX_DEPTH = 5

export function createBrand(
  organizationId: OrganizationId,
  name: string,
  ids: IdGenerator,
): DomainResult<Brand> {
  const label = createNamedLabel(name, { max: NAME_MAX }, 'Informe a marca.')
  if (!label.ok) return label
  return ok({
    id: ids(),
    organizationId,
    name: label.value.name,
    normalizedName: label.value.normalizedName,
    status: 'active',
  })
}

export function createCategory(
  organizationId: OrganizationId,
  name: string,
  parent: Category | null,
  ids: IdGenerator,
): DomainResult<Category> {
  const label = createNamedLabel(name, { max: NAME_MAX }, 'Informe a categoria.')
  if (!label.ok) return label

  const depth = parent ? parent.depth + 1 : 0
  if (depth > CATEGORY_MAX_DEPTH) {
    return err(
      'category_depth_exceeded',
      `Profundidade máxima de categoria é ${CATEGORY_MAX_DEPTH}.`,
    )
  }

  return ok({
    id: ids(),
    organizationId,
    parentId: parent?.id ?? null,
    name: label.value.name,
    normalizedName: label.value.normalizedName,
    status: 'active',
    depth,
  })
}

export function createAttributeDefinition(
  organizationId: OrganizationId,
  name: string,
  valueType: AttributeValueType,
  optionLabels: string[],
  ids: IdGenerator,
): DomainResult<AttributeDefinition> {
  const label = createNamedLabel(name, { max: NAME_MAX }, 'Informe o atributo.')
  if (!label.ok) return label

  if (valueType === 'option' && optionLabels.length < 1) {
    return err(
      'invariant_violation',
      'Atributo do tipo option exige ao menos uma opção.',
    )
  }

  const definitionId = ids()
  const options: AttributeOption[] = []
  const seen = new Set<string>()

  for (let i = 0; i < optionLabels.length; i++) {
    const optLabel = createNamedLabel(
      optionLabels[i]!,
      { max: NAME_MAX },
      'Informe a opção.',
    )
    if (!optLabel.ok) return optLabel
    if (seen.has(optLabel.value.normalizedName)) {
      return err(
        'invariant_violation',
        'Opção duplicada na definição de atributo.',
      )
    }
    seen.add(optLabel.value.normalizedName)
    options.push({
      id: ids(),
      definitionId,
      label: optLabel.value.name,
      normalizedLabel: optLabel.value.normalizedName,
      status: 'active',
      sortOrder: i,
    })
  }

  return ok({
    id: definitionId,
    organizationId,
    name: label.value.name,
    normalizedName: label.value.normalizedName,
    valueType,
    status: 'active',
    options,
  })
}

export function createUnitOfMeasure(input: {
  organizationId: OrganizationId | null
  code: string
  name: string
  precision: number
  integerOnly?: boolean
  ids: IdGenerator
}): DomainResult<UnitOfMeasure> {
  const code = input.code.trim().toLowerCase()
  if (code.length < 1) {
    return err('invalid_name', 'Informe o código da unidade.')
  }
  if (
    !Number.isInteger(input.precision) ||
    input.precision < 0 ||
    input.precision > 6
  ) {
    return err('invalid_quantity', 'Precisão de UOM deve estar entre 0 e 6.')
  }
  return ok({
    id: input.ids(),
    organizationId: input.organizationId,
    code,
    name: input.name.trim(),
    precision: input.precision,
    integerOnly: input.integerOnly ?? input.precision === 0,
  })
}

/** Platform default UOMs — pure data, no persistence. */
export const PLATFORM_DEFAULT_UOMS: Omit<UnitOfMeasure, 'id'>[] = [
  { organizationId: null, code: 'un', name: 'Unidade', precision: 0, integerOnly: true },
  { organizationId: null, code: 'par', name: 'Par', precision: 0, integerOnly: true },
  { organizationId: null, code: 'cx', name: 'Caixa', precision: 0, integerOnly: true },
  { organizationId: null, code: 'kg', name: 'Quilograma', precision: 3, integerOnly: false },
  { organizationId: null, code: 'g', name: 'Grama', precision: 0, integerOnly: true },
  { organizationId: null, code: 'l', name: 'Litro', precision: 3, integerOnly: false },
  { organizationId: null, code: 'ml', name: 'Mililitro', precision: 0, integerOnly: true },
  { organizationId: null, code: 'm', name: 'Metro', precision: 3, integerOnly: false },
]
