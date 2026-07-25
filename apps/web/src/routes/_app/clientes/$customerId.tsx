import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { PageHeader } from '#/components/PageHeader'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/components/ui/dialog'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import { usePermission } from '#/platform/permissions/permission-context'
import {
  FeatureGate,
  RequirePermission,
} from '#/platform/permissions/guards'
import { PageLoading } from '#/platform/loading'
import { PageError } from '#/platform/errors'
import { dialogs } from '#/platform/dialogs'
import { notificationService } from '#/platform/services'
import {
  CustomerNotFoundError,
  CustomerPermissionError,
  getCustomer,
  supabaseCustomerRepository,
} from '#/modules/customers'
import { CustomerForm } from '#/modules/customers/ui/customer-form'
import {
  toFormError,
  useCustomerActions,
} from '#/modules/customers/ui/use-customer-actions'

export const Route = createFileRoute('/_app/clientes/$customerId')({
  component: CustomerDetailPage,
})

function CustomerDetailPage() {
  return (
    <RequirePermission
      permission="customers.read"
      forbiddenDescription="Você não tem permissão para ver clientes."
    >
      <CustomerDetailContent />
    </RequirePermission>
  )
}

function CustomerDetailContent() {
  const { customerId } = Route.useParams()
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const { can } = usePermission()
  const { update, archive, restore } = useCustomerActions()
  const [editOpen, setEditOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const organizationId = currentOrganization?.id

  const detailQuery = useQuery({
    queryKey: queryKeys.customers.detail(organizationId ?? 'none', customerId),
    enabled: Boolean(organizationId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return getCustomer({
        repository: supabaseCustomerRepository,
        can,
        organizationId,
        customerId,
      })
    },
  })

  if (!organizationId || detailQuery.isLoading) {
    return <PageLoading />
  }

  if (detailQuery.isError) {
    const err = detailQuery.error
    // Same UX for missing / other-tenant / denied — do not reveal existence.
    if (
      err instanceof CustomerNotFoundError ||
      err instanceof CustomerPermissionError
    ) {
      return (
        <div>
          <PageHeader title="Cliente não encontrado" />
          <Button asChild variant="secondary">
            <Link to="/clientes">Voltar</Link>
          </Button>
        </div>
      )
    }
    return (
      <PageError
        error={err as Error}
        onRetry={() => void detailQuery.refetch()}
        onRecover={() => void navigate({ to: '/clientes' })}
      />
    )
  }

  const customer = detailQuery.data
  if (!customer) {
    return (
      <div>
        <PageHeader title="Cliente não encontrado" />
        <Button asChild variant="secondary">
          <Link to="/clientes">Voltar</Link>
        </Button>
      </div>
    )
  }

  const archived = customer.status === 'inactive'
  const canEdit = can('customers.edit') || can('customers.write')

  return (
    <div>
      <AppBreadcrumb
        items={[
          { label: 'Clientes', href: '/clientes' },
          { label: customer.name },
        ]}
      />
      <PageHeader
        title={customer.name}
        description={`${customer.personType}${customer.document ? ` · ${customer.document}` : ''}`}
        actions={
          <>
            <StatusBadge status={archived ? 'Arquivado' : 'Ativo'} />
            {canEdit && !archived ? (
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                Editar
              </Button>
            ) : null}
            {canEdit && !archived ? (
              <Button
                variant="danger"
                onClick={() => {
                  void dialogs
                    .confirm({
                      title: 'Arquivar cliente?',
                      description:
                        'O cliente sairá das listas ativas. O histórico permanece.',
                      confirmLabel: 'Arquivar',
                      tone: 'danger',
                    })
                    .then(async (result) => {
                      if (!result.confirmed) return
                      try {
                        await archive.mutateAsync(customer.id)
                        notificationService.success('Cliente arquivado')
                        void detailQuery.refetch()
                      } catch {
                        notificationService.error('Não foi possível arquivar')
                      }
                    })
                }}
              >
                Arquivar
              </Button>
            ) : null}
            {canEdit && archived ? (
              <Button
                onClick={() => {
                  void restore
                    .mutateAsync(customer.id)
                    .then(() => {
                      notificationService.success('Cliente restaurado')
                      void detailQuery.refetch()
                    })
                    .catch(() =>
                      notificationService.error('Não foi possível restaurar'),
                    )
                }}
              >
                Restaurar
              </Button>
            ) : null}
            <FeatureGate permission="sales.create">
              <Button asChild variant="secondary" disabled={archived}>
                <Link to="/vendas">Nova venda</Link>
              </Button>
            </FeatureGate>
          </>
        }
      />

      {archived ? (
        <p className="mb-4 rounded-[var(--radius-md)] bg-[var(--color-warning-bg)] px-3 py-2 text-[13px] text-[var(--color-warning)]">
          Cliente arquivado — somente leitura até restaurar.
        </p>
      ) : null}

      <section className="max-w-xl rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h2 className="text-sm font-medium text-[var(--color-ink-muted)] uppercase">
          Dados
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="E-mail" value={customer.email ?? '—'} />
          <Row label="Telefone" value={customer.phone ?? '—'} />
          <Row label="Cidade" value={customer.city ?? '—'} />
          <Row label="Observações" value={customer.notes ?? '—'} />
        </dl>
      </section>

      <p className="mt-6 text-[13px] text-[var(--color-muted)]">
        Histórico de vendas estará disponível quando o módulo Sales for
        implementado.
      </p>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>
            Alterações não afetam vendas históricas (quando existirem).
          </DialogDescription>
          <div className="mt-4">
            <CustomerForm
              initial={{
                name: customer.name,
                tradeName: customer.tradeName,
                personType: customer.personType,
                document: customer.document,
                email: customer.email,
                phone: customer.phone,
                city: customer.city,
                notes: customer.notes,
              }}
              submitting={update.isPending}
              fieldErrors={fieldErrors}
              formError={formError}
              submitLabel="Salvar"
              onCancel={() => setEditOpen(false)}
              onSubmit={async (values) => {
                setFieldErrors({})
                setFormError(null)
                try {
                  await update.mutateAsync({
                    customerId: customer.id,
                    input: values,
                  })
                  notificationService.success('Cliente atualizado')
                  setEditOpen(false)
                  void detailQuery.refetch()
                } catch (error) {
                  const mapped = toFormError(error)
                  setFieldErrors(mapped.fieldErrors)
                  setFormError(mapped.formError)
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--color-ink-muted)]">{label}</dt>
      <dd className="mt-0.5 text-[var(--color-ink)]">{value}</dd>
    </div>
  )
}
