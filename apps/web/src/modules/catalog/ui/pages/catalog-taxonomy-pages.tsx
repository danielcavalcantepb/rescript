import { useMemo, useState } from 'react'
import type { BrandResponse, CategoryResponse } from '#/modules/catalog/application'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'
import { useBrandActions, useBrands } from '#/modules/catalog/ui/hooks/use-catalog-brands'
import { useCategories, useCategoryActions } from '#/modules/catalog/ui/hooks/use-catalog-categories'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { usePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'

const selectClassName =
  'h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13px] text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]'

function TaxonomyCard({
  title,
  meta,
  onEdit,
}: {
  title: string
  meta: string
  onEdit?: () => void
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-[var(--color-ink)]">{title}</p>
        <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">{meta}</p>
      </div>
      {onEdit ? <Button type="button" variant="ghost" size="sm" onClick={onEdit}>Editar</Button> : null}
    </li>
  )
}

export function CatalogBrandsPage() {
  const { currentOrganization, isLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const enabled = currentOrganization?.status === 'active'
  const query = useBrands(organizationId, Boolean(organizationId) && enabled)
  const actions = useBrandActions(organizationId)
  const { can } = usePermission()
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<BrandResponse | null>(null)

  if (isLoading || !organizationId) return <PageLoading label="Carregando marcas…" />

  async function submit() {
    const value = name.trim()
    if (!value) return
    try {
      if (editing) await actions.update.mutateAsync({ brandId: editing.id, name: value })
      else await actions.create.mutateAsync(value)
      notificationService.success(editing ? 'Marca atualizada' : 'Marca criada')
      setName('')
      setEditing(null)
    } catch {
      notificationService.error('Não foi possível salvar a marca.')
    }
  }

  return (
    <CatalogShell
      title="Marcas"
      description="Organize o catálogo por marcas consistentes e reutilizáveis."
      breadcrumb={[{ label: 'Central', href: '/' }, { label: 'Catálogo', href: '/catalog' }, { label: 'Marcas' }]}
    >
      <CatalogToolbar title={`${query.data?.length ?? 0} marcas`} description="Disponíveis no cadastro e nos filtros de produtos." />
      {can(editing ? 'products.edit' : 'products.create') ? (
        <div className="mb-5 flex max-w-xl items-end gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
          <label className="min-w-0 flex-1 text-[12px] font-medium text-[var(--color-text-secondary)]">
            {editing ? 'Editar marca' : 'Nova marca'}
            <Input className="mt-1" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void submit() }} />
          </label>
          <Button type="button" size="sm" disabled={!name.trim() || actions.create.isPending || actions.update.isPending} onClick={() => void submit()}>Salvar</Button>
          {editing ? <Button type="button" size="sm" variant="ghost" onClick={() => { setEditing(null); setName('') }}>Cancelar</Button> : null}
        </div>
      ) : null}
      {query.isError ? <CatalogErrorState onRetry={() => void query.refetch()} /> : query.isLoading ? <PageLoading label="Carregando marcas…" /> : query.data?.length ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {query.data.map((brand) => (
            <TaxonomyCard key={brand.id} title={brand.name} meta={brand.status === 'active' ? 'Ativa' : 'Arquivada'} onEdit={can('products.edit') ? () => { setEditing(brand); setName(brand.name) } : undefined} />
          ))}
        </ul>
      ) : <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-secondary)]">Nenhuma marca cadastrada.</p>}
    </CatalogShell>
  )
}

export function CatalogCategoriesPage() {
  const { currentOrganization, isLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const enabled = currentOrganization?.status === 'active'
  const query = useCategories(organizationId, Boolean(organizationId) && enabled)
  const actions = useCategoryActions(organizationId)
  const { can } = usePermission()
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [editing, setEditing] = useState<CategoryResponse | null>(null)
  const categories = useMemo(() => [...(query.data ?? [])].sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name)), [query.data])

  if (isLoading || !organizationId) return <PageLoading label="Carregando categorias…" />

  async function submit() {
    const value = name.trim()
    if (!value) return
    try {
      if (editing) {
        await actions.update.mutateAsync({ categoryId: editing.id, name: value })
        if ((editing.parentId ?? '') !== parentId) await actions.move.mutateAsync({ categoryId: editing.id, newParentId: parentId || null })
      } else {
        await actions.create.mutateAsync({ name: value, parentId: parentId || null })
      }
      notificationService.success(editing ? 'Categoria atualizada' : 'Categoria criada')
      setName('')
      setParentId('')
      setEditing(null)
    } catch {
      notificationService.error('Não foi possível salvar a categoria.')
    }
  }

  return (
    <CatalogShell
      title="Categorias"
      description="Estruture categorias e subcategorias sem perder a hierarquia."
      breadcrumb={[{ label: 'Central', href: '/' }, { label: 'Catálogo', href: '/catalog' }, { label: 'Categorias' }]}
    >
      <CatalogToolbar title={`${categories.length} categorias`} description="A hierarquia é validada pelo domínio e não permite ciclos." />
      {can(editing ? 'products.edit' : 'products.create') ? (
        <div className="mb-5 grid max-w-3xl gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">
            {editing ? 'Editar categoria' : 'Nova categoria'}
            <Input className="mt-1" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">
            Categoria pai
            <select className={`${selectClassName} mt-1`} value={parentId} onChange={(event) => setParentId(event.target.value)}>
              <option value="">Nenhuma — categoria principal</option>
              {categories.filter((category) => category.id !== editing?.id).map((category) => (
                <option key={category.id} value={category.id}>{'— '.repeat(category.depth)}{category.name}</option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={!name.trim() || actions.create.isPending || actions.update.isPending || actions.move.isPending} onClick={() => void submit()}>Salvar</Button>
            {editing ? <Button type="button" size="sm" variant="ghost" onClick={() => { setEditing(null); setName(''); setParentId('') }}>Cancelar</Button> : null}
          </div>
        </div>
      ) : null}
      {query.isError ? <CatalogErrorState onRetry={() => void query.refetch()} /> : query.isLoading ? <PageLoading label="Carregando categorias…" /> : categories.length ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {categories.map((category) => (
            <TaxonomyCard key={category.id} title={`${'— '.repeat(category.depth)}${category.name}`} meta={category.depth === 0 ? 'Categoria principal' : `Subcategoria · nível ${category.depth}`} onEdit={can('products.edit') ? () => { setEditing(category); setName(category.name); setParentId(category.parentId ?? '') } : undefined} />
          ))}
        </ul>
      ) : <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-secondary)]">Nenhuma categoria cadastrada.</p>}
    </CatalogShell>
  )
}
