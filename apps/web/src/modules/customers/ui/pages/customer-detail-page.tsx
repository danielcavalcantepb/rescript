import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EmptyState } from '#/components/EmptyState'
import { PageHeader } from '#/components/PageHeader'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '#/components/ui/dialog'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { customerStatusLabel } from '#/modules/customers/domain/lifecycle'
import type { AddressKind } from '#/modules/customers/domain/types'
import {
  toFormError,
  useActivateCustomer,
  useArchiveCustomer,
  useCreateAddress,
  useCreateContact,
  useCustomer,
  useCustomerHistory,
  useDeactivateCustomer,
  useRemoveAddress,
  useRemoveContact,
  useRestoreCustomer,
} from '#/modules/customers/ui/use-customer-queries'
import { dialogs } from '#/platform/dialogs'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import {
  FeatureGate,
  RequirePermission,
  usePermission,
} from '#/platform/permissions'
import { notificationService } from '#/platform/services'
import { CustomerRpcClientError } from '#/modules/customers/ui/errors/customer-rpc-errors'

export function CustomerDetailPage({ customerId }: { customerId: string }) {
  return (
    <RequirePermission
      permission="customers.read"
      forbiddenDescription="Você não tem permissão para ver clientes."
    >
      <CustomerDetailContent customerId={customerId} />
    </RequirePermission>
  )
}

