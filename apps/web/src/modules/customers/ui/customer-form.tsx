import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { CreateCustomerInput } from '#/modules/customers/domain/types'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { ButtonLoading } from '#/platform/loading'
import { dialogs } from '#/platform/dialogs'
import { validateCreateCustomer } from '#/modules/customers/domain/validation'
import { cn } from '#/lib/utils'

export type CustomerFormValues = CreateCustomerInput
export type CustomerAddressDraft = {
  postalCode: string
  street: string
  number: string
  complement: string
  district: string
  city: string
  state: string
}

type PostalCodeResponse = {
  erro?: boolean
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
}

const empty: CustomerFormValues = {
  legalName: '', shortName: '', tradeName: '', personType: 'PJ', document: '', email: '', phone: '', city: '', notes: '', activate: true,
}
const emptyAddress: CustomerAddressDraft = {
  postalCode: '', street: '', number: '', complement: '', district: '', city: '', state: '',
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ''
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}${digits.length > 6 ? `-${digits.slice(6)}` : ''}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  return digits.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2')
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14)
  return digits.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2')
}

function formatPostalCode(value: string) {
  const digits = onlyDigits(value).slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

function formatInstagram(value: string) {
  const handle = value.replace(/^@+/, '').replace(/\s/g, '')
  return handle ? `@${handle}` : ''
}

const genderOptions = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
] as const

