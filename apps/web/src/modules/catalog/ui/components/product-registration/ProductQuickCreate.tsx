import { useEffect, useMemo, useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '#/components/ui/drawer'
import type {
  BrandResponse,
  CategoryResponse,
  ProductResponse,
  UnitOfMeasureResponse,
} from '#/modules/catalog/application'
import { catalogErrorMessage } from '#/modules/catalog/ui/errors/catalog-rpc-errors'
import {
  getCatalogRpcError,
} from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { useCreateProduct } from '#/modules/catalog/ui/hooks/use-create-catalog-product'
import { notificationService } from '#/platform/services'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  brands: BrandResponse[]
  categories: CategoryResponse[]
  units: UnitOfMeasureResponse[]
  onCreated?: (product: ProductResponse) => void
}
const fieldClass =
  'h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-focus)]'

export function ProductQuickCreate({
  open,
  onOpenChange,
  organizationId,
  brands,
  categories,
  units,
  onCreated,
}: Props) {
  const create = useCreateProduct(organizationId)
  const defaultUnitId = useMemo(
    () => units[0]?.id ?? '',
    [units],
  )
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [brandId, setBrandId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setName('')
      setSku('')
      setBrandId('')
      setCategoryId('')
      setError(null)
    }
  }, [open])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!name.trim() || !sku.trim() || !defaultUnitId) {
      setError('Informe nome e SKU. Uma unidade de medida ativa também é necessária.')
      return
    }
    try {
      const product = await create.mutateAsync({
        name: name.trim(),
        sku: sku.trim(),
        unitOfMeasureId: defaultUnitId,
        brandId: brandId || null,
        primaryCategoryId: categoryId || null,
        tracksInventory: false,
      })
      notificationService.success('Produto criado e disponível no catálogo')
      onCreated?.(product)
      onOpenChange(false)
    } catch (cause) {
      const rpc = getCatalogRpcError(cause)
      setError(rpc ? catalogErrorMessage(rpc) : 'Não foi possível criar o produto.')
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Novo produto</DrawerTitle>
          <DrawerDescription>
            Cadastro rápido com os dados essenciais. O produto nasce como rascunho.
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-5">
            <label className="block space-y-1.5 text-sm font-medium">
              Nome <span aria-hidden="true">*</span>
              <input
                autoFocus
                className={fieldClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              SKU <span aria-hidden="true">*</span>
              <input
                className={fieldClass}
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                required
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Categoria
              <select
                className={fieldClass}
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">Sem categoria</option>
                {categories.filter((item) => item.status === 'active').map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Marca
              <select
                className={fieldClass}
                value={brandId}
                onChange={(event) => setBrandId(event.target.value)}
              >
                <option value="">Sem marca</option>
                {brands.filter((item) => item.status === 'active').map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-3 text-xs text-[var(--color-ink-muted)]">
              Status inicial: <strong className="text-[var(--color-ink)]">Rascunho</strong>.
              Publicação e demais configurações continuam no workspace do produto.
            </div>
            {error ? (
              <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>
            ) : null}
          </DrawerBody>
          <div className="flex justify-end gap-2 border-t border-[var(--color-border-soft)] px-5 py-4">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Salvando…' : 'Criar produto'}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

