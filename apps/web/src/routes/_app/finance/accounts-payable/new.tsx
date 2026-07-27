import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { PageHeader } from '#/components/PageHeader'
import { PayableForm } from '#/modules/payable/ui/payable-form'
import { toFormError, useCreatePayable } from '#/modules/payable/ui/use-payable-queries'
import { RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'

export const Route = createFileRoute('/_app/finance/accounts-payable/new')({ component: NewPayablePage })

function NewPayablePage() {
  const navigate = useNavigate()
  const create = useCreatePayable()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  return (
    <RequirePermission permission="payable.create" forbiddenDescription="Você não tem permissão para criar contas a pagar.">
      <div className="mx-auto max-w-4xl space-y-5">
        <AppBreadcrumb items={[{ label: 'Financeiro', href: '/finance/accounts-payable' }, { label: 'Nova conta' }]} />
        <PageHeader title="Nova conta a pagar" description="Crie a obrigação a partir de um recebimento lançado." />
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5">
          <PayableForm submitting={create.isPending} fieldErrors={fieldErrors} formError={formError} submitLabel="Criar conta" onCancel={() => void navigate({ to: '/finance/accounts-payable' })} onSubmit={async (values) => {
            setFieldErrors({}); setFormError(null)
            try {
              const snapshot = await create.mutateAsync(values)
              notificationService.success('Conta a pagar criada.')
              void navigate({ to: '/finance/accounts-payable/$payableId', params: { payableId: snapshot.payable.id } })
            } catch (error) { const mapped = toFormError(error); setFieldErrors(mapped.fieldErrors); setFormError(mapped.formError) }
          }} />
        </div>
      </div>
    </RequirePermission>
  )
}