function CustomerDetailContent({ customerId }: { customerId: string }) {
  const navigate = useNavigate()
  const { can } = usePermission()
  const detail = useCustomer(customerId)
  const history = useCustomerHistory(customerId)
  const activate = useActivateCustomer()
  const deactivate = useDeactivateCustomer()
  const archive = useArchiveCustomer()
  const restore = useRestoreCustomer()
  const createContact = useCreateContact(customerId)
  const removeContact = useRemoveContact(customerId)
  const createAddress = useCreateAddress(customerId)
  const removeAddress = useRemoveAddress(customerId)

  const [contactOpen, setContactOpen] = useState(false)
  const [addressOpen, setAddressOpen] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [addrKind, setAddrKind] = useState<AddressKind>('shipping')
  const [addrPostal, setAddrPostal] = useState('')
  const [addrStreet, setAddrStreet] = useState('')
  const [addrCity, setAddrCity] = useState('')
  const [addrState, setAddrState] = useState('')

  if (detail.isLoading) return <PageLoading />

  if (detail.isError) {
    const err = detail.error
    if (err instanceof CustomerRpcClientError && err.code === 'customer_not_found') {
      return (
        <div>
          <PageHeader title="Cliente não encontrado" />
          <Button asChild variant="secondary">
            <Link to="/crm/customers">Voltar</Link>
          </Button>
        </div>
      )
    }
    return <PageError error={err as Error} onRetry={() => void detail.refetch()} />
  }

  const snapshot = detail.data
  if (!snapshot) return <PageLoading />
  const { customer, contacts, addresses } = snapshot
  const editable = customer.status !== 'archived'

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: 'Clientes', href: '/crm/customers' },
          { label: customer.legalName },
        ]}
      />
      <PageHeader
        title={customer.legalName}
        description={
          customer.tradeName
            ? `${customer.personType} · ${customer.tradeName}`
            : customer.personType
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={customerStatusLabel(customer.status)} />
            {editable && can('customers.edit') ? (
              <Button asChild variant="secondary">
                <Link to="/crm/customers/$customerId/edit" params={{ customerId }}>Editar</Link>
              </Button>
            ) : null}
            {customer.status === 'draft' || customer.status === 'inactive' ? (
              <FeatureGate permission="customers.edit">
                <Button
                  type="button"
                  onClick={() =>
                    void activate.mutateAsync(customerId).then(() =>
                      notificationService.success('Cliente ativado.'),
                    )
                  }
                >
                  Ativar
                </Button>
              </FeatureGate>
            ) : null}
            {customer.status === 'active' ? (
              <FeatureGate permission="customers.edit">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    void deactivate.mutateAsync(customerId).then(() =>
                      notificationService.success('Cliente inativado.'),
                    )
                  }
                >
                  Inativar
                </Button>
              </FeatureGate>
            ) : null}
            {customer.status !== 'archived' ? (
              <FeatureGate permission="customers.archive">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    void dialogs
                      .confirm({
                        title: 'Arquivar cliente?',
                        description: 'O cliente poderá ser restaurado depois.',
                        confirmLabel: 'Arquivar',
                        tone: 'danger',
                      })
                      .then((r) => {
                        if (!r.confirmed) return
                        return archive.mutateAsync(customerId).then(() => {
                          notificationService.success('Cliente arquivado.')
                        })
                      })
                  }
                >
                  Arquivar
                </Button>
              </FeatureGate>
            ) : (
              <FeatureGate permission="customers.restore">
                <Button
                  type="button"
                  onClick={() =>
                    void restore.mutateAsync(customerId).then(() =>
                      notificationService.success('Cliente restaurado.'),
                    )
                  }
                >
                  Restaurar
                </Button>
              </FeatureGate>
            )}
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        <div>
          <div className="text-[var(--color-text-secondary)]">Documento</div>
          <div>{customer.document ?? '—'}</div>
        </div>
        <div>
          <div className="text-[var(--color-text-secondary)]">E-mail</div>
          <div>{customer.email ?? '—'}</div>
        </div>
        <div>
          <div className="text-[var(--color-text-secondary)]">Telefone</div>
          <div>{customer.phone ?? '—'}</div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Contatos</h2>
          {editable ? (
            <FeatureGate permission="customers.contacts.manage">
              <Button type="button" variant="secondary" onClick={() => setContactOpen(true)}>
                Adicionar
              </Button>
            </FeatureGate>
          ) : null}
        </div>
        {contacts.length === 0 ? (
          <EmptyState title="Sem contatos" description="Adicione contatos comerciais." />
        ) : (
          <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">
                    {c.name}
                    {c.isPrimary ? ' · principal' : ''}
                  </div>
                  <div className="text-[var(--color-text-secondary)]">
                    {[c.roleTitle, c.email, c.phone].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {editable ? (
                  <FeatureGate permission="customers.contacts.manage">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        void removeContact.mutateAsync(c.id).then(() =>
                          notificationService.success('Contato removido.'),
                        )
                      }
                    >
                      Remover
                    </Button>
                  </FeatureGate>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Endereços</h2>
          {editable ? (
            <FeatureGate permission="customers.addresses.manage">
              <Button type="button" variant="secondary" onClick={() => setAddressOpen(true)}>
                Adicionar
              </Button>
            </FeatureGate>
          ) : null}
        </div>
        {addresses.length === 0 ? (
          <EmptyState title="Sem endereços" description="Cadastre cobrança e entrega." />
        ) : (
          <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
            {addresses.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">
                    {a.kind}
                    {a.isPrimary ? ' · principal' : ''}
                  </div>
                  <div className="text-[var(--color-text-secondary)]">
                    {a.street}, {a.number ?? 's/n'} — {a.city}/{a.state} · CEP {a.postalCode}
                  </div>
                </div>
                {editable ? (
                  <FeatureGate permission="customers.addresses.manage">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        void removeAddress.mutateAsync(a.id).then(() =>
                          notificationService.success('Endereço removido.'),
                        )
                      }
                    >
                      Remover
                    </Button>
                  </FeatureGate>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Histórico</h2>
        {history.isLoading ? (
          <PageLoading />
        ) : (history.data ?? []).length === 0 ? (
          <EmptyState title="Sem histórico" description="Alterações aparecerão aqui." />
        ) : (
          <ol className="space-y-2 border-l border-[var(--color-border)] pl-4">
            {(history.data ?? []).map((h) => (
              <li key={h.id} className="text-sm">
                <div className="font-medium">{h.action}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {new Date(h.createdAt).toLocaleString('pt-BR')}
                  {h.oldValue || h.newValue
                    ? ` · ${h.oldValue ?? '—'} → ${h.newValue ?? '—'}`
                    : ''}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Button type="button" variant="secondary" onClick={() => void navigate({ to: '/crm/customers' })}>
        Voltar à lista
      </Button>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogTitle>Novo contato</DialogTitle>
          <div className="space-y-3">
            <FormField label="Nome *">
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </FormField>
            <FormField label="E-mail">
              <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </FormField>
            <FormField label="Telefone">
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setContactOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={createContact.isPending}
                onClick={() =>
                  void createContact
                    .mutateAsync({
                      name: contactName,
                      email: contactEmail || null,
                      phone: contactPhone || null,
                      isPrimary: contacts.length === 0,
                    })
                    .then(() => {
                      notificationService.success('Contato adicionado.')
                      setContactOpen(false)
                      setContactName('')
                      setContactEmail('')
                      setContactPhone('')
                    })
                    .catch((error) => {
                      const mapped = toFormError(error)
                      notificationService.error(mapped.formError ?? 'Falha ao salvar.')
                    })
                }
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
        <DialogContent>
          <DialogTitle>Novo endereço</DialogTitle>
          <div className="space-y-3">
            <FormField label="Tipo">
              <select
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                value={addrKind}
                onChange={(e) => setAddrKind(e.target.value as AddressKind)}
              >
                <option value="billing">Cobrança</option>
                <option value="shipping">Entrega</option>
                <option value="other">Outro</option>
              </select>
            </FormField>
            <FormField label="CEP *">
              <Input value={addrPostal} onChange={(e) => setAddrPostal(e.target.value)} />
            </FormField>
            <FormField label="Rua *">
              <Input value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)} />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Cidade *">
                <Input value={addrCity} onChange={(e) => setAddrCity(e.target.value)} />
              </FormField>
              <FormField label="UF *">
                <Input value={addrState} onChange={(e) => setAddrState(e.target.value)} />
              </FormField>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAddressOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={createAddress.isPending}
                onClick={() =>
                  void createAddress
                    .mutateAsync({
                      kind: addrKind,
                      postalCode: addrPostal,
                      street: addrStreet,
                      city: addrCity,
                      state: addrState,
                      isPrimary: true,
                    })
                    .then(() => {
                      notificationService.success('Endereço adicionado.')
                      setAddressOpen(false)
                    })
                    .catch((error) => {
                      const mapped = toFormError(error)
                      notificationService.error(mapped.formError ?? 'Falha ao salvar.')
                    })
                }
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
