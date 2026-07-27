import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { PageHeader } from '#/components/PageHeader'
import { CustomerForm } from '#/modules/customers/ui/customer-form'
import {
  toFormError,
  useCreateCustomer,
} from '#/modules/customers/ui/use-customer-queries'
import { RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'

export const Route = createFileRoute('/_app/crm/customers/new')({
  component: NewCustomerPage,
})

function NewCustomerPage() {
  const navigate = useNavigate()
  const create = useCreateCustomer()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  return (
    <RequirePermission
      permission="customers.create"
      forbiddenDescription="Você não tem permissão para criar clientes."
    >
      <div className="mx-auto max-w-4xl space-y-5">
        <AppBreadcrumb
          items={[
            { label: 'Clientes', href: '/crm/customers' },
            { label: 'Novo cliente' },
          ]}
        />
        <PageHeader
          title="Novo cliente"
          description="Cadastre a identidade e os dados comerciais essenciais."
        />
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5">
          <CustomerForm
            submitting={create.isPending}
            fieldErrors={fieldErrors}
            formError={formError}
            submitLabel="Criar cliente"
            onCancel={() => void navigate({ to: '/crm/customers' })}
            onSubmit={async (values) => {
              setFieldErrors({})
              setFormError(null)
              try {
                const customer = await create.mutateAsync(values)
                notificationService.success('Cliente criado.')
                void navigate({
                  to: '/crm/customers/$customerId',
                  params: { customerId: customer.id },
                })
              } catch (error) {
                const mapped = toFormError(error)
                setFieldErrors(mapped.fieldErrors)
                setFormError(mapped.formError)
              }
            }}
          />
        </div>
      </div>
    </RequirePermission>
  )
}
