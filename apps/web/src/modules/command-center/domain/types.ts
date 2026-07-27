export type CommandCenterStatus = 'good' | 'attention' | 'critical' | 'unknown'

export type PriorityLevel = 'info' | 'attention' | 'critical'

export type InsightNature = 'fact' | 'projection' | 'recommendation'

export type HealthSignal = {
  id: string
  label: string
  status: CommandCenterStatus
  score: number | null
  description: string
  trend: string
}

export type CommandPriority = {
  id: string
  level: PriorityLevel
  impact: string
  title: string
  description: string
  suggestedAction: string
  href: string
  source: string
}

export type CommandKpi = {
  id: string
  label: string
  value: string
  comparison: string
  variation: string
  period: string
}

export type OperationStage = {
  id: string
  label: string
  quantity: number
  value: string
  status: CommandCenterStatus
  pending: string
  href: string
}

export type FinancialSummary = {
  expectedInToday: string
  expectedOutToday: string
  expectedBalanceToday: string
  overdueReceivables: string
  overduePayables: string
  monthRevenue: string
  monthExpenses: string
  cashFlow: string
}

export type InventorySummary = {
  totalValue: string
  criticalProducts: number
  noMovementProducts: number
  coverage: string
  replenishmentNeeded: number
  negativeItems: number
  abcCurve: string
  turnover: string
}

export type CommercialSummary = {
  revenue: string
  orders: number
  ticket: string
  conversion: string
  newCustomers: number
  recurringCustomers: number
  topCustomers: string[]
  topProducts: string[]
  topCategories: string[]
}

export type CommandInsight = {
  id: string
  nature: InsightNature
  level: PriorityLevel
  title: string
  description: string
  evidence: string
  confidence: string
  href: string
}

export type CommandAlert = {
  id: string
  category: PriorityLevel
  title: string
  description: string
  origin: string
  date: string
  priority: string
  href: string
}

export type DataGap = {
  id: string
  title: string
  description: string
  href: string
}

export type CommandCenterSnapshot = {
  generatedAt: string
  health: HealthSignal[]
  priorities: CommandPriority[]
  kpis: CommandKpi[]
  operation: OperationStage[]
  financial: FinancialSummary
  inventory: InventorySummary
  commercial: CommercialSummary
  insights: CommandInsight[]
  alerts: CommandAlert[]
  dataGaps: DataGap[]
}

export type CommandCenterRawSnapshot = {
  generatedAt: string
  salesTodayValue: number
  salesTodayCount: number
  salesMonthValue: number
  salesMonthCount: number
  salesPreviousMonthValue: number
  quotationsOpenCount: number
  ordersPendingCount: number
  customersActiveCount: number
  customersNewMonthCount: number
  productsCount: number
  variantsCount: number
  inventoryOnHand: number
  inventoryReserved: number
  inventoryItemCount: number
  inventoryCriticalCount: number
  inventoryNegativeCount: number
  inventoryEstimatedValue: number
  receivablesOpenAmount: number
  receivablesPaidAmount: number
  receivablesOverdueAmount: number
  receivablesOverdueCount: number
  receivablesDueTodayAmount: number
  payablesOpenAmount: number
  payablesOverdueAmount: number
  payablesOverdueCount: number
  payablesDueTodayAmount: number
  paymentsMonthAmount: number
  sourceIssues: string[]
}
