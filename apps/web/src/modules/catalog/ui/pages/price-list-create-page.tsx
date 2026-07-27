import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { catalogErrorMessage } from '#/modules/catalog/ui/errors/catalog-rpc-errors'
import { getCatalogRpcError } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { useCreatePriceList } from '#/modules/catalog/ui/hooks/use-catalog-pricing'
import { MONEY_CURRENCIES } from '#/modules/catalog/domain/value-objects/money'

export function PriceListCreatePage() {
  return (
    <RequirePermission
      permission="prices.create"
      forbiddenDescription="Você não tem permissão para criar listas de preço."
    >
      <PriceListCreateContent />
    </RequirePermission>
  )
}

function PriceListCreateContent() {
  const navigate = useNavigate()
  const { currentOrganization, isLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const create = useCreatePriceList(organizationId)
  const [name, setName] = useState('Padrão')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('100')
  const [isDefault, setIsDefault] = useState(true)
  const [currency, setCurrency] = useState<(typeof MONEY_CURRENCIES)[number]>('BRL')
  const [error, setError] = useState<string | null>(null)

  if (isLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  return (
    <CatalogShell
      title="Nova lista de preço"
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Listas de preço', href: '/catalog/price-lists' },
        { label: 'Nova' },
      ]}
    >
      <form
        className="max-w-lg space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (create.isPending) return
          setError(null)
          void create
            .mutateAsync({
              name,
              description: description.trim() || null,
              priority: Number(priority),
              isDefault,
              currency,
            })
            .then((list) => {
              notificationService.success('Lista criada')
              void navigate({
                to: '/catalog/price-lists/$priceListId',
                params: { priceListId: list.id },
              })
            })
            .catch((err) => {
              const rpc = getCatalogRpcError(err)
              setError(
                rpc
                  ? catalogErrorMessage(rpc)
                  : 'Não foi possível criar a lista.',
              )
            })
        }}
      >
        <Field label="Nome" htmlFor="pl-name">
          <Input
            id="pl-name"
            value={name}
            required
            disabled={create.isPending}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Descrição" htmlFor="pl-desc">
          <Input
            id="pl-desc"
            value={description}
            disabled={create.isPending}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Prioridade" htmlFor="pl-priority">
          <Input
            id="pl-priority"
            type="number"
            min={0}
            max={1000}
            value={priority}
            disabled={create.isPending}
            onChange={(e) => setPriority(e.target.value)}
          />
        </Field>
        <Field label="Moeda" htmlFor="pl-currency">
          <select
            id="pl-currency"
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[14px]"
            value={currency}
            disabled={create.isPending}
            onChange={(e) =>
              setCurrency(e.target.value as (typeof MONEY_CURRENCIES)[number])
            }
          >
            {MONEY_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={isDefault}
            disabled={create.isPending}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Definir como lista padrão
        </label>
        {error ? (
          <p role="alert" className="text-[13px] text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Salvando…' : 'Criar lista'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={create.isPending}
            onClick={() => void navigate({ to: '/catalog/price-lists' })}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </CatalogShell>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-[12px] text-[var(--color-text-secondary)]"
      >
        {label}
      </label>
      {children}
    </div>
  )
}
