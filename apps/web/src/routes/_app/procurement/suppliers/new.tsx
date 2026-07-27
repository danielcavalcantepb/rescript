import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { PageHeader } from '#/components/PageHeader'
import { SupplierForm } from '#/modules/suppliers/ui/supplier-form'
import {
  toFormError,
  useCreateSupplier,
} from '#/modules/suppliers/ui/use-supplier-queries'
import { RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'

export const Route = createFileRoute('/_app/procurement/suppliers/new')({
  component: NewSupplierPage,
})

function NewSupplierPage() {
  const navigate = useNavigate()
  const create = useCreateSupplier()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  return (
    <RequirePermission
      permission="suppliers.create"
      forbiddenDescription="Você não tem permissão para criar fornecedores."
    >
      <div className="mx-auto max-w-4xl space-y-5">
        <AppBreadcrumb
          items={[
            { label: 'Compras', href: '/procurement/purchases' },
            { label: 'Fornecedores', href: '/procurement/suppliers' },
            { label: 'Novo fornecedor' },
          ]}
        />
        <PageHeader
          title="Novo fornecedor"
          description="Cadastre a identidade e os dados comerciais essenciais."
        />
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5">
          <SupplierForm
            submitting={create.isPending}
            fieldErrors={fieldErrors}
            formError={formError}
            submitLabel="Criar fornecedor"
            onCancel={() => void navigate({ to: '/procurement/suppliers' })}
            onSubmit={async (values) => {
              setFieldErrors({})
              setFormError(null)
              try {
                const supplier = await create.mutateAsync(values)
                notificationService.success('Fornecedor criado.')
                void navigate({
                  to: '/procurement/suppliers/$supplierId',
                  params: { supplierId: supplier.id },
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
