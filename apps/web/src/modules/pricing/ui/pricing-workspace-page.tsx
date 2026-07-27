import { useMemo, useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Select } from '#/components/ui/select'
import { PageHeader } from '#/components/PageHeader'
import { EmptyState } from '#/components/EmptyState'
import { PageLoading } from '#/platform/loading'
import { RequirePermission } from '#/platform/permissions'
import { useOrganization } from '#/platform/organization/organization-context'
import { formatBRL } from '#/lib/format'
import {
  useArchivePriceList,
  useCreatePriceItem,
  useCreatePriceList,
  usePriceItems,
  usePriceLists,
  usePricingVariants,
  useResolvePrice,
} from '#/modules/pricing/ui/use-pricing'

type Tab = 'lists' | 'items' | 'query'
const today = () => new Date().toISOString().slice(0, 10)

export function PricingWorkspacePage() {
  return (
    <RequirePermission
      permission="prices.read"
      forbiddenDescription="Você não tem permissão para acessar Pricing."
    >
      <PricingWorkspaceContent />
    </RequirePermission>
  )
}

function PricingWorkspaceContent() {
  const { currentOrganization, isLoading } = useOrganization()
  const organizationId = currentOrganization?.id ?? ''
  const [tab, setTab] = useState<Tab>('lists')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priceListId, setPriceListId] = useState('')
  const lists = usePriceLists(
    { organizationId, search, status, page: 1, pageSize: 25 },
    Boolean(organizationId),
  )
  const items = usePriceItems(
    {
      organizationId,
      search,
      status,
      priceListId: priceListId || undefined,
      page: 1,
      pageSize: 25,
    },
    Boolean(organizationId) && tab === 'items',
  )

  if (isLoading || !organizationId) return <PageLoading label="Carregando Pricing…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing"
        description="Fonte oficial de preços de venda por variante e tabela."
      />
      <nav className="flex gap-1 border-b" aria-label="Áreas de Pricing">
        {([
          ['lists', 'Tabelas'],
          ['items', 'Itens'],
          ['query', 'Consulta'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`border-b-2 px-4 py-2 text-sm ${tab === value ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)]'}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab !== 'query' ? (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_240px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Produto, variante, SKU ou tabela…"
            aria-label="Pesquisar Pricing"
          />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="archived">Arquivado</option>
            {tab === 'items' ? <option value="removed">Removido</option> : null}
          </Select>
          {tab === 'items' ? (
            <Select value={priceListId} onChange={(event) => setPriceListId(event.target.value)}>
              <option value="">Todas as tabelas</option>
              {lists.data?.items.map((list) => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </Select>
          ) : <span />}
        </div>
      ) : null}

      {tab === 'lists' ? (
        <PriceListsPanel organizationId={organizationId} query={lists} />
      ) : null}
      {tab === 'items' ? (
        <PriceItemsPanel
          organizationId={organizationId}
          query={items}
          lists={lists.data?.items ?? []}
        />
      ) : null}
      {tab === 'query' ? (
        <PriceQueryPanel
          organizationId={organizationId}
          lists={lists.data?.items ?? []}
        />
      ) : null}
    </div>
  )
}

function PriceListsPanel({
  organizationId,
  query,
}: {
  organizationId: string
  query: ReturnType<typeof usePriceLists>
}) {
  const create = useCreatePriceList()
  const archive = useArchivePriceList()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [validFrom, setValidFrom] = useState(today())

  if (query.isLoading) return <PageLoading label="Carregando tabelas…" />
  if (query.isError) return <EmptyState title="Pricing indisponível" description={query.error.message} />
  return (
    <section className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">{query.data?.total ?? 0} tabelas</p>
        <Button onClick={() => setOpen((value) => !value)}>Nova tabela</Button>
      </div>
      {open ? (
        <form
          className="grid gap-3 rounded-md border p-4 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault()
            void create.mutateAsync({
              organizationId, name, code: code.toUpperCase(), currency: 'BRL', validFrom,
            }).then(() => {
              setName(''); setCode(''); setOpen(false)
            })
          }}
        >
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
          <Input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código" />
          <Input required type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
          <Button type="submit" disabled={create.isPending}>Salvar</Button>
        </form>
      ) : null}
      {!query.data?.items.length ? <EmptyState title="Nenhuma tabela" description="Crie a primeira tabela de preços da organização." /> : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b bg-[var(--color-surface-muted)]"><tr>
              {['Nome', 'Código', 'Status', 'Moeda', 'Itens', 'Última atualização', 'Ações'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}
            </tr></thead>
            <tbody>{query.data.items.map((list) => <tr key={list.id} className="border-b last:border-0">
              <td className="px-3 py-2 font-medium">{list.name}</td><td className="px-3 py-2 font-mono">{list.code}</td>
              <td className="px-3 py-2">{list.status}</td><td className="px-3 py-2">{list.currency}</td>
              <td className="px-3 py-2">{list.itemCount}</td><td className="px-3 py-2">{new Date(list.updatedAt).toLocaleString('pt-BR')}</td>
              <td className="px-3 py-2">{list.status === 'active' ? <Button size="sm" variant="secondary" disabled={archive.isPending} onClick={() => void archive.mutateAsync({ organizationId, priceListId: list.id })}>Arquivar</Button> : '—'}</td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function PriceItemsPanel({
  organizationId,
  query,
  lists,
}: {
  organizationId: string
  query: ReturnType<typeof usePriceItems>
  lists: NonNullable<ReturnType<typeof usePriceLists>['data']>['items']
}) {
  const create = useCreatePriceItem()
  const [variantSearch, setVariantSearch] = useState('')
  const variants = usePricingVariants(organizationId, variantSearch)
  const [listId, setListId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [amount, setAmount] = useState('')
  const [minimum, setMinimum] = useState('0')
  const availableVariants = useMemo(() => variants.data ?? [], [variants.data])
  if (query.isLoading) return <PageLoading label="Carregando itens…" />
  if (query.isError) return <EmptyState title="Itens indisponíveis" description={query.error.message} />
  return <section className="space-y-4">
    <form className="grid gap-3 rounded-md border p-4 lg:grid-cols-6" onSubmit={(event) => {
      event.preventDefault()
      void create.mutateAsync({
        organizationId, priceListId: listId, variantId, amount,
        minimumAmount: minimum, validFrom: new Date().toISOString(),
      }).then(() => { setVariantId(''); setAmount(''); setMinimum('0') })
    }}>
      <Select required value={listId} onChange={(e) => setListId(e.target.value)}><option value="">Tabela</option>{lists.filter((l) => l.status === 'active').map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select>
      <Input value={variantSearch} onChange={(e) => setVariantSearch(e.target.value)} placeholder="Buscar variante" />
      <Select required value={variantId} onChange={(e) => setVariantId(e.target.value)}><option value="">Variante</option>{availableVariants.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.sku ?? 'sem SKU'}</option>)}</Select>
      <Input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Preço" />
      <Input required inputMode="decimal" value={minimum} onChange={(e) => setMinimum(e.target.value)} placeholder="Preço mínimo" />
      <Button type="submit" disabled={create.isPending}>Adicionar</Button>
    </form>
    {!query.data?.items.length ? <EmptyState title="Nenhum item" description="Adicione preços vigentes por variante." /> : <div className="overflow-x-auto rounded-md border"><table className="w-full min-w-[900px] text-left text-sm">
      <thead className="border-b bg-[var(--color-surface-muted)]"><tr>{['Produto', 'Variante', 'SKU', 'Tabela', 'Preço', 'Mínimo', 'Vigência', 'Status'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
      <tbody>{query.data.items.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-3 py-2">{item.productName}</td><td className="px-3 py-2">{item.variantName}</td><td className="px-3 py-2 font-mono">{item.sku ?? '—'}</td><td className="px-3 py-2">{item.priceListName}</td><td className="px-3 py-2">{formatBRL(Number(item.amount))}</td><td className="px-3 py-2">{formatBRL(Number(item.minimumAmount))}</td><td className="px-3 py-2">{new Date(item.validFrom).toLocaleDateString('pt-BR')}</td><td className="px-3 py-2">{item.status}</td></tr>)}</tbody>
    </table></div>}
  </section>
}

function PriceQueryPanel({
  organizationId,
  lists,
}: {
  organizationId: string
  lists: NonNullable<ReturnType<typeof usePriceLists>['data']>['items']
}) {
  const resolve = useResolvePrice()
  const [listId, setListId] = useState('')
  const [variantSearch, setVariantSearch] = useState('')
  const [variantId, setVariantId] = useState('')
  const [at, setAt] = useState(new Date().toISOString().slice(0, 16))
  const variants = usePricingVariants(organizationId, variantSearch)
  return <section className="space-y-4">
    <form className="grid gap-3 rounded-md border p-4 md:grid-cols-4" onSubmit={(event) => {
      event.preventDefault()
      void resolve.mutateAsync({ organizationId, priceListId: listId, variantId, at: new Date(at).toISOString() })
    }}>
      <Select required value={listId} onChange={(e) => setListId(e.target.value)}><option value="">Tabela</option>{lists.filter((l) => l.status === 'active').map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select>
      <div><Input value={variantSearch} onChange={(e) => setVariantSearch(e.target.value)} placeholder="Buscar produto ou SKU" /><Select required value={variantId} onChange={(e) => setVariantId(e.target.value)}><option value="">Variante</option>{variants.data?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></div>
      <Input required type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
      <Button type="submit" disabled={resolve.isPending}>Consultar preço</Button>
    </form>
    {resolve.isSuccess ? resolve.data ? <div className="rounded-md border p-5"><p className="text-sm text-[var(--color-text-secondary)]">{resolve.data.priceListName} · {resolve.data.priceListCode}</p><p className="mt-1 text-3xl font-semibold">{formatBRL(Number(resolve.data.amount))}</p><p className="mt-2 text-sm">Preço mínimo: {formatBRL(Number(resolve.data.minimumAmount))}</p></div> : <EmptyState title="Preço não encontrado" description="Não existe item vigente para esta variante, tabela e data." /> : null}
  </section>
}
