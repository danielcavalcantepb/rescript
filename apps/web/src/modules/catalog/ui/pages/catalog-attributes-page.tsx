import { useMemo, useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'
import {
  useCatalogAttributeActions,
  useCatalogAttributes,
} from '#/modules/catalog/ui/hooks/use-catalog-attributes'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { dialogs } from '#/platform/dialogs'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { usePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'

export function CatalogAttributesPage() {
  const { currentOrganization, isLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const query = useCatalogAttributes(
    organizationId,
    currentOrganization?.status === 'active',
  )
  const actions = useCatalogAttributeActions(organizationId)
  const { can } = usePermission()
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [values, setValues] = useState('')
  const attributes = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return (query.data ?? []).filter(
      (attribute) =>
        !term ||
        attribute.name.toLocaleLowerCase('pt-BR').includes(term) ||
        attribute.values.some((value) =>
          value.label.toLocaleLowerCase('pt-BR').includes(term),
        ),
    )
  }, [query.data, search])

  if (isLoading || !organizationId) {
    return <PageLoading label="Carregando atributos…" />
  }

  async function submit() {
    const options = values
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    if (!name.trim() || options.length === 0) return
    try {
      await actions.create.mutateAsync({
        name: name.trim(),
        valueType: 'option',
        options,
        isVariantAxis: true,
        isFilterable: true,
      })
      setName('')
      setValues('')
      notificationService.success('Atributo criado')
    } catch {
      notificationService.error('Não foi possível criar o atributo.')
    }
  }

  async function archiveAttribute(attributeId: string, name: string) {
    const confirmed = await dialogs.confirm({
      title: `Arquivar ${name}?`,
      description:
        'O atributo deixa de estar disponível para novos produtos, mas permanece preservado no histórico.',
      confirmLabel: 'Arquivar',
      tone: 'danger',
    })
    if (!confirmed.confirmed) return
    try {
      await actions.archive.mutateAsync(attributeId)
      notificationService.success('Atributo arquivado')
    } catch {
      notificationService.error('Não foi possível arquivar o atributo.')
    }
  }

  return (
    <CatalogShell
      title="Atributos"
      description="Defina eixos e valores reutilizáveis para variantes e filtros."
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Atributos' },
      ]}
    >
      <CatalogToolbar
        title={`${attributes.length} atributos`}
        description="Valores pertencem ao atributo e são isolados por organização."
      />
      <div className="mb-5 grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 md:grid-cols-3">
        <Input
          aria-label="Buscar atributos"
          placeholder="Buscar atributo ou valor"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {can('catalog.attributes.write') ? (
          <>
            <Input
              aria-label="Nome do atributo"
              placeholder="Ex.: Cor"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div className="flex gap-2">
              <Input
                aria-label="Valores do atributo"
                placeholder="Preto, Branco, Azul"
                value={values}
                onChange={(event) => setValues(event.target.value)}
              />
              <Button
                type="button"
                size="sm"
                disabled={
                  !name.trim() ||
                  !values.trim() ||
                  actions.create.isPending
                }
                onClick={() => void submit()}
              >
                Criar
              </Button>
            </div>
          </>
        ) : null}
      </div>
      {query.isError ? (
        <CatalogErrorState onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <PageLoading label="Carregando atributos…" />
      ) : attributes.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {attributes.map((attribute) => (
            <li
              key={attribute.id}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-[var(--color-ink)]">
                  {attribute.name}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {attribute.status === 'active' ? 'Ativo' : 'Arquivado'}
                  </span>
                  {can('catalog.attributes.write') &&
                  attribute.status === 'active' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={actions.archive.isPending}
                      onClick={() =>
                        void archiveAttribute(attribute.id, attribute.name)
                      }
                    >
                      Arquivar
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {attribute.values.map((value) => (
                  <span
                    key={value.id}
                    className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]"
                  >
                    {value.label}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-secondary)]">
          Nenhum atributo encontrado.
        </p>
      )}
    </CatalogShell>
  )
}
