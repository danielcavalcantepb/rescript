import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { useCreateLocation } from '#/modules/inventory/ui/hooks/use-inventory-foundation'

export function LocationCreatePage() {
  return (
    <RequirePermission
      permission="inventory.locations.manage"
      forbiddenDescription="Você não tem permissão para gerenciar locais."
    >
      <LocationCreateContent />
    </RequirePermission>
  )
}

function LocationCreateContent() {
  const navigate = useNavigate()
  const { currentOrganization, isLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const create = useCreateLocation(organizationId)
  const [code, setCode] = useState('MAIN')
  const [name, setName] = useState('Principal')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('100')
  const [isDefault, setIsDefault] = useState(true)
  const [error, setError] = useState<string | null>(null)

  if (isLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  return (
    <CatalogShell
      title="Novo local"
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Estoque', href: '/catalog/inventory' },
        { label: 'Locais', href: '/catalog/inventory/locations' },
        { label: 'Novo' },
      ]}
    >
      <form
        className="max-w-lg space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (create.isPending) return
          setError(null)
          void create
            .mutateAsync({
              code,
              name,
              description: description.trim() || null,
              priority: Number(priority),
              isDefault,
            })
            .then((location) => {
              notificationService.success('Local criado')
              void navigate({
                to: '/catalog/inventory/locations/$locationId',
                params: { locationId: location.id },
              })
            })
            .catch((err: Error) => {
              setError(err.message || 'Não foi possível criar o local.')
            })
        }}
      >
        <label className="block space-y-1 text-[13px]">
          <span>Código</span>
          <Input
            value={code}
            required
            disabled={create.isPending}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-[13px]">
          <span>Nome</span>
          <Input
            value={name}
            required
            disabled={create.isPending}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-[13px]">
          <span>Descrição</span>
          <Input
            value={description}
            disabled={create.isPending}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-[13px]">
          <span>Prioridade</span>
          <Input
            type="number"
            min={0}
            max={1000}
            value={priority}
            disabled={create.isPending}
            onChange={(e) => setPriority(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={isDefault}
            disabled={create.isPending}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Local padrão
        </label>
        {error ? (
          <p className="text-[13px] text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Salvando…' : 'Criar local'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={create.isPending}
            onClick={() =>
              void navigate({ to: '/catalog/inventory/locations' })
            }
          >
            Cancelar
          </Button>
        </div>
      </form>
    </CatalogShell>
  )
}
