import { useState, type FormEvent } from 'react'
import type {
  CreateAddressInput,
  CreateCustomerInput,
  Customer,
} from '#/modules/customers/domain/types'
import { customerCreateAddress } from '#/modules/customers/ui/customer-api'
import {
  toFormError,
  useCreateCustomer,
} from '#/modules/customers/ui/use-customer-queries'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { ButtonLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { usePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'
import { unwrapCustomerRpc } from '#/modules/customers/ui/errors/customer-rpc-errors'
import { cn } from '#/lib/utils'

type QuickCreateValues = CreateCustomerInput & {
  postalCode: string
  street: string
  number: string
  district: string
  state: string
}

function initialValues(initialName: string): QuickCreateValues {
  return {
    personType: 'PF',
    legalName: initialName,
    document: '',
    email: '',
    phone: '',
    city: '',
    notes: '',
    activate: false,
    postalCode: '',
    street: '',
    number: '',
    district: '',
    state: '',
  }
}

export function CustomerQuickCreateForm({
  initialName,
  onCreated,
  onCancel,
}: {
  initialName: string
  onCreated: (customer: Customer) => void
  onCancel: () => void
}) {
  const { currentOrganization } = useOrganization()
  const { can } = usePermission()
  const create = useCreateCustomer()
  const [values, setValues] = useState(() => initialValues(initialName))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  function set<K extends keyof QuickCreateValues>(
    key: K,
    value: QuickCreateValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const hasAddress = Boolean(
    values.postalCode.trim() ||
      values.street.trim() ||
      values.number.trim() ||
      values.district.trim() ||
      values.state.trim(),
  )
  const canCreateAddress = can('customers.addresses.manage')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setFieldErrors({})
    setFormError(null)

    try {
      const customer = await create.mutateAsync({
        personType: values.personType,
        legalName: values.legalName,
        document: values.document,
        email: values.email,
        phone: values.phone,
        city: values.city,
        notes: values.notes,
        activate: Boolean(values.document?.trim()),
      })

      if (hasAddress && canCreateAddress && currentOrganization) {
        const address: CreateAddressInput = {
          customerId: customer.id,
          kind: 'shipping',
          postalCode: values.postalCode,
          street: values.street,
          number: values.number || null,
          district: values.district || null,
          city: values.city ?? '',
          state: values.state,
          country: 'BR',
          isPrimary: true,
        }
        try {
          unwrapCustomerRpc(
            await customerCreateAddress({
              data: {
                organizationId: currentOrganization.id,
                input: address,
              },
            }),
          )
        } catch {
          notificationService.warning(
            'Cliente criado sem endereço',
            'O pedido pode continuar. Complete o endereço no Workspace do cliente.',
          )
        }
      }

      notificationService.success('Cliente criado e selecionado.')
      onCreated(customer)
    } catch (error) {
      const mapped = toFormError(error)
      setFieldErrors(mapped.fieldErrors)
      setFormError(mapped.formError)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void submit(event)}>
      <div className="flex gap-2" role="group" aria-label="Tipo de pessoa">
        {(['PF', 'PJ'] as const).map((personType) => (
          <button
            key={personType}
            type="button"
            disabled={create.isPending}
            onClick={() => set('personType', personType)}
            className={cn(
              'rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-medium',
              values.personType === personType
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)]',
            )}
          >
            {personType === 'PF' ? 'Pessoa física' : 'Pessoa jurídica'}
          </button>
        ))}
      </div>

      <FormField
        label={values.personType === 'PF' ? 'Nome *' : 'Razão social *'}
        error={fieldErrors.legalName}
      >
        <Input
          autoFocus
          value={values.legalName}
          disabled={create.isPending}
          onChange={(event) => set('legalName', event.target.value)}
        />
      </FormField>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label={values.personType === 'PF' ? 'CPF' : 'CNPJ'}
          error={fieldErrors.document}
        >
          <Input
            value={values.document ?? ''}
            disabled={create.isPending}
            inputMode="numeric"
            onChange={(event) => set('document', event.target.value)}
          />
        </FormField>
        <FormField label="Telefone" error={fieldErrors.phone}>
          <Input
            value={values.phone ?? ''}
            disabled={create.isPending}
            onChange={(event) => set('phone', event.target.value)}
          />
        </FormField>
      </div>

      <FormField label="E-mail" error={fieldErrors.email}>
        <Input
          type="email"
          value={values.email ?? ''}
          disabled={create.isPending}
          onChange={(event) => set('email', event.target.value)}
        />
      </FormField>

      <div className="border-t border-[var(--color-border-soft)] pt-4">
        <h3 className="text-sm font-medium text-[var(--color-ink)]">
          Endereço de entrega
        </h3>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Opcional. Preencha apenas se já tiver os dados.
        </p>
      </div>

      {canCreateAddress ? (
        <>
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <FormField label="CEP" error={fieldErrors.postalCode}>
              <Input
                value={values.postalCode}
                disabled={create.isPending}
                onChange={(event) => set('postalCode', event.target.value)}
              />
            </FormField>
            <FormField label="Endereço" error={fieldErrors.street}>
              <Input
                value={values.street}
                disabled={create.isPending}
                onChange={(event) => set('street', event.target.value)}
              />
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Número">
              <Input
                value={values.number}
                disabled={create.isPending}
                onChange={(event) => set('number', event.target.value)}
              />
            </FormField>
            <FormField label="Bairro">
              <Input
                value={values.district}
                disabled={create.isPending}
                onChange={(event) => set('district', event.target.value)}
              />
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <FormField label="Cidade" error={fieldErrors.city}>
              <Input
                value={values.city ?? ''}
                disabled={create.isPending}
                onChange={(event) => set('city', event.target.value)}
              />
            </FormField>
            <FormField label="Estado" error={fieldErrors.state}>
              <Input
                value={values.state}
                maxLength={2}
                disabled={create.isPending}
                onChange={(event) =>
                  set('state', event.target.value.toUpperCase())
                }
              />
            </FormField>
          </div>
        </>
      ) : (
        <p className="text-xs text-[var(--color-muted)]">
          Seu acesso permite criar o cliente, mas não cadastrar endereços.
        </p>
      )}

      <FormField label="Observações" error={fieldErrors.notes}>
        <Textarea
          rows={3}
          value={values.notes ?? ''}
          disabled={create.isPending}
          onChange={(event) => set('notes', event.target.value)}
        />
      </FormField>

      {formError ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs text-[var(--color-danger)]"
        >
          {formError}
        </p>
      ) : null}

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[var(--color-border-soft)] bg-[var(--color-surface-elevated)] pt-4">
        <Button
          type="button"
          variant="secondary"
          disabled={create.isPending}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? (
            <ButtonLoading label="Criando…" />
          ) : (
            'Criar e selecionar'
          )}
        </Button>
      </div>
    </form>
  )
}
