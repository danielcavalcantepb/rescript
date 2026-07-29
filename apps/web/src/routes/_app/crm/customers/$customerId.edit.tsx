import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { PageHeader } from '#/components/PageHeader'
import { CustomerForm } from '#/modules/customers/ui/customer-form'
import { toFormError, useCustomer, useUpdateCustomer } from '#/modules/customers/ui/use-customer-queries'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'

export const Route = createFileRoute('/_app/crm/customers/$customerId/edit')({ component: EditCustomerPage })

function EditCustomerPage() {
  const { customerId } = Route.useParams()
  const navigate = useNavigate()
  const detail = useCustomer(customerId)
  const update = useUpdateCustomer(customerId)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  if (detail.isLoading) return <PageLoading />
  if (detail.isError) return <PageError error={detail.error as Error} onRetry={() => void detail.refetch()} />
  if (!detail.data) return <PageLoading />
  const customer = detail.data.customer
  return (
    <RequirePermission permission="customers.edit" forbiddenDescription="Você não tem permissão para editar clientes.">
      <div className="mx-auto max-w-4xl space-y-5">
        <AppBreadcrumb items={[{ label: 'Clientes', href: '/crm/customers' }, { label: customer.legalName, href: `/crm/customers/${customerId}` }, { label: 'Editar' }]} />
        <PageHeader title={`Editar ${customer.legalName}`} description="Revise os dados mantendo o contexto do cliente." />
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5">
          <CustomerForm lockPersonType initial={{ personType: customer.personType, legalName: customer.legalName, shortName: customer.shortName, tradeName: customer.tradeName, document: customer.document, email: customer.email, phone: customer.phone, secondaryPhone: customer.secondaryPhone, instagram: customer.instagram, birthDay: customer.birthDay, birthMonth: customer.birthMonth, rg: customer.rg, stateRegistration: customer.stateRegistration, legalRepresentative: customer.legalRepresentative, city: customer.city, notes: customer.notes }} submitting={update.isPending} fieldErrors={fieldErrors} formError={formError} onCancel={() => void navigate({ to: '/crm/customers/$customerId', params: { customerId } })} onSubmit={async (values) => {
            setFieldErrors({}); setFormError(null)
            try {
              await update.mutateAsync({ legalName: values.legalName, tradeName: values.tradeName, document: values.document, email: values.email, phone: values.phone, city: values.city, notes: values.notes })
              notificationService.success('Cliente atualizado.')
              void navigate({ to: '/crm/customers/$customerId', params: { customerId } })
            } catch (error) { const mapped = toFormError(error); setFieldErrors(mapped.fieldErrors); setFormError(mapped.formError) }
          }} />
        </div>
      </div>
    </RequirePermission>
  )
}
