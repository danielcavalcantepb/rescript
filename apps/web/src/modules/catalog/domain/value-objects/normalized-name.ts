import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'

/** Display name + normalized form for uniqueness (Brand, Category, Attributes). */
export type NamedLabel = {
  readonly name: string
  readonly normalizedName: string
}

export function normalizeName(raw: string): string {
  return raw
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function createNamedLabel(
  raw: string,
  limits: { min?: number; max: number },
  emptyMessage: string,
): DomainResult<NamedLabel> {
  const name = raw.trim().replace(/\s+/g, ' ')
  const min = limits.min ?? 1
  if (name.length < min) {
    return err('invalid_name', emptyMessage)
  }
  if (name.length > limits.max) {
    return err(
      'invalid_name',
      `Nome deve ter no máximo ${limits.max} caracteres.`,
    )
  }
  return ok({ name, normalizedName: normalizeName(name) })
}
