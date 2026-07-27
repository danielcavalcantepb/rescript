import { createServerFn } from '@tanstack/react-start'
import { buildCommandCenterSnapshot } from '#/modules/command-center/domain/rules'
import type {
  CommandCenterRawSnapshot,
  CommandCenterSnapshot,
} from '#/modules/command-center/domain/types'
import type { PermissionKey } from '@rescript/permissions'

export type CommandCenterRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

type ReadRow = Record<string, unknown>

type QueryResult = {
  data: ReadRow[] | null
  error: { message: string } | null
}

type ReadQuery = PromiseLike<QueryResult> & {
  eq(column: string, value: unknown): ReadQuery
  gte(column: string, value: unknown): ReadQuery
  lt(column: string, value: unknown): ReadQuery
  order(column: string, options?: { ascending?: boolean }): ReadQuery
  limit(count: number): ReadQuery
}

type SupabaseReadClient = {
  from(table: string): {
    select(columns: string): ReadQuery
  }
}

async function context(organizationId: string, permission: PermissionKey) {
  const { can, isRolePreset, permissionsForRole } = await import(
    '@rescript/permissions'
  )
  const { createServerSupabaseClient } = await import(
    '#/lib/supabase/server.server'
  )

  const client = createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser()
  if (userError || !user) throw new Error('not_authenticated')

  const { data: membership, error: membershipError } = await client
    .from('membership')
    .select('role,status')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membership || !isRolePreset(membership.role)) {
    throw new Error('not_org_member')
  }

  if (!can(permissionsForRole(membership.role), permission)) {
    throw new Error('permission_denied')
  }

  return client as unknown as SupabaseReadClient
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function previousMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1)
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function sum(rows: ReadRow[], column: string): number {
  return rows.reduce((total, row) => total + toNumber(row[column]), 0)
}

async function readRows(
  client: SupabaseReadClient,
  table: string,
  columns: string,
  build: (query: ReadQuery) => ReadQuery,
): Promise<ReadRow[]> {
  const query = build(client.from(table).select(columns))
  const { data, error } = await query
  if (error) throw new Error(`${table}: ${error.message}`)
  return data ?? []
}

async function readSource(
  sourceIssues: string[],
  label: string,
  work: () => Promise<ReadRow[]>,
): Promise<ReadRow[]> {
  try {
    return await work()
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    sourceIssues.push(`${label}: ${detail}`)
    return []
  }
}

function sameDate(value: unknown, date: string): boolean {
  return typeof value === 'string' && value.slice(0, 10) === date
}

function beforeDate(value: unknown, date: string): boolean {
  return typeof value === 'string' && value.slice(0, 10) < date
}

function betweenIso(value: unknown, from: string, to: string): boolean {
  return typeof value === 'string' && value >= from && value < to
}

