import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { PageHeader } from '#/components/PageHeader'
import { ReceiptForm } from '#/modules/receiving/ui/receipt-form'
import { toFormError, useCreateReceipt } from '#/modules/receiving/ui/use-receiving-queries'
import { RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'

export const Route = createFileRoute('/_app/procurement/receiving/new')({ component: NewReceiptPage })

function NewReceiptPage() {
  const navigate = useNavigate()
  const create = useCreateReceipt()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  return (
    <RequirePermission permission="receiving.create" forbiddenDescription="Você não tem permissão para criar recebimentos.">
      <div className="mx-auto max-w-4xl space-y-5">
        <AppBreadcrumb items={[{ label: 'Compras', href: '/procurement/purchases' }, { label: 'Recebimentos', href: '/procurement/receiving' }, { label: 'Novo recebimento' }]} />
        <PageHeader title="Novo recebimento" description="Selecione o pedido aprovado e o local que receberá os itens." />
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5">
          <ReceiptForm submitting={create.isPending} fieldErrors={fieldErrors} formError={formError} submitLabel="Criar recebimento" onCancel={() => void navigate({ to: '/procurement/receiving' })} onSubmit={async (values) => {
            setFieldErrors({}); setFormError(null)
            try {
              const snapshot = await create.mutateAsync({ purchaseOrderId: values.purchaseOrderId, locationId: values.locationId, notes: values.notes })
              notificationService.success('Recebimento criado.')
              void navigate({ to: '/procurement/receiving/$receiptId', params: { receiptId: snapshot.receipt.id } })
            } catch (error) { const mapped = toFormError(error); setFieldErrors(mapped.fieldErrors); setFormError(mapped.formError) }
          }} />
        </div>
      </div>
    </RequirePermission>
  )
}
