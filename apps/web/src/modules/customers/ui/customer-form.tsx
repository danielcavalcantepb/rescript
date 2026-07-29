import { useRef, useState, type FormEvent } from 'react'
import type { CreateCustomerInput } from '#/modules/customers/domain/types'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { ButtonLoading } from '#/platform/loading'
import { dialogs } from '#/platform/dialogs'
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

const empty: CustomerFormValues = { legalName: '', shortName: '', tradeName: '', personType: 'PJ', document: '', email: '', phone: '', city: '', notes: '', activate: true }
const emptyAddress: CustomerAddressDraft = { postalCode: '', street: '', number: '', complement: '', district: '', city: '', state: '' }

export function CustomerForm({ initial, submitting, fieldErrors, formError, submitLabel = 'Salvar cliente', onSubmit, onCancel, readOnly, lockPersonType }: {
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
  const isDirty = JSON.stringify(values) !== JSON.stringify(baselineRef.current) || JSON.stringify(address) !== JSON.stringify(emptyAddress)
  const set = <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => setValues((previous) => ({ ...previous, [key]: value }))
  const setAddressValue = <K extends keyof CustomerAddressDraft>(key: K, value: CustomerAddressDraft[K]) => setAddress((previous) => ({ ...previous, [key]: value }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting || readOnly) return
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

  return <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
    <div className="flex gap-1 border-b border-[var(--color-border)]" role="tablist" aria-label="Etapas do cadastro">
      {([{ id: 1, label: 'Informações Gerais' }, { id: 2, label: 'Documentação e Endereço' }] as const).map((item) => <button key={item.id} type="button" role="tab" aria-selected={step === item.id} onClick={() => setStep(item.id)} className={cn('border-b-2 px-3 py-2 text-sm font-medium transition-colors', step === item.id ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]')}>{item.label}</button>)}
    </div>

    {step === 1 ? <section className="space-y-4" aria-label="Informações gerais">
      <div className="flex gap-2" role="group" aria-label="Tipo de pessoa">{(['PJ', 'PF'] as const).map((type) => <button key={type} type="button" disabled={readOnly || submitting || lockPersonType} onClick={() => set('personType', type)} className={cn('rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-medium transition-colors', values.personType === type ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]')}>{type}</button>)}</div>
      <div className="grid gap-3 sm:grid-cols-2"><FormField label="Celular *" error={fieldErrors?.phone}><Input value={values.phone ?? ''} disabled={readOnly || submitting} onChange={(e) => set('phone', e.target.value)} inputMode="tel" /></FormField><FormField label={values.personType === 'PF' ? 'Nome completo *' : 'Razão social *'} error={fieldErrors?.legalName}><Input value={values.legalName} disabled={readOnly || submitting} onChange={(e) => set('legalName', e.target.value)} /></FormField></div>
      <FormField label={values.personType === 'PF' ? 'Nome abreviado *' : 'Nome fantasia *'} error={fieldErrors?.shortName}><Input value={values.shortName ?? values.tradeName ?? ''} disabled={readOnly || submitting} onChange={(e) => { set('shortName', e.target.value); if (values.personType === 'PJ') set('tradeName', e.target.value) }} /></FormField>
      <div className="grid gap-3 sm:grid-cols-2"><FormField label="Como nos conheceu"><Input value={values.acquisitionSourceOther ?? ''} disabled={readOnly || submitting} onChange={(e) => set('acquisitionSourceOther', e.target.value)} placeholder="Ex.: indicação, Instagram" /></FormField>{values.personType === 'PF' ? <FormField label="Sexo"><Input value={values.gender ?? ''} disabled={readOnly || submitting} onChange={(e) => set('gender', e.target.value)} /></FormField> : null}</div>
      <div className="grid gap-3 sm:grid-cols-2"><FormField label="Dia de aniversário"><Input type="number" min="1" max="31" value={values.birthDay ?? ''} disabled={readOnly || submitting} onChange={(e) => set('birthDay', e.target.value ? Number(e.target.value) : null)} /></FormField><FormField label="Mês de aniversário"><Input type="number" min="1" max="12" value={values.birthMonth ?? ''} disabled={readOnly || submitting} onChange={(e) => set('birthMonth', e.target.value ? Number(e.target.value) : null)} /></FormField></div>
      <div className="grid gap-3 sm:grid-cols-2"><FormField label="E-mail" error={fieldErrors?.email}><Input type="email" value={values.email ?? ''} disabled={readOnly || submitting} onChange={(e) => set('email', e.target.value)} /></FormField><FormField label="Instagram"><Input value={values.instagram ?? ''} disabled={readOnly || submitting} onChange={(e) => set('instagram', e.target.value)} placeholder="@usuario" /></FormField></div>
      <FormField label="Observações" error={fieldErrors?.notes}><Textarea value={values.notes ?? ''} disabled={readOnly || submitting} onChange={(e) => set('notes', e.target.value)} rows={3} /></FormField>
      <div className="flex justify-end"><Button type="button" variant="secondary" onClick={() => setStep(2)}>Continuar</Button></div>
    </section> : <section className="space-y-4" aria-label="Documentação e endereço">
      <div className="grid gap-3 sm:grid-cols-2"><FormField label={values.personType === 'PF' ? 'CPF' : 'CNPJ'} error={fieldErrors?.document}><Input value={values.document ?? ''} disabled={readOnly || submitting} onChange={(e) => set('document', e.target.value)} inputMode="numeric" /></FormField>{values.personType === 'PF' ? <FormField label="RG"><Input value={values.rg ?? ''} disabled={readOnly || submitting} onChange={(e) => set('rg', e.target.value)} /></FormField> : <FormField label="Inscrição estadual"><Input value={values.stateRegistration ?? ''} disabled={readOnly || submitting} onChange={(e) => set('stateRegistration', e.target.value)} /></FormField>}</div>
      {values.personType === 'PJ' ? <FormField label="Inscrição municipal"><Input value={values.municipalRegistration ?? ''} disabled={readOnly || submitting} onChange={(e) => set('municipalRegistration', e.target.value)} /></FormField> : null}
      <div className="border-t border-[var(--color-border)] pt-4"><h2 className="text-sm font-semibold">Endereço principal</h2><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Preencha quando já tiver os dados de entrega ou cobrança.</p></div>
      <div className="grid gap-3 sm:grid-cols-3"><FormField label="CEP"><Input value={address.postalCode} disabled={readOnly || submitting} onChange={(e) => setAddressValue('postalCode', e.target.value)} inputMode="numeric" /></FormField><FormField label="Logradouro"><Input value={address.street} disabled={readOnly || submitting} onChange={(e) => setAddressValue('street', e.target.value)} /></FormField><FormField label="Número"><Input value={address.number} disabled={readOnly || submitting} onChange={(e) => setAddressValue('number', e.target.value)} /></FormField></div>
      <div className="grid gap-3 sm:grid-cols-2"><FormField label="Complemento"><Input value={address.complement} disabled={readOnly || submitting} onChange={(e) => setAddressValue('complement', e.target.value)} /></FormField><FormField label="Bairro"><Input value={address.district} disabled={readOnly || submitting} onChange={(e) => setAddressValue('district', e.target.value)} /></FormField></div>
      <div className="grid gap-3 sm:grid-cols-2"><FormField label="Cidade"><Input value={address.city} disabled={readOnly || submitting} onChange={(e) => setAddressValue('city', e.target.value)} /></FormField><FormField label="UF"><Input value={address.state} disabled={readOnly || submitting} onChange={(e) => setAddressValue('state', e.target.value)} maxLength={2} /></FormField></div>
    </section>}

    {!lockPersonType && !readOnly ? <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><input type="checkbox" checked={Boolean(values.activate)} disabled={submitting} onChange={(e) => set('activate', e.target.checked)} />Ativar ao salvar (documento obrigatório)</label> : null}
    {step === 2 && (address.postalCode || address.street || address.city || address.state) && !(address.postalCode && address.street && address.city && address.state) ? <p role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs text-[var(--color-danger)]">Preencha CEP, logradouro, cidade e UF para salvar o endereço.</p> : null}
    {formError ? <p role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs text-[var(--color-danger)]">{formError}</p> : null}
    {!readOnly ? <div className="flex justify-end gap-2 pt-2">{onCancel ? <Button type="button" variant="secondary" disabled={submitting} onClick={() => void handleCancel()}>Cancelar</Button> : null}<Button type="submit" disabled={submitting}>{submitting ? <ButtonLoading label="Salvando…" /> : submitLabel}</Button></div> : null}
  </form>
}