async function loadRawSnapshot(
  organizationId: string,
): Promise<CommandCenterRawSnapshot> {
  const client = await context(organizationId, 'insights.view')
  const now = new Date()
  const today = toDateOnly(now)
  const todayStart = startOfDay(now).toISOString()
  const tomorrowStart = addDays(startOfDay(now), 1).toISOString()
  const monthStart = startOfMonth(now).toISOString()
  const previousStart = previousMonthStart(now).toISOString()
  const sourceIssues: string[] = []

  const [
    sales,
    receivables,
    payables,
    payments,
    inventory,
    products,
    variants,
    customers,
  ] = await Promise.all([
    readSource(sourceIssues, 'Sales', () =>
      readRows(
        client,
        'sales_search',
        'aggregate_id,aggregate_type,status,grand_total,created_at',
        (query) =>
          query
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(1000),
      ),
    ),
    readSource(sourceIssues, 'Accounts Receivable', () =>
      readRows(
        client,
        'accounts_receivable_search',
        'accounts_receivable_id,status,due_date,total_amount,open_amount,paid_amount',
        (query) =>
          query
            .eq('organization_id', organizationId)
            .order('due_date', { ascending: true })
            .limit(1000),
      ),
    ),
    readSource(sourceIssues, 'Accounts Payable', () =>
      readRows(
        client,
        'accounts_payable_search',
        'accounts_payable_id,status,next_due_date,original_amount,open_balance',
        (query) =>
          query
            .eq('organization_id', organizationId)
            .order('next_due_date', { ascending: true })
            .limit(1000),
      ),
    ),
    readSource(sourceIssues, 'Payments', () =>
      readRows(
        client,
        'payment_search',
        'payment_id,status,net_amount,paid_at',
        (query) =>
          query
            .eq('organization_id', organizationId)
            .order('paid_at', { ascending: false })
            .limit(1000),
      ),
    ),
    readSource(sourceIssues, 'Inventory', () =>
      readRows(
        client,
        'inventory_item',
        'id,status,qty_on_hand,qty_reserved',
        (query) =>
          query
            .eq('organization_id', organizationId)
            .eq('status', 'active')
            .limit(1000),
      ),
    ),
    readSource(sourceIssues, 'Products', () =>
      readRows(client, 'product', 'id,status,created_at', (query) =>
        query.eq('organization_id', organizationId).limit(1000),
      ),
    ),
    readSource(sourceIssues, 'Variants', () =>
      readRows(client, 'product_variant', 'id,status,created_at', (query) =>
        query.eq('organization_id', organizationId).limit(1000),
      ),
    ),
    readSource(sourceIssues, 'Customers', () =>
      readRows(client, 'customer_search', 'customer_id,status,created_at', (query) =>
        query.eq('organization_id', organizationId).limit(1000),
      ),
    ),
  ])

  const salesOrders = sales.filter((row) => row.aggregate_type === 'sales_order')
  const salesToday = salesOrders.filter(
    (row) => row.status === 'confirmed' && betweenIso(row.created_at, todayStart, tomorrowStart),
  )
  const salesMonth = salesOrders.filter(
    (row) => row.status === 'confirmed' && betweenIso(row.created_at, monthStart, tomorrowStart),
  )
  const salesPreviousMonth = salesOrders.filter(
    (row) => row.status === 'confirmed' && betweenIso(row.created_at, previousStart, monthStart),
  )
  const quotationsOpen = sales.filter(
    (row) =>
      row.aggregate_type === 'quotation' &&
      (row.status === 'draft' || row.status === 'sent'),
  )
  const ordersPending = salesOrders.filter((row) => row.status === 'confirmed')

  const openReceivables = receivables.filter(
    (row) =>
      row.status === 'open' ||
      row.status === 'partially_paid' ||
      row.status === 'draft',
  )
  const overdueReceivables = openReceivables.filter((row) =>
    beforeDate(row.due_date, today),
  )
  const dueTodayReceivables = openReceivables.filter((row) =>
    sameDate(row.due_date, today),
  )

  const openPayables = payables.filter(
    (row) => row.status === 'approved' || row.status === 'draft',
  )
  const overduePayables = openPayables.filter((row) =>
    beforeDate(row.next_due_date, today),
  )
  const dueTodayPayables = openPayables.filter((row) =>
    sameDate(row.next_due_date, today),
  )

  const activeCustomers = customers.filter((row) => row.status === 'active')
  const newCustomers = activeCustomers.filter((row) =>
    typeof row.created_at === 'string' ? row.created_at >= monthStart : false,
  )

  const activeProducts = products.filter((row) => row.status === 'active')
  const activeVariants = variants.filter((row) => row.status === 'active')

  const inventoryOnHand = sum(inventory, 'qty_on_hand')
  const inventoryReserved = sum(inventory, 'qty_reserved')
  const inventoryCritical = inventory.filter(
    (row) => toNumber(row.qty_on_hand) - toNumber(row.qty_reserved) <= 0,
  )
  const inventoryNegative = inventory.filter((row) => toNumber(row.qty_on_hand) < 0)

  const confirmedPaymentsMonth = payments.filter(
    (row) => row.status === 'confirmed' && betweenIso(row.paid_at, monthStart, tomorrowStart),
  )

  return {
    generatedAt: now.toISOString(),
    salesTodayValue: sum(salesToday, 'grand_total'),
    salesTodayCount: salesToday.length,
    salesMonthValue: sum(salesMonth, 'grand_total'),
    salesMonthCount: salesMonth.length,
    salesPreviousMonthValue: sum(salesPreviousMonth, 'grand_total'),
    quotationsOpenCount: quotationsOpen.length,
    ordersPendingCount: ordersPending.length,
    customersActiveCount: activeCustomers.length,
    customersNewMonthCount: newCustomers.length,
    productsCount: activeProducts.length,
    variantsCount: activeVariants.length,
    inventoryOnHand,
    inventoryReserved,
    inventoryItemCount: inventory.length,
    inventoryCriticalCount: inventoryCritical.length,
    inventoryNegativeCount: inventoryNegative.length,
    inventoryEstimatedValue: 0,
    receivablesOpenAmount: sum(openReceivables, 'open_amount'),
    receivablesPaidAmount: sum(receivables, 'paid_amount'),
    receivablesOverdueAmount: sum(overdueReceivables, 'open_amount'),
    receivablesOverdueCount: overdueReceivables.length,
    receivablesDueTodayAmount: sum(dueTodayReceivables, 'open_amount'),
    payablesOpenAmount: sum(openPayables, 'open_balance'),
    payablesOverdueAmount: sum(overduePayables, 'open_balance'),
    payablesOverdueCount: overduePayables.length,
    payablesDueTodayAmount: sum(dueTodayPayables, 'open_balance'),
    paymentsMonthAmount: sum(confirmedPaymentsMonth, 'net_amount'),
    sourceIssues,
  }
}

function rpcError(error: unknown) {
  const raw = error instanceof Error ? error.message : 'command_center_error'
  if (raw.includes('permission_denied')) {
    return {
      code: 'permission_denied',
      message: 'Você não tem permissão para acessar o Centro de Comando.',
    }
  }
  if (raw.includes('not_authenticated')) {
    return {
      code: 'not_authenticated',
      message: 'Faça login para acessar o Centro de Comando.',
    }
  }
  return {
    code: raw,
    message: 'Não foi possível carregar o Centro de Comando.',
  }
}

async function run<T>(
  work: () => Promise<T>,
): Promise<CommandCenterRpcResult<T>> {
  try {
    return { ok: true, data: await work() }
  } catch (error) {
    return { ok: false, error: rpcError(error) }
  }
}

export const getCommandCenter = createServerFn({ method: 'POST' })
  .inputValidator((data: { organizationId: string }) => data)
  .handler(({ data }): Promise<CommandCenterRpcResult<CommandCenterSnapshot>> =>
    run(async () => buildCommandCenterSnapshot(await loadRawSnapshot(data.organizationId))),
  )
