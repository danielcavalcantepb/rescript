import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { PageHeader } from '#/components/PageHeader'
import { PurchaseForm } from '#/modules/purchase/ui/purchase-form'
import {
  toFormError,
  useCreatePurchase,
} from '#/modules/purchase/ui/use-purchase-queries'
import { RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'

export const Route = createFileRoute('/_app/procurement/purchases/new')({
  component: NewPurchasePage,
})

function NewPurchasePage() {
  const navigate = useNavigate()
  const create = useCreatePurchase()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  return (
    <RequirePermission permission="purchase.create" forbiddenDescription="Você não tem permissão para criar pedidos de compra.">
      <div className="mx-auto max-w-4xl space-y-5">
        <AppBreadcrumb items={[{ label: 'Compras', href: '/procurement/purchases' }, { label: 'Novo pedido' }]} />
        <PageHeader title="Novo pedido de compra" description="Defina o fornecedor e os dados iniciais do pedido." />
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5">
          <PurchaseForm
            submitting={create.isPending}
            fieldErrors={fieldErrors}
            formError={formError}
            submitLabel="Criar pedido"
            onCancel={() => void navigate({ to: '/procurement/purchases' })}
            onSubmit={async (values) => {
              setFieldErrors({}); setFormError(null)
              try {
                const order = await create.mutateAsync({ supplierId: values.supplierId, currency: values.currency, notes: values.notes })
                notificationService.success('Pedido criado.')
                void navigate({ to: '/procurement/purchases/$purchaseId', params: { purchaseId: order.id } })
              } catch (error) {
                const mapped = toFormError(error); setFieldErrors(mapped.fieldErrors); setFormError(mapped.formError)
              }
            }}
          />
        </div>
      </div>
    </RequirePermission>
  )
}
