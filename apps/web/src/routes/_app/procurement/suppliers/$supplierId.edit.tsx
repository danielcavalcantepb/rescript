import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { PageHeader } from '#/components/PageHeader'
import { SupplierForm } from '#/modules/suppliers/ui/supplier-form'
import { toFormError, useSupplier, useUpdateSupplier } from '#/modules/suppliers/ui/use-supplier-queries'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'

export const Route = createFileRoute('/_app/procurement/suppliers/$supplierId/edit')({ component: EditSupplierPage })

function EditSupplierPage() {
  const { supplierId } = Route.useParams()
  const navigate = useNavigate()
  const detail = useSupplier(supplierId)
  const update = useUpdateSupplier(supplierId)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  if (detail.isLoading) return <PageLoading />
  if (detail.isError) return <PageError error={detail.error as Error} onRetry={() => void detail.refetch()} />
  if (!detail.data) return <PageLoading />
  const supplier = detail.data.supplier
  return (
    <RequirePermission permission="suppliers.edit" forbiddenDescription="Você não tem permissão para editar fornecedores.">
      <div className="mx-auto max-w-4xl space-y-5">
        <AppBreadcrumb items={[{ label: 'Compras', href: '/procurement/purchases' }, { label: 'Fornecedores', href: '/procurement/suppliers' }, { label: supplier.legalName, href: `/procurement/suppliers/${supplierId}` }, { label: 'Editar' }]} />
        <PageHeader title={`Editar ${supplier.legalName}`} description="Revise os dados mantendo o contexto do fornecedor." />
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5">
          <SupplierForm lockPersonType initial={{ personType: supplier.personType, legalName: supplier.legalName, tradeName: supplier.tradeName, document: supplier.document, email: supplier.email, phone: supplier.phone, city: supplier.city, notes: supplier.notes }} submitting={update.isPending} fieldErrors={fieldErrors} formError={formError} onCancel={() => void navigate({ to: '/procurement/suppliers/$supplierId', params: { supplierId } })} onSubmit={async (values) => {
            setFieldErrors({}); setFormError(null)
            try {
              await update.mutateAsync({ legalName: values.legalName, tradeName: values.tradeName, document: values.document, email: values.email, phone: values.phone, city: values.city, notes: values.notes })
              notificationService.success('Fornecedor atualizado.')
              void navigate({ to: '/procurement/suppliers/$supplierId', params: { supplierId } })
            } catch (error) { const mapped = toFormError(error); setFieldErrors(mapped.fieldErrors); setFormError(mapped.formError) }
          }} />
        </div>
      </div>
    </RequirePermission>
  )
}
