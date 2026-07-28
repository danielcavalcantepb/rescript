export type FiscalContext = {
  organizationId: string
  operationId: string
  taxProfileId: string
  variantId: string
  originState: string
  destinationState: string
}

export type FiscalResolution = {
  cfop: string | null
  cst: string | null
  csosn: string | null
  origin: string | null
  operationId: string
  taxProfileId: string
  variantId: string
}

export function resolveTaxRule(
  context: FiscalContext,
  rules: readonly FiscalResolution[],
): FiscalResolution {
  const matches = rules.filter(
    (rule) =>
      rule.operationId === context.operationId &&
      rule.taxProfileId === context.taxProfileId &&
      rule.variantId === context.variantId,
  )
  if (matches.length === 0) throw new Error('fiscal_rule_not_found')
  if (matches.length > 1) throw new Error('fiscal_rule_ambiguous')
  return matches[0]
}