export function CustomerForm({
  initial,
  submitting,
  fieldErrors,
  formError,
  submitLabel = 'Salvar cliente',
  onSubmit,
  onCancel,
  readOnly,
  lockPersonType,
}: {
  initial?: Partial<CustomerFormValues>
  submitting?: boolean
  fieldErrors?: Record<string, string>
  formError?: string | null
  submitLabel?: string
  onSubmit: (values: CustomerFormValues, address?: CustomerAddressDraft) => void | Promise<void>
  onCancel?: () => void
  readOnly?: boolean
  lockPersonType?: boolean
}) {
  const baselineRef = useRef<CustomerFormValues>({ ...empty, ...initial })
  const [values, setValues] = useState<CustomerFormValues>(() => ({ ...empty, ...initial }))
  const [address, setAddress] = useState<CustomerAddressDraft>(() => ({ ...emptyAddress, city: initial?.city ?? '' }))
  const [step, setStep] = useState<1 | 2>(1)
  const [postalCodeFeedback, setPostalCodeFeedback] = useState<string | null>(null)
  const [localFieldErrors, setLocalFieldErrors] = useState<Record<string, string>>({})
  const visibleFieldErrors = { ...fieldErrors, ...localFieldErrors }
  const isDirty = JSON.stringify(values) !== JSON.stringify(baselineRef.current) || JSON.stringify(address) !== JSON.stringify(emptyAddress)
  const postalCodeDigits = onlyDigits(address.postalCode)
  const set = <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => {
    setValues((previous) => ({ ...previous, [key]: value }))
    setLocalFieldErrors((previous) => {
      if (!(key in previous)) return previous
      const { [key]: _cleared, ...remaining } = previous
      return remaining
    })
  }
  const setAddressValue = <K extends keyof CustomerAddressDraft>(key: K, value: CustomerAddressDraft[K]) => {
    setAddress((previous) => ({ ...previous, [key]: value }))
    if (key === 'city') set('city', value as CustomerFormValues['city'])
  }

  useEffect(() => {
    if (postalCodeDigits.length !== 8) {
      setPostalCodeFeedback(null)
      return
    }

    const controller = new AbortController()
    const lookupPostalCode = async () => {
      setPostalCodeFeedback('Buscando endereço…')
      try {
        const response = await fetch(`https://viacep.com.br/ws/${postalCodeDigits}/json/`, { signal: controller.signal })
        if (!response.ok) throw new Error('postal_code_lookup_failed')
        const result = await response.json() as PostalCodeResponse
        if (result.erro) {
          setPostalCodeFeedback('CEP não localizado. Preencha o endereço manualmente.')
          return
        }
        setAddress((previous) => ({
          ...previous,
          street: result.logradouro || previous.street,
          district: result.bairro || previous.district,
          city: result.localidade || previous.city,
          state: result.uf || previous.state,
        }))
        if (result.localidade) set('city', result.localidade)
        setPostalCodeFeedback(null)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setPostalCodeFeedback('Não foi possível consultar o CEP. Você pode preencher manualmente.')
      }
    }
    void lookupPostalCode()
    return () => controller.abort()
  }, [postalCodeDigits])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting || readOnly) return
    const customerErrors = validateCreateCustomer(values)
    if (Object.keys(customerErrors).length > 0) {
      setLocalFieldErrors(customerErrors)
      const documentIsInvalid = Boolean(customerErrors.document)
      setStep(documentIsInvalid ? 2 : 1)
      return
    }
    setLocalFieldErrors({})
    const addressStarted = address.postalCode || address.street || address.city || address.state
    const addressComplete = address.postalCode && address.street && address.city && address.state
    if (addressStarted && !addressComplete) {
      setStep(2)
      return
    }
    await onSubmit(values, addressComplete ? address : undefined)
  }

  async function handleCancel() {
    if (!onCancel) return
    if (!isDirty || submitting) return onCancel()
    const result = await dialogs.confirm({ title: 'Descartar alterações?', description: 'As mudanças não salvas serão perdidas.', confirmLabel: 'Descartar', tone: 'danger' })
    if (result.confirmed) onCancel()
  }

  const personIsIndividual = values.personType === 'PF'

  return <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
    <div className="flex gap-1 border-b border-[var(--color-border)]" role="tablist" aria-label="Etapas do cadastro">
      {([{ id: 1, label: 'Informações Gerais' }, { id: 2, label: 'Documentação e Endereço' }] as const).map((item) => <button key={item.id} type="button" role="tab" aria-selected={step === item.id} onClick={() => setStep(item.id)} className={cn('border-b-2 px-3 py-2 text-sm font-medium transition-colors', step === item.id ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]')}>{item.label}</button>)}
    </div>

    {step === 1 ? <section className="space-y-4" aria-label="Informações gerais">
      <div className="flex gap-2" role="group" aria-label="Tipo de pessoa">{(['PJ', 'PF'] as const).map((type) => <button key={type} type="button" disabled={readOnly || submitting || lockPersonType} onClick={() => set('personType', type)} className={cn('rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-medium transition-colors', values.personType === type ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]')}>{type}</button>)}</div>
      <div className="grid gap-3 sm:grid-cols-2"><FormField label={personIsIndividual ? 'Celular *' : 'Telefone *'} error={visibleFieldErrors.phone}><Input value={values.phone ?? ''} disabled={readOnly || submitting} onChange={(event) => set('phone', formatPhone(event.target.value))} inputMode="tel" placeholder="(00) 00000-0000" /></FormField><FormField label={personIsIndividual ? 'Nome completo *' : 'Razão social *'} error={visibleFieldErrors.legalName}><Input value={values.legalName} disabled={readOnly || submitting} onChange={(event) => set('legalName', event.target.value)} /></FormField></div>
      <FormField label={personIsIndividual ? 'Nome abreviado *' : 'Nome fantasia *'} error={visibleFieldErrors.shortName}><Input value={values.shortName ?? values.tradeName ?? ''} disabled={readOnly || submitting} onChange={(event) => { set('shortName', event.target.value); if (!personIsIndividual) set('tradeName', event.target.value) }} /></FormField>
      {personIsIndividual ? <><div className="grid gap-3 sm:grid-cols-2"><FormField label="Como nos conheceu"><Input value={values.acquisitionSourceOther ?? ''} disabled={readOnly || submitting} onChange={(event) => set('acquisitionSourceOther', event.target.value)} placeholder="Ex.: indicação, Instagram" /></FormField><FormField label="Sexo"><select aria-label="Sexo" value={values.gender ?? ''} disabled={readOnly || submitting} onChange={(event) => set('gender', event.target.value || null)} className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] outline-none transition-colors focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"><option value="">Selecione</option>{genderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FormField></div><div className="grid gap-3 sm:grid-cols-2"><FormField label="Dia do aniversário"><Input type="number" min="1" max="31" value={values.birthDay ?? ''} disabled={readOnly || submitting} onChange={(event) => set('birthDay', event.target.value ? Number(event.target.value) : null)} /></FormField><FormField label="Mês do aniversário"><Input type="number" min="1" max="12" value={values.birthMonth ?? ''} disabled={readOnly || submitting} onChange={(event) => set('birthMonth', event.target.value ? Number(event.target.value) : null)} /></FormField></div></> : null}
      <div className="grid gap-3 sm:grid-cols-2"><FormField label="E-mail" error={visibleFieldErrors.email}><Input type="email" value={values.email ?? ''} disabled={readOnly || submitting} onChange={(event) => set('email', event.target.value)} /></FormField><FormField label="Instagram"><Input value={formatInstagram(values.instagram ?? '')} disabled={readOnly || submitting} onChange={(event) => set('instagram', event.target.value.replace(/^@+/, ''))} placeholder="@usuario" /></FormField></div>
      <FormField label="Observações" error={visibleFieldErrors.notes}><Textarea value={values.notes ?? ''} disabled={readOnly || submitting} onChange={(event) => set('notes', event.target.value)} rows={3} /></FormField>
    </section> : <section className="space-y-4" aria-label="Documentação e endereço">
      <div className="grid gap-3 sm:grid-cols-2"><FormField label={personIsIndividual ? 'CPF' : 'CNPJ'} error={visibleFieldErrors.document}><Input value={personIsIndividual ? formatCpf(values.document ?? '') : formatCnpj(values.document ?? '')} disabled={readOnly || submitting} onChange={(event) => set('document', personIsIndividual ? formatCpf(event.target.value) : formatCnpj(event.target.value))} inputMode="numeric" placeholder={personIsIndividual ? '000.000.000-00' : '00.000.000/0000-00'} /></FormField>{personIsIndividual ? <FormField label="RG"><Input value={values.rg ?? ''} disabled={readOnly || submitting} onChange={(event) => set('rg', event.target.value)} /></FormField> : <FormField label="Inscrição estadual"><Input value={values.stateRegistration ?? ''} disabled={readOnly || submitting} onChange={(event) => set('stateRegistration', event.target.value)} /></FormField>}</div>
      {!personIsIndividual ? <FormField label="Inscrição municipal"><Input value={values.municipalRegistration ?? ''} disabled={readOnly || submitting} onChange={(event) => set('municipalRegistration', event.target.value)} /></FormField> : null}
      <div className="border-t border-[var(--color-border)] pt-4"><h2 className="text-sm font-semibold">Endereço principal</h2><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Consulte o CEP ou preencha manualmente os dados de entrega e cobrança.</p></div>
      <div className="grid gap-3 sm:grid-cols-3"><FormField label="CEP"><Input value={address.postalCode} disabled={readOnly || submitting} onChange={(event) => setAddressValue('postalCode', formatPostalCode(event.target.value))} inputMode="numeric" placeholder="00000-000" /></FormField><FormField label="Logradouro"><Input value={address.street} disabled={readOnly || submitting} onChange={(event) => setAddressValue('street', event.target.value)} /></FormField><FormField label="Número"><Input value={address.number} disabled={readOnly || submitting} onChange={(event) => setAddressValue('number', event.target.value)} /></FormField></div>
      {postalCodeFeedback ? <p aria-live="polite" className="text-xs text-[var(--color-text-secondary)]">{postalCodeFeedback}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2"><FormField label="Complemento"><Input value={address.complement} disabled={readOnly || submitting} onChange={(event) => setAddressValue('complement', event.target.value)} /></FormField><FormField label="Bairro"><Input value={address.district} disabled={readOnly || submitting} onChange={(event) => setAddressValue('district', event.target.value)} /></FormField></div>
      <div className="grid gap-3 sm:grid-cols-2"><FormField label="Cidade"><Input value={address.city} disabled={readOnly || submitting} onChange={(event) => setAddressValue('city', event.target.value)} /></FormField><FormField label="UF"><Input value={address.state} disabled={readOnly || submitting} onChange={(event) => setAddressValue('state', event.target.value.toUpperCase())} maxLength={2} /></FormField></div>
    </section>}

    {!lockPersonType && !readOnly ? <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><input type="checkbox" checked={Boolean(values.activate)} disabled={submitting} onChange={(event) => set('activate', event.target.checked)} />Ativar ao salvar (documento obrigatório)</label> : null}
    {step === 2 && (address.postalCode || address.street || address.city || address.state) && !(address.postalCode && address.street && address.city && address.state) ? <p role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs text-[var(--color-danger)]">Preencha CEP, logradouro, cidade e UF para salvar o endereço.</p> : null}
    {formError ? <p role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs text-[var(--color-danger)]">{formError}</p> : null}
    {!readOnly ? <div className="flex flex-wrap justify-end gap-2 pt-2">{onCancel ? <Button type="button" variant="secondary" disabled={submitting} onClick={() => void handleCancel()}>Cancelar</Button> : null}{step === 2 ? <Button type="button" variant="secondary" disabled={submitting} onClick={() => setStep(1)}>Anterior</Button> : <Button type="button" disabled={submitting} onClick={() => setStep(2)}>Próximo</Button>}{step === 2 ? <Button type="submit" disabled={submitting}>{submitting ? <ButtonLoading label="Salvando…" /> : submitLabel}</Button> : null}</div> : null}
  </form>
}
