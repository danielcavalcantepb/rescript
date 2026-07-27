import { useMemo, useState } from 'react'
import {
  EntityPicker,
  type EntityProvider,
} from '#/components/entity-picker'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '#/components/ui/drawer'
import type {
  Customer,
  CustomerListItem,
} from '#/modules/customers/domain/types'
import { useCustomers } from '#/modules/customers/ui/use-customer-queries'
import { usePermission } from '#/platform/permissions'
import { CustomerQuickCreateForm } from './customer-quick-create-form'

const customerProvider: EntityProvider<CustomerListItem> = {
  id: 'customers',
  singularLabel: 'cliente',
  getId: (customer) => customer.id,
  getLabel: (customer) => customer.legalName,
  getDescription: (customer) =>
    [customer.document, customer.email].filter(Boolean).join(' · ') || null,
}

function toListItem(customer: Customer): CustomerListItem {
  return {
    id: customer.id,
    legalName: customer.legalName,
    tradeName: customer.tradeName,
    document: customer.document,
    email: customer.email,
    phone: customer.phone,
    status: customer.status,
    updatedAt: customer.updatedAt,
  }
}

export function CustomerEntityPicker({
  value,
  disabled,
  onChange,
}: {
  value: CustomerListItem | null
  disabled?: boolean
  onChange: (customer: CustomerListItem | null) => void
}) {
  const { can } = usePermission()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const query = useCustomers(
    { q: search, status: 'all', limit: 20, sort: 'name_asc' },
    { enabled: search.trim().length >= 2 },
  )
  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  )

  return (
    <>
      <EntityPicker
        provider={customerProvider}
        value={value}
        items={items}
        disabled={disabled}
        isLoading={query.isLoading}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={query.hasNextPage}
        canCreate={can('customers.create')}
        placeholder="Busque por nome, documento ou e-mail"
        createLabel="Criar cliente"
        onSearch={setSearch}
        onInputChange={(nextQuery) => {
          if (value && nextQuery !== value.legalName) onChange(null)
        }}
        onLoadMore={() => void query.fetchNextPage()}
        onSelect={onChange}
        onCreate={(name) => {
          setCreateName(name)
          setCreateOpen(true)
        }}
      />

      <Drawer open={createOpen} onOpenChange={setCreateOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Novo cliente</DrawerTitle>
            <DrawerDescription>
              Cadastre somente o necessário para continuar o pedido.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <CustomerQuickCreateForm
              key={`${createOpen}-${createName}`}
              initialName={createName}
              onCancel={() => setCreateOpen(false)}
              onCreated={(customer) => {
                onChange(toListItem(customer))
                setSearch(customer.legalName)
                setCreateOpen(false)
              }}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
