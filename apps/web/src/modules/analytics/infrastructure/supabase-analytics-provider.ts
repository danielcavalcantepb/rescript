import './assert-server-only'
import type { AnalyticsProvider } from '../application/ports'
import type { AnalyticsDataset, AnalyticsQuery, AnalyticsRecord } from '../domain/types'

type Row = Record<string, unknown>

type QueryResult = {
  data: Row[] | null
  error: { message: string } | null
}

type ReadQuery = PromiseLike<QueryResult> & {
  eq(column: string, value: unknown): ReadQuery
  gte(column: string, value: unknown): ReadQuery
  lt(column: string, value: unknown): ReadQuery
  order(column: string, options?: { ascending?: boolean }): ReadQuery
  limit(count: number): ReadQuery
}

export type SupabaseAnalyticsReadClient = {
  from(table: string): {
    select(columns: string): ReadQuery
  }
}

export type SupabaseAnalyticsProviderOptions = {
  client: SupabaseAnalyticsReadClient
  organizationId: string
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function toString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length ? value : undefined
}

async function readRows(
  client: SupabaseAnalyticsReadClient,
  table: string,
  columns: string,
  organizationId: string,
  dateColumn?: string,
): Promise<Row[]> {
  let query = client.from(table).select(columns).eq('organization_id', organizationId)
  if (dateColumn) query = query.order(dateColumn, { ascending: false })
  const { data, error } = await query.limit(5000)
  if (error) throw new Error(`${table}: ${error.message}`)
  return data ?? []
}

async function safeRead(
  issues: string[],
  label: string,
  work: () => Promise<Row[]>,
): Promise<Row[]> {
  try {
    return await work()
  } catch (error) {
    issues.push(`${label}: ${error instanceof Error ? error.message : String(error)}`)
    return []
  }
}

function mapSales(row: Row): AnalyticsRecord | null {
  const type = toString(row.aggregate_type)
  const status = toString(row.status)
  if (type !== 'sales_order' || status !== 'confirmed') return null
  return {
    id: String(row.aggregate_id),
    source: 'sales',
    date: toString(row.created_at) ?? new Date(0).toISOString(),
    amount: toNumber(row.grand_total),
    discount: toNumber(row.discount_amount),
    status,
    customerName: toString(row.customer_name),
    customerId: toString(row.customer_id),
    origin: 'sales',
  }
}

function mapReceivable(row: Row): AnalyticsRecord {
  return {
    id: String(row.accounts_receivable_id),
    source: 'receivables',
    date: toString(row.due_date) ?? new Date(0).toISOString(),
    amount: toNumber(row.open_amount),
    status: toString(row.status),
    customerName: toString(row.customer_name),
    customerId: toString(row.customer_id),
    origin: 'receivable',
  }
}

function mapPayable(row: Row): AnalyticsRecord {
  return {
    id: String(row.accounts_payable_id),
    source: 'payables',
    date: toString(row.next_due_date) ?? new Date(0).toISOString(),
    amount: toNumber(row.open_balance),
    status: toString(row.status),
    supplierName: toString(row.supplier_name),
    supplierId: toString(row.supplier_id),
    origin: 'payable',
  }
}

function mapInventory(row: Row, generatedAt: string): AnalyticsRecord {
  return {
    id: String(row.id),
    source: 'inventory',
    date: generatedAt,
    quantity: toNumber(row.qty_on_hand),
    status: toString(row.status),
    productId: toString(row.product_id),
    origin: 'inventory',
  }
}

function mapCustomer(row: Row): AnalyticsRecord {
  return {
    id: String(row.customer_id),
    source: 'customers',
    date: toString(row.created_at) ?? new Date(0).toISOString(),
    status: toString(row.status),
    customerId: toString(row.customer_id),
    customerName: toString(row.name),
    origin: 'customer',
  }
}

export function createSupabaseAnalyticsProvider({
  client,
  organizationId,
}: SupabaseAnalyticsProviderOptions): AnalyticsProvider {
  return {
    async loadDataset(_query: AnalyticsQuery): Promise<AnalyticsDataset> {
      const generatedAt = new Date().toISOString()
      const sourceIssues: string[] = []
      const [sales, receivables, payables, inventory, customers] = await Promise.all([
        safeRead(sourceIssues, 'Sales', () =>
          readRows(
            client,
            'sales_search',
            'aggregate_id,aggregate_type,status,grand_total,discount_amount,customer_id,customer_name,created_at',
            organizationId,
            'created_at',
          ),
        ),
        safeRead(sourceIssues, 'Accounts Receivable', () =>
          readRows(
            client,
            'accounts_receivable_search',
            'accounts_receivable_id,status,due_date,open_amount,customer_id,customer_name',
            organizationId,
            'due_date',
          ),
        ),
        safeRead(sourceIssues, 'Accounts Payable', () =>
          readRows(
            client,
            'accounts_payable_search',
            'accounts_payable_id,status,next_due_date,open_balance,supplier_id,supplier_name',
            organizationId,
            'next_due_date',
          ),
        ),
        safeRead(sourceIssues, 'Inventory', () =>
          readRows(
            client,
            'inventory_item',
            'id,status,product_id,qty_on_hand',
            organizationId,
          ),
        ),
        safeRead(sourceIssues, 'Customers', () =>
          readRows(
            client,
            'customer_search',
            'customer_id,status,name,created_at',
            organizationId,
            'created_at',
          ),
        ),
      ])

      return {
        generatedAt,
        records: [
          ...sales.map(mapSales).filter((record): record is AnalyticsRecord => Boolean(record)),
          ...receivables.map(mapReceivable),
          ...payables.map(mapPayable),
          ...inventory.map((row) => mapInventory(row, generatedAt)),
          ...customers.map(mapCustomer),
        ],
        sourceIssues,
      }
    },
  }
}
