import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { useOrganization } from '#/platform/organization/organization-context'
import { RequirePermission } from '#/platform/permissions'
import { listSalesBranches } from '../sales-api'
import { createCommercialSeller, listCommercialSellersForManagement, listSellerMembers } from '../commercial-configuration-api'

const unwrap = <T,>(result: { ok: true; data: T } | { ok: false; error: { message: string } }) => {
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

const displayMoney = (value: string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)

export function SellersPage() {
  return <RequirePermission permission="sellers.manage"><SellersContent /></RequirePermission>
}

function SellersContent() {
  const { currentOrganization } = useOrganization()
  const organizationId = currentOrganization?.id
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ fullName: '', shortName: '', branchId: '', userId: '', commissionRate: '0', salaryAmount: '0', bonusAmount: '0', bonusTargetPercentage: '0' })
  const [error, setError] = useState<string | null>(null)
  const sellers = useQuery({ queryKey: ['commercial', 'sellers', organizationId], enabled: Boolean(organizationId), queryFn: async () => unwrap(await listCommercialSellersForManagement({ data: { organizationId: organizationId! } })) })
  const branches = useQuery({ queryKey: ['commercial', 'branches', organizationId], enabled: Boolean(organizationId), queryFn: async () => unwrap(await listSalesBranches({ data: { organizationId: organizationId! } })) })
  const members = useQuery({ queryKey: ['commercial', 'seller-members', organizationId], enabled: Boolean(organizationId), queryFn: async () => unwrap(await listSellerMembers({ data: { organizationId: organizationId! } })) })
  const create = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('Organização não selecionada.')
      return unwrap(await createCommercialSeller({ data: { organizationId, ...form, branchId: form.branchId || null, userId: form.userId || null } }))
    },
    onSuccess: async () => {
      setForm({ fullName: '', shortName: '', branchId: '', userId: '', commissionRate: '0', salaryAmount: '0', bonusAmount: '0', bonusTargetPercentage: '0' })
      await queryClient.invalidateQueries({ queryKey: ['commercial', 'sellers', organizationId] })
    },
  })
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async () => { setError(null); try { await create.mutateAsync() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível cadastrar o vendedor.') } }

  return <div className="space-y-6">
    <PageHeader title="Vendedores" description="Cadastre o time comercial e disponibilize a atribuição na emissão de pedidos." />
    {error ? <p role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p> : null}
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5">
      <h2 className="font-semibold">Novo vendedor</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">Comissão, salário e bônus ficam registrados para a gestão comercial.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FormField label="Nome completo"><Input value={form.fullName} onChange={(event) => update('fullName', event.target.value)} /></FormField>
        <FormField label="Nome abreviado"><Input value={form.shortName} onChange={(event) => update('shortName', event.target.value)} /></FormField>
        <FormField label="Filial"><select className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm" value={form.branchId} onChange={(event) => update('branchId', event.target.value)}><option value="">Todas as filiais</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></FormField>
        <FormField label="Usuário vinculado"><select className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm" value={form.userId} onChange={(event) => update('userId', event.target.value)}><option value="">Sem vínculo</option>{members.data?.map((member) => <option key={member.userId} value={member.userId}>{member.role} · {member.userId.slice(0, 8)}</option>)}</select></FormField>
        <FormField label="Comissão (%)"><Input inputMode="decimal" value={form.commissionRate} onChange={(event) => update('commissionRate', event.target.value)} /></FormField>
        <FormField label="Salário mensal"><Input inputMode="decimal" value={form.salaryAmount} onChange={(event) => update('salaryAmount', event.target.value)} /></FormField>
        <FormField label="Bônus"><Input inputMode="decimal" value={form.bonusAmount} onChange={(event) => update('bonusAmount', event.target.value)} /></FormField>
        <FormField label="Meta para bônus (%)"><Input inputMode="decimal" value={form.bonusTargetPercentage} onChange={(event) => update('bonusTargetPercentage', event.target.value)} /></FormField>
      </div>
      <div className="mt-5 flex justify-end"><Button disabled={!form.fullName.trim() || !form.shortName.trim() || create.isPending} onClick={() => void submit()}>{create.isPending ? 'Salvando…' : 'Criar vendedor'}</Button></div>
    </section>
    <EntityTable headers={['Nome', 'Filial', 'Usuário vinculado', 'Comissão', 'Salário', 'Bônus']}>
      {sellers.isLoading ? <EntityRow><EntityCell colSpan={6}>Carregando vendedores…</EntityCell></EntityRow> : null}
      {!sellers.isLoading && sellers.data?.length ? sellers.data.map((seller) => <EntityRow key={seller.id}><EntityCell><strong>{seller.fullName}</strong><span className="block text-xs text-[var(--color-muted)]">{seller.shortName}</span></EntityCell><EntityCell>{branches.data?.find((branch) => branch.id === seller.branchId)?.name ?? 'Todas'}</EntityCell><EntityCell>{seller.userId ? seller.userId.slice(0, 8) : 'Não vinculado'}</EntityCell><EntityCell>{seller.commissionRate}%</EntityCell><EntityCell>{displayMoney(seller.salaryAmount)}</EntityCell><EntityCell>{displayMoney(seller.bonusAmount)}</EntityCell></EntityRow>) : null}
      {!sellers.isLoading && !sellers.data?.length ? <EntityRow><EntityCell colSpan={6}>Nenhum vendedor cadastrado.</EntityCell></EntityRow> : null}
    </EntityTable>
  </div>
}
