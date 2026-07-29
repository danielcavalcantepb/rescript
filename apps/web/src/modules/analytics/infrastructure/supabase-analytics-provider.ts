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
  const id = toString(row.sales_order_id)
  const date = toString(row.confirmed_at)
  if (!id || !date) return null
  return {
    id,
    source: 'sales',
    date,
    amount: toNumber(row.revenue),
    status: 'confirmed',
    customerName: toString(row.customer_name),
    customerId: toString(row.customer_id),
    sellerId: toString(row.seller_user_id),
    branchId: toString(row.branch_id),
    origin: 'sales',
  }
}

function mapReceivable(row: Row): AnalyticsRecord | null {
  const id = toString(row.receivable_id)
  const date = toString(row.due_date)
  if (!id || !date) return null
  return {
    id,
    source: 'receivables',
    date,
    amount: toNumber(row.open_amount),
    status: toString(row.status),
    customerId: toString(row.customer_id),
    origin: 'receivable',
  }
}

function mapPayable(row: Row): AnalyticsRecord | null {
  const id = toString(row.payable_id)
  const date = toString(row.due_date)
  if (!id || !date) return null
  return {
    id,
    source: 'payables',
    date,
    amount: toNumber(row.open_amount),
    status: toString(row.status),
    supplierId: toString(row.supplier_id),
    origin: 'payable',
  }
}

function mapInventory(row: Row, generatedAt: string): AnalyticsRecord {
  return {
    id: String(row.inventory_item_id),
    source: 'inventory',
    date: generatedAt,
    quantity: toNumber(row.qty_available),
    status: toString(row.status),
    productId: toString(row.product_id),
    origin: 'inventory',
  }
}

function mapCustomer(row: Row): AnalyticsRecord | null {
  const id = toString(row.customer_id)
  const date = toString(row.created_at)
  if (!id || !date) return null
  return {
    id,
    source: 'customers',
    date,
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
            'analytics_sales_order_fact',
            'sales_order_id,confirmed_at,revenue,customer_id,customer_name,seller_user_id,branch_id',
            organizationId,
            'confirmed_at',
          ),
        ),
        safeRead(sourceIssues, 'Accounts Receivable', () =>
          readRows(
            client,
            'analytics_receivable_open_fact',
            'receivable_id,status,due_date,open_amount,customer_id',
            organizationId,
            'due_date',
          ),
        ),
        safeRead(sourceIssues, 'Accounts Payable', () =>
          readRows(
            client,
            'analytics_payable_open_fact',
            'payable_id,status,due_date,open_amount,supplier_id',
            organizationId,
            'due_date',
          ),
        ),
        safeRead(sourceIssues, 'Inventory', () =>
          readRows(
            client,
            'analytics_inventory_preparation_fact',
            'inventory_item_id,status,product_id,qty_available',
            organizationId,
          ),
        ),
        safeRead(sourceIssues, 'Customers', () =>
          readRows(
            client,
            'analytics_customer_fact',
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
          ...receivables.map(mapReceivable).filter((record): record is AnalyticsRecord => Boolean(record)),
          ...payables.map(mapPayable).filter((record): record is AnalyticsRecord => Boolean(record)),
          ...inventory.map((row) => mapInventory(row, generatedAt)),
          ...customers.map(mapCustomer).filter((record): record is AnalyticsRecord => Boolean(record)),
        ],
        sourceIssues,
      }
    },
  }
}
