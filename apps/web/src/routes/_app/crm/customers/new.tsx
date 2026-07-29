import { useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { PageHeader } from '#/components/PageHeader'
import { CustomerForm } from '#/modules/customers/ui/customer-form'
import {
  toFormError,
  useCreateCustomer,
  useCreateCustomerAddress,
} from '#/modules/customers/ui/use-customer-queries'
import { RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'

export const Route = createFileRoute('/_app/crm/customers/new')({
  component: NewCustomerPage,
})

function NewCustomerPage() {
  const navigate = useNavigate()
  const create = useCreateCustomer()
  const createAddress = useCreateCustomerAddress()
  const createdCustomerId = useRef<string | null>(null)
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
            submitting={create.isPending || createAddress.isPending}
            fieldErrors={fieldErrors}
            formError={formError}
            submitLabel="Criar cliente"
            onCancel={() => void navigate({ to: '/crm/customers' })}
            onSubmit={async (values, address) => {
              setFieldErrors({})
              setFormError(null)
              try {
                const customer = createdCustomerId.current
                  ? { id: createdCustomerId.current }
                  : await create.mutateAsync(values)
                createdCustomerId.current = customer.id
                if (address) {
                  await createAddress.mutateAsync({
                    customerId: customer.id,
                    kind: 'shipping',
                    postalCode: address.postalCode,
                    street: address.street,
                    number: address.number || null,
                    complement: address.complement || null,
                    district: address.district || null,
                    city: address.city,
                    state: address.state,
                    isPrimary: true,
                  })
                }
                createdCustomerId.current = null
                notificationService.success('Cliente criado.')
                void navigate({
                  to: '/crm/customers/$customerId',
                  params: { customerId: customer.id },
                })
              } catch (error) {
                const mapped = toFormError(error)
                setFieldErrors(mapped.fieldErrors)
                setFormError(
                  createdCustomerId.current && address
                    ? 'O cliente foi criado, mas não foi possível salvar o endereço. Tente novamente para concluir sem duplicar o cadastro.'
                    : mapped.formError,
                )
              }
            }}
          />
        </div>
      </div>
    </RequirePermission>
  )
}
